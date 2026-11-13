"""HWS945 file discovery and validated, atomic downloads (no database writes)."""
from __future__ import annotations

import hashlib
import http.cookiejar
import http.client
import ipaddress
import json
import os
import time
import threading
import socket
import ssl
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPCookieProcessor, ProxyHandler, Request, build_opener

import requests

ELEMENTS = {"wind": ("gust", "wdir", "wspd"), "wave": ("dire", "perd", "sigh")}
KINDS = {"wind": "atmo", "wave": "wave"}
DEFAULT_TEMPLATE = "{base_url}/ncfile_12z/{kind}/{date}/{element}_{date}_{cycle}.nc"
_NETCDF_LOCK = threading.RLock()  # netCDF/HDF5 C libraries are not thread-safe.


class PooledResponse:
    """urllib-compatible streaming response backed by a persistent HTTP pool."""
    def __init__(self, response):
        self.response = response
        self.status = response.status_code
        self.headers = response.headers
        self.url = response.url
    def read(self, size=None):
        return self.response.raw.read(size)
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.close()
    def close(self):
        self.response.close()


class DirectResponse:
    def __init__(self, connection, response, url):
        self.connection, self.response = connection, response
        self.status, self.headers, self.url = response.status, response.headers, url
    def read(self, size=None):
        return self.response.read(size)
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.close()
    def close(self):
        self.response.close()
        self.connection.close()


class Source:
    def __init__(self, config: dict | None = None, no_proxy: bool = False):
        self.config = dict(config or {})
        self.base_url = self.config.get("base_url", "https://www.hws945.com").rstrip("/")
        self.timeout = int(self.config.get("timeout_seconds", 30))
        self.retries = int(self.config.get("retries", 3))
        self.no_proxy = no_proxy
        self._sessions = threading.local()
        self._rate_lock = threading.Lock()
        self._next_request = 0.0
        self.resolved_ip = self.config.get("resolved_ip")
        if not self.resolved_ip and self.config.get("resolve_with_alidns"):
            try:
                hostname = urlparse(self.base_url).hostname
                resolver = build_opener(ProxyHandler({})) if no_proxy else build_opener()
                with resolver.open("https://dns.alidns.com/resolve?" + urlencode({"name": hostname, "type": "A"}), timeout=10) as response:
                    data = json.loads(response.read(10000))
                self.resolved_ip = next(a["data"] for a in data.get("Answer", []) if a.get("type") == 1
                                        and ipaddress.ip_address(a["data"]).is_global)
            except Exception:
                logging.getLogger("hws945").warning("Public source DNS lookup unavailable; using normal DNS")
        if self.resolved_ip:
            ipaddress.ip_address(self.resolved_ip)

    def direct_request(self, url, method, headers):
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname != urlparse(self.base_url).hostname:
            raise ValueError("Direct source address is limited to the configured HTTPS origin")
        connection = http.client.HTTPSConnection(parsed.hostname, port=parsed.port or 443,
                                                 timeout=self.timeout, context=ssl.create_default_context())
        # Change only the TCP destination; TLS SNI, certificate hostname verification
        # and the HTTP Host header remain the original public website hostname.
        destination = self.resolved_ip
        connection._create_connection = lambda address, timeout, *a, **kw: socket.create_connection(
            (destination, address[1]), timeout, *a, **kw)
        prepared = self.session().prepare_request(requests.Request(method, url, headers=headers))
        target = parsed.path or "/"
        if parsed.query:
            target += "?" + parsed.query
        try:
            connection.request(method, target, headers=dict(prepared.headers))
            return DirectResponse(connection, connection.getresponse(), url)
        except Exception:
            connection.close()
            raise

    def session(self):
        if not hasattr(self._sessions, "session"):
            session = requests.Session()
            session.trust_env = not self.no_proxy
            session.headers["Accept-Encoding"] = "identity"
            cookie_file = self.config.get("cookie_file")
            if cookie_file:
                jar = http.cookiejar.MozillaCookieJar(cookie_file)
                jar.load(ignore_discard=True, ignore_expires=False)
                session.cookies = jar
            self._sessions.session = session
        return self._sessions.session

    def opener(self):
        handlers = [ProxyHandler({})] if self.no_proxy else []
        cookie_file = self.config.get("cookie_file")
        if cookie_file:
            jar = http.cookiejar.MozillaCookieJar(cookie_file)
            jar.load(ignore_discard=True, ignore_expires=False)
            handlers.append(HTTPCookieProcessor(jar))
        return build_opener(*handlers)

    def headers(self):
        return {"User-Agent": "Mozilla/5.0 (HWS945 forecast updater)",
                "Referer": self.base_url + "/web/download",
                "Connection": "keep-alive" if self.config.get("keep_alive", False) else "close",
                **self.config.get("headers", {})}

    def url(self, day: date, element: str):
        dataset = next(k for k, values in ELEMENTS.items() if element in values)
        template = self.config.get("url_templates", {}).get(dataset, DEFAULT_TEMPLATE)
        return template.format(base_url=self.base_url, kind=KINDS[dataset],
                               date=day.strftime("%Y%m%d"), element=element, cycle="t12")

    def request(self, url: str, method: str = "GET", extra_headers: dict | None = None):
        for attempt in range(self.retries):
            try:
                with self._rate_lock:
                    interval = float(self.config.get("request_interval_seconds", 1.0))
                    time.sleep(max(0, self._next_request - time.monotonic()))
                    self._next_request = time.monotonic() + max(0.1, interval)
                headers = {**self.headers(), **(extra_headers or {})}
                if self.resolved_ip:
                    response = self.direct_request(url, method, headers)
                else:
                    response = PooledResponse(self.session().request(method, url, headers=headers,
                                                                     stream=True, timeout=self.timeout))
                if response.status >= 300:
                    status, headers = response.status, response.headers
                    response.close()
                    raise HTTPError(url, status, "Source request failed", headers, None)
                return response
            except HTTPError as exc:
                if exc.code not in (429, 500, 502, 503, 504) or attempt + 1 == self.retries:
                    raise
            except (URLError, TimeoutError):
                if attempt + 1 == self.retries:
                    raise
            except requests.RequestException as exc:
                self._sessions.session.close()
                del self._sessions.session
                if attempt + 1 == self.retries:
                    raise URLError(type(exc).__name__) from None
            except (OSError, http.client.HTTPException) as exc:
                if attempt + 1 == self.retries:
                    raise URLError(type(exc).__name__) from None
            time.sleep(min(2 ** attempt, 8))
        raise RuntimeError("Request retry limit reached")

    def available_dates(self, datasets=("wave",)):
        """Advisory index only; each candidate is checked for all six files."""
        from automation.wind_wave.download_daily_wind_wave import parse_jsonp
        results = set()
        for dataset in datasets:
            params = urlencode({"condition": KINDS[dataset], "area": "ncfile_12z",
                                "fileName": ELEMENTS[dataset][0], "callback": "fileHandler"})
            try:
                with self.request(self.base_url + "/file/getLatestDaysHaveFiles?" + params) as response:
                    data = parse_jsonp(response.read(100000).decode("utf-8"))
                for value in data.get("data", []):
                    results.add(date.fromisoformat(str(value).replace("-", "")[:4] + "-" +
                                                   str(value).replace("-", "")[4:6] + "-" +
                                                   str(value).replace("-", "")[6:8]))
            except Exception:
                # This index is advisory; actual file probes remain authoritative.
                continue
        return sorted(results, reverse=True)

    def probe(self, day: date, elements: list[str], batch_dir: Path, check_remote: bool = False):
        def inspect(element):
            path = batch_dir / f"{element}_{day:%Y%m%d}_t12.nc"
            if path.exists() and not check_remote:
                try:
                    info = validate_file(path, day)
                    return {"element": element, "status": "local_valid", "bytes": path.stat().st_size,
                            "time_start": info["time_start"], "time_end": info["time_end"]}
                except (ValueError, OSError, RuntimeError):
                    pass
            try:
                with self.request(self.url(day, element), "HEAD") as response:
                    content_type = response.headers.get("Content-Type", "").lower()
                    if "html" in content_type or "/login" in response.url:
                        return {"element": element, "status": "authentication_required"}
                    return {"element": element, "status": "available", "http_status": response.status,
                            "bytes": int(response.headers.get("Content-Length") or 0),
                            "etag": response.headers.get("ETag"),
                            "last_modified": response.headers.get("Last-Modified")}
            except HTTPError as exc:
                return {"element": element, "status": "missing" if exc.code == 404 else "http_error",
                        "http_status": exc.code}
            except (URLError, TimeoutError, OSError):
                return {"element": element, "status": "network_error"}
        with ThreadPoolExecutor(max_workers=3) as pool:
            return list(pool.map(inspect, elements))

    def download(self, day: date, element: str, batch_dir: Path, refresh: bool = False):
        path = batch_dir / f"{element}_{day:%Y%m%d}_t12.nc"
        if path.exists() and not refresh and not path.with_suffix(".subset.json").exists():
            validate_file(path, day)
            return path
        batch_dir.mkdir(parents=True, exist_ok=True)
        part = path.with_suffix(".nc.part")
        for attempt in range(self.retries):
            try:
                with self.request(self.url(day, element)) as response, part.open("wb") as out:
                    if "html" in response.headers.get("Content-Type", "").lower():
                        raise ValueError("Server returned HTML instead of NetCDF")
                    expected = int(response.headers.get("Content-Length") or 0)
                    while chunk := response.read(1024 * 1024):
                        out.write(chunk)
                if expected and part.stat().st_size != expected:
                    raise ValueError("Incomplete download")
                validate_file(part, day)
                os.replace(part, path)
                path.with_suffix(".subset.json").unlink(missing_ok=True)
                return path
            except (OSError, URLError, ValueError, RuntimeError):
                part.unlink(missing_ok=True)
                if attempt + 1 == self.retries:
                    raise
                time.sleep(min(2 ** attempt, 8))
        raise RuntimeError("Download retry limit reached")


def validate_file(path: Path, day: date):
    with _NETCDF_LOCK:
        return _validate_file(path, day)


def _validate_file(path: Path, day: date):
    import numpy as np
    from automation.wind_wave.register_weather_batch import (
        convert_time_values, find_data_variable, open_dataset_safe)
    with path.open("rb") as stream:
        magic = stream.read(8)
    if not (magic.startswith(b"CDF") or magic == b"\x89HDF\r\n\x1a\n"):
        raise ValueError("Not a NetCDF file")
    with open_dataset_safe(path) as ds:
        for coordinate in ("lon", "lat", "time"):
            if coordinate not in ds.variables or len(ds.variables[coordinate]) == 0:
                raise ValueError("Missing/empty coordinate: " + coordinate)
        name = find_data_variable(ds)
        variable = ds.variables[name]
        if not {"time", "lon", "lat"}.issubset(variable.dimensions):
            raise ValueError("Expected time/lon/lat dimensions")
        t = ds.variables["time"]
        times = list(convert_time_values(t[:], t.units, getattr(t, "calendar", "standard")))
        if any(b <= a for a, b in zip(times, times[1:])):
            raise ValueError("Non-increasing time axis")
        if abs((times[0].date() - day).days) > 2:
            raise ValueError("File time axis does not match requested batch")
        for coordinate in ("lon", "lat"):
            values = np.asarray(ds.variables[coordinate][:], dtype=float)
            if not np.all(np.isfinite(values)) or (len(values) > 1 and not (
                    np.all(np.diff(values) > 0) or np.all(np.diff(values) < 0))):
                raise ValueError("Invalid coordinate axis: " + coordinate)
        # Read every time slab to expose truncated/corrupt files, with bounded memory.
        axis = variable.dimensions.index("time")
        for index in range(len(times)):
            selection = [slice(None)] * variable.ndim
            selection[axis] = index
            slab = np.ma.asarray(variable[tuple(selection)], dtype=float)
            if not np.any(np.isfinite(slab.filled(np.nan))):
                raise ValueError("Entirely missing time slab")
        return {"variable": name, "units": getattr(variable, "units", ""),
                "time_start": times[0].isoformat(), "time_end": times[-1].isoformat(),
                "time_count": len(times)}


def sha256(path: Path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    os.replace(temp, path)
