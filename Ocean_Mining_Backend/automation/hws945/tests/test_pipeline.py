"""Run with unittest; optional SQL integration uses ONLY HWS945_TEST_DSN."""
from __future__ import annotations

import io
import json
import os
import shutil
import sys
import tempfile
import unittest
import uuid
import ssl
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from unittest.mock import MagicMock

import numpy as np
from netCDF4 import Dataset

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from automation.hws945.pipeline import compute, parser, run
from automation.hws945.regional_subset import extract
from automation.hws945.source import atomic_json, validate_file
from automation.hws945.source import Source
from automation.hws945 import daily
from automation.hws945.sql_export import TABLES, export_sql, literal

DAY = date(2026, 10, 28)
DEFINITIONS = {
    "regions": [{"region_id": 47, "region_code": "测试 O'Brien \\ $hws945_guard$", "region_name": "Test",
                 "geometry_geojson": {"type": "MultiPolygon", "coordinates": [
                     [[[-0.1, -0.1], [1.1, -0.1], [1.1, 1.1], [-0.1, 1.1], [-0.1, -0.1]]]]}}],
    "sites": [{"site_id": 900, "region_id": 47, "site_code": "S'1", "site_name": "Test site",
               "lng": -2.0, "lat": -2.0}]}


def fixtures(directory, day=DAY, grid_size=3, datasets=("wave",), time_values=None):
    directory.mkdir(parents=True, exist_ok=True)
    paths = []
    time_values = time_values or [0, 3, 24, 27]
    values = {"wave": (("sigh", 2.0), ("perd", 6.0), ("dire", 350.0)),
              "wind": (("wspd", 8.0), ("wdir", 90.0), ("gust", 12.0))}
    for element, value in [v for ds in datasets for v in values[ds]]:
        path = directory / f"{element}_{day:%Y%m%d}_t12.nc"
        with tempfile.TemporaryDirectory() as temp:
            ascii_file = Path(temp) / "source.nc"
            with Dataset(ascii_file, "w", format="NETCDF3_CLASSIC") as ds:
                for n, length in (("time", len(time_values)), ("lon", grid_size), ("lat", grid_size)):
                    ds.createDimension(n, length)
                    coordinate = ds.createVariable(n, "f8", (n,))
                    coordinate[:] = time_values if n == "time" else np.arange(grid_size)
                    coordinate.units = f"hours since {day:%Y%m%d}" if n == "time" else "degrees"
                var = ds.createVariable("field", "i2", ("time", "lon", "lat"), fill_value=-32767)
                var.scale_factor = 0.01
                var.add_offset = 180.0 if element in ("dire", "wdir") else 0.0
                var.units = "degree" if element in ("dire", "wdir") else "s" if element == "perd" else "m/s" if element in ("wspd", "gust") else "m"
                data = np.full((len(time_values), grid_size, grid_size), value)
                if element == "dire":
                    data[:, 0, 1] = 10.0
                missing = np.zeros((grid_size, grid_size), dtype=bool)
                missing[0, 0] = True
                var[:] = np.ma.array(data, mask=np.broadcast_to(missing, data.shape))
            # HTTP header tests request the first 32 KiB, just like real large files.
            with ascii_file.open("ab") as stream:
                stream.write(bytes(65536))
            shutil.copyfile(ascii_file, path)
        paths.append(path)
    return paths


class Response(io.BytesIO):
    status = 206
    def __init__(self, body, headers):
        super().__init__(body)
        self.headers = headers


class RangeSource:
    config = {"subset_merge_gap_bytes": 0}
    def __init__(self, paths):
        self.paths = {p.name.split("_")[0]: p for p in paths}
    def url(self, day, element):
        return element
    def request(self, url, method="GET", extra_headers=None):
        raw = self.paths[url].read_bytes()
        spans = [tuple(map(int, s.split("-"))) for s in extra_headers["Range"][6:].split(",")]
        if len(spans) == 1:
            a, b = spans[0]
            return Response(raw[a:b + 1], {"Content-Range": f"bytes {a}-{b}/{len(raw)}", "ETag": '"test"'})
        boundary = b"testBoundary"
        body = b""
        for a, b in spans:
            body += b"--" + boundary + b"\r\nContent-Type: application/octet-stream\r\n"
            body += f"Content-Range: bytes {a}-{b}/{len(raw)}\r\n\r\n".encode() + raw[a:b + 1] + b"\r\n"
        body += b"--" + boundary + b"--\r\n"
        return Response(body, {"Content-Type": "multipart/byteranges; boundary=testBoundary", "ETag": '"test"'})


class PipelineTests(unittest.TestCase):
    def setUp(self):
        base = ROOT / "data" / "hws945" / "tests"
        base.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=base)
        self.work = Path(self.temp.name)
        self.paths = fixtures(self.work / "full")
    def tearDown(self):
        self.temp.cleanup()
    def test_missing_values_and_partial_days(self):
        parsed, rows = compute(self.paths, DEFINITIONS)
        self.assertAlmostEqual(rows[TABLES[0]][0]["wave_height_avg"], 2.0)
        self.assertEqual(len(rows[TABLES[0]]), 4)
        self.assertEqual([r["hour_count"] for r in rows[TABLES[1]]], [2, 2])
        self.assertEqual(parsed[0].time_step_hours, 3)
    def test_byte_range_subset_equals_full_source(self):
        source = RangeSource(self.paths)
        subset_paths = [extract(source, DAY, e, self.work / "subset", DEFINITIONS) for e in ("sigh", "perd", "dire")]
        _, full = compute(self.paths, DEFINITIONS)
        parsed, subset = compute(subset_paths, DEFINITIONS)
        for table in TABLES:
            self.assertEqual(full[table], subset[table])
        self.assertTrue(all("regional_subset" in p.dataset_kind for p in parsed))
        self.assertTrue(subset_paths[0].with_suffix(".subset.json").exists())
    def test_html_is_rejected(self):
        path = self.work / "bad.nc"
        path.write_text("<html>login</html>")
        with self.assertRaises(ValueError):
            validate_file(path, DAY)
    def test_tile_edges_and_existing_subset_do_not_refetch(self):
        paths = fixtures(self.work / "large", grid_size=21)
        source = RangeSource(paths)
        subsets = [extract(source, DAY, e, self.work / "tile_subset", DEFINITIONS) for e in ("sigh", "perd", "dire")]
        _, full = compute(paths, DEFINITIONS)
        _, selected = compute(subsets, DEFINITIONS)
        self.assertEqual(full, selected)
        with patch.object(source, "request", side_effect=AssertionError("unexpected refetch")):
            self.assertEqual(extract(source, DAY, "sigh", self.work / "tile_subset", DEFINITIONS), subsets[0])
    def test_failed_import_does_not_record_success(self):
        snapshot = self.work / "import_definitions.json"
        atomic_json(snapshot, DEFINITIONS)
        raw = self.work / "import_raw" / DAY.strftime("%Y/%m/%d")
        raw.mkdir(parents=True)
        for p in self.paths:
            shutil.copyfile(p, raw / p.name)
        output = self.work / "failed_import"
        args = parser().parse_args(["--mode", "import", "--date", str(DAY), "--definitions-json", str(snapshot),
                                   "--raw-dir", str(self.work / "import_raw"), "--output-dir", str(output)])
        with patch("automation.hws945.pipeline.apply_sql", side_effect=RuntimeError("test failure")):
            self.assertEqual(run(args), 2)
        self.assertFalse((output / "applied_state.json").exists())
    def test_export_mode_never_calls_database_write(self):
        snapshot = self.work / "definitions.json"
        atomic_json(snapshot, DEFINITIONS)
        raw = self.work / "raw" / DAY.strftime("%Y/%m/%d")
        raw.mkdir(parents=True)
        for p in self.paths:
            shutil.copyfile(p, raw / p.name)
        args = parser().parse_args(["--date", str(DAY), "--definitions-json", str(snapshot),
                                   "--raw-dir", str(self.work / "raw"), "--output-dir", str(self.work / "export")])
        with patch("automation.hws945.pipeline.apply_sql", side_effect=AssertionError("unexpected DB write")), \
             patch("psycopg2.connect", side_effect=AssertionError("unexpected connection")):
            self.assertEqual(run(args), 0)
        sql = (self.work / "export" / "all_batches.sql").read_text("utf8")
        self.assertIn("BEGIN;", sql)
        self.assertIn("COMMIT;", sql)
        self.assertNotIn("wind_speed_avg=EXCLUDED", sql)
        self.assertNotIn("current_speed_avg=EXCLUDED", sql)
        report = json.loads((self.work / "export" / "report.json").read_text("utf8"))
        self.assertFalse(report["database_writes"])
    def test_literal_quoting(self):
        self.assertEqual(literal("O'Brien\\data"), "'O''Brien\\data'")
        self.assertEqual(literal(float("nan")), "NULL")
        with self.assertRaises(ValueError):
            literal("a\x00b")
    def test_direct_address_preserves_https_certificate_hostname(self):
        source = Source({"resolved_ip": "54.222.243.173"}, no_proxy=True)
        connection = MagicMock()
        response = connection.getresponse.return_value
        response.status = 200
        response.headers = {}
        with patch("automation.hws945.source.http.client.HTTPSConnection", return_value=connection) as factory, \
             patch("automation.hws945.source.socket.create_connection") as connect:
            result = source.direct_request("https://www.hws945.com/example.nc?batch=1", "GET", {})
            self.assertEqual(factory.call_args.args[0], "www.hws945.com")
            context = factory.call_args.kwargs["context"]
            self.assertTrue(context.check_hostname)
            self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
            connection._create_connection(("www.hws945.com", 443), 10)
            connect.assert_called_once_with(("54.222.243.173", 443), 10)
            self.assertEqual(connection.request.call_args.args[:2], ("GET", "/example.nc?batch=1"))
            result.close()
    def test_direct_address_rejects_other_origin(self):
        source = Source({"resolved_ip": "54.222.243.173"}, no_proxy=True)
        with self.assertRaises(ValueError):
            source.direct_request("https://other.example/file", "GET", {})

    def daily_args(self, available=("wave",), mode="export"):
        raw = self.work / "daily_raw" / DAY.strftime("%Y/%m/%d")
        fixtures(raw, datasets=available)
        snapshot = self.work / "daily_definitions.json"
        atomic_json(snapshot, DEFINITIONS)
        return daily.parser().parse_args(["--mode", mode, "--date", str(DAY),
                                         "--definitions-json", str(snapshot), "--raw-dir", str(self.work / "daily_raw"),
                                         "--output-dir", str(self.work / "daily")])

    def fake_probe(self, day, elements, directory, **kwargs):
        return [{"element": e, "status": "available" if (directory / f"{e}_{day:%Y%m%d}_t12.nc").exists() else "missing",
                 "etag": "test-version"} for e in elements]

    def test_daily_checks_six_and_missing_wind_does_not_block_wave(self):
        args = self.daily_args()
        with patch.object(Source, "probe", side_effect=self.fake_probe) as probe, \
             patch("automation.hws945.regional_subset.extract", side_effect=lambda s, d, e, root, defs, refresh=False: root / f"{e}_{d:%Y%m%d}_t12.nc"), \
             patch("automation.hws945.pipeline.apply_sql", side_effect=AssertionError("unexpected write")):
            self.assertEqual(daily.run(args), 0)
        self.assertEqual(probe.call_count, 6)
        report = json.loads((args.output_dir / "report.json").read_text("utf8"))
        self.assertEqual((report["success_count"], report["skipped_count"]), (3, 3))
        self.assertEqual(report["requested_elements"], ["gust", "wdir", "wspd", "dire", "perd", "sigh"])
        self.assertFalse(report["database_writes"])

    def test_daily_single_element_failure_does_not_block_five_others(self):
        args = self.daily_args(("wind", "wave"))
        def extract_one(source, day, element, directory, definitions, refresh=False):
            if element == "wdir":
                raise OSError("simulated download failure")
            return directory / f"{element}_{day:%Y%m%d}_t12.nc"
        with patch.object(Source, "probe", side_effect=self.fake_probe), \
             patch("automation.hws945.regional_subset.extract", side_effect=extract_one):
            self.assertEqual(daily.run(args), 0)
        report = json.loads((args.output_dir / "report.json").read_text("utf8"))
        self.assertEqual((report["success_count"], report["failed_count"]), (5, 1))
        failed = [e["element"] for e in report["elements"] if e["status"] == "failed"]
        self.assertEqual(failed, ["wdir"])

    def test_daily_recovers_wind_without_redownloading_unchanged_wave(self):
        args = self.daily_args(mode="import")
        with patch.object(Source, "probe", side_effect=self.fake_probe), \
             patch("automation.hws945.regional_subset.extract", side_effect=lambda s, d, e, root, defs, refresh=False: root / f"{e}_{d:%Y%m%d}_t12.nc"), \
             patch("automation.hws945.pipeline.apply_sql") as apply:
            self.assertEqual(daily.run(args), 0)
            self.assertEqual(apply.call_count, 3)
            fixtures(args.raw_dir / DAY.strftime("%Y/%m/%d"), datasets=("wind",))
            self.assertEqual(daily.run(args), 0)
            self.assertEqual(apply.call_count, 6)  # Three new wind imports; waves skipped as already applied.
        report = json.loads((args.output_dir / "report.json").read_text("utf8"))
        self.assertEqual(report["success_count"], 6)
        self.assertEqual(sum(e["status"] == "already_applied" for e in report["elements"]), 3)

    def test_latest_is_selected_independently_for_each_element(self):
        args = self.daily_args(("wind",))
        older = DAY - timedelta(days=1)
        fixtures(args.raw_dir / older.strftime("%Y/%m/%d"), older, time_values=[0, 3, 24, 27, 48, 51])
        args.date, args.latest, args.lookback_days = None, True, 2
        class FixedTime(datetime):
            @classmethod
            def now(cls, tz=None):
                value = datetime(DAY.year, DAY.month, DAY.day, 12, tzinfo=timezone.utc)
                return value.astimezone(tz) if tz else value.replace(tzinfo=None)
        with patch("automation.hws945.pipeline.datetime", FixedTime), \
             patch.object(Source, "available_dates", return_value=[DAY, older]), \
             patch.object(Source, "probe", side_effect=self.fake_probe), \
             patch("automation.hws945.regional_subset.extract", side_effect=lambda s, d, e, root, defs, refresh=False: root / f"{e}_{d:%Y%m%d}_t12.nc"):
            self.assertEqual(daily.run(args), 0)
        report = json.loads((args.output_dir / "report.json").read_text("utf8"))
        self.assertEqual(report["success_count"], 6)
        for element in ("gust", "wdir", "wspd"):
            self.assertEqual(report["latest_element_batches"][element], str(DAY))
        for element in ("dire", "perd", "sigh"):
            self.assertEqual(report["latest_element_batches"][element], str(older))

    def test_unsupported_range_falls_back_to_full_download(self):
        from automation.hws945.regional_subset import RangeUnsupported
        args = self.daily_args()
        with patch.object(Source, "probe", side_effect=self.fake_probe), \
             patch("automation.hws945.regional_subset.extract", side_effect=RangeUnsupported("fixture format")), \
             patch.object(Source, "download", side_effect=lambda d, e, root, refresh=False: root / f"{e}_{d:%Y%m%d}_t12.nc") as download:
            self.assertEqual(daily.run(args), 0)
        self.assertEqual(download.call_count, 3)

    def test_full_download_replaces_derived_subset_provenance(self):
        source = Source({"retries": 1})
        path = next(p for p in self.paths if p.name.startswith("sigh_"))
        original = path.read_bytes()
        path.with_suffix(".subset.json").write_text('{}', encoding='utf8')
        response = Response(original, {"Content-Length": str(len(original)), "Content-Type": "application/octet-stream"})
        with patch.object(source, "request", return_value=response) as request:
            result = source.download(DAY, "sigh", path.parent)
        self.assertEqual(result, path)
        self.assertTrue(request.called)
        self.assertFalse(path.with_suffix(".subset.json").exists())


@unittest.skipUnless(os.environ.get("HWS945_TEST_DSN"), "No isolated test PostgreSQL configured")
class SQLIntegrationTests(PipelineTests):
    """The test DSN must point to an isolated disposable cluster, never production."""
    def setUp(self):
        super().setUp()
        import psycopg2
        self.conn = psycopg2.connect(os.environ["HWS945_TEST_DSN"])
        self.conn.autocommit = True
        self.schema = "hws945_test_" + uuid.uuid4().hex
        with self.conn.cursor() as cur:
            cur.execute("CREATE SCHEMA " + self.schema)
            cur.execute("SET search_path TO " + self.schema + ",public")
            ddl = (ROOT / "database_mining_overview.sql").read_text("utf8")
            cur.execute("\n".join(line for line in ddl.splitlines() if not line.startswith("\\")))
            region = DEFINITIONS["regions"][0]
            # Target database IDs deliberately differ from the export snapshot IDs.
            cur.execute("INSERT INTO mining_regions(id,region_code,region_name,boundary_polygon,geometry) "
                        "VALUES(500,%s,'Test','[]',ST_SetSRID(ST_GeomFromGeoJSON(%s),4326))",
                        (region["region_code"], json.dumps(region["geometry_geojson"])))
            site = DEFINITIONS["sites"][0]
            cur.execute("INSERT INTO forecast_sites(id,region_id,site_code,site_name,lng,lat) VALUES(800,500,%s,'Test',%s,%s)",
                        (site["site_code"], site["lng"], site["lat"]))
    def tearDown(self):
        try:
            with self.conn.cursor() as cur:
                cur.execute("ROLLBACK")
                cur.execute("SET search_path TO public")
                cur.execute("DROP SCHEMA " + self.schema + " CASCADE")
        finally:
            self.conn.close()
            super().tearDown()
    def sql_for(self, day):
        paths = self.paths if day == DAY else fixtures(self.work / str(day), day)
        parsed, rows = compute(paths, DEFINITIONS)
        path = self.work / f"{day}.sql"
        export_sql(path, parsed, rows, DEFINITIONS, day)
        return path.read_text("utf8")
    def test_real_sql_is_repeatable_and_preserves_wind_current(self):
        sql = self.sql_for(DAY)
        with self.conn.cursor() as cur:
            cur.execute(sql)
            cur.execute("UPDATE region_forecasts_hourly SET wind_speed_avg=12.5,current_speed_avg=1.23")
            cur.execute(sql)
            cur.execute("SELECT count(*),min(region_id),min(wind_speed_avg),min(current_speed_avg) FROM region_forecasts_hourly")
            count, region_id, wind, current = cur.fetchone()
            self.assertEqual((count, region_id, float(wind), float(current)), (4, 500, 12.5, 1.23))
            cur.execute("SELECT count(*) FROM weather_files")
            self.assertEqual(cur.fetchone()[0], 3)
            cur.execute("SELECT min(site_id) FROM site_forecasts_hourly")
            self.assertEqual(cur.fetchone()[0], 800)
            cur.execute("SELECT jsonb_array_length(source_file_ids) FROM site_forecasts_hourly LIMIT 1")
            self.assertEqual(cur.fetchone()[0], 3)
    def test_backfill_does_not_demote_latest(self):
        with self.conn.cursor() as cur:
            cur.execute(self.sql_for(DAY))
            cur.execute(self.sql_for(DAY - timedelta(days=1)))
            for table in TABLES:
                cur.execute(f"SELECT DISTINCT base_date FROM {table} WHERE is_latest")
                self.assertEqual(cur.fetchall(), [(DAY,)])
    def test_changed_definition_rolls_back_entire_batch(self):
        import psycopg2
        with self.conn.cursor() as cur:
            cur.execute("UPDATE forecast_sites SET lng=3")
            with self.assertRaises(psycopg2.Error):
                cur.execute(self.sql_for(DAY))
            cur.execute("ROLLBACK")
            cur.execute("SELECT count(*) FROM weather_files")
            self.assertEqual(cur.fetchone()[0], 0)

    def test_geometry_serialization_noise_is_accepted(self):
        with self.conn.cursor() as cur:
            cur.execute("UPDATE mining_regions SET geometry=ST_Translate(geometry,0,1e-15)")
            cur.execute(self.sql_for(DAY))
            cur.execute("SELECT count(*) FROM weather_files")
            self.assertEqual(cur.fetchone()[0], 3)

    def test_real_geometry_change_still_rolls_back(self):
        import psycopg2
        with self.conn.cursor() as cur:
            cur.execute("UPDATE mining_regions SET geometry=ST_Translate(geometry,0,0.00001)")
            with self.assertRaises(psycopg2.Error):
                cur.execute(self.sql_for(DAY))
            cur.execute("ROLLBACK")
            cur.execute("SELECT count(*) FROM weather_files")
            self.assertEqual(cur.fetchone()[0], 0)

    def element_sql(self, day, element, time_values=None):
        dataset = "wind" if element in ("wspd", "wdir", "gust") else "wave"
        paths = fixtures(self.work / f"{day}_{element}", day, datasets=(dataset,), time_values=time_values)
        parsed, rows = compute([p for p in paths if p.name.startswith(element + "_")], DEFINITIONS)
        path = self.work / f"{day}_{element}.sql"
        export_sql(path, parsed, rows, DEFINITIONS, day, (dataset,), (element,))
        return path.read_text("utf8")

    def test_wind_recovery_preserves_wave_and_current_in_all_tables(self):
        with self.conn.cursor() as cur:
            cur.execute(self.sql_for(DAY))
            for table in TABLES:
                current = "current_speed" if table == "site_forecasts_hourly" else "current_speed_avg"
                cur.execute(f"UPDATE {table} SET {current}=1.23")
            for element in ("wspd", "wdir", "gust"):
                cur.execute(self.element_sql(DAY, element))
            for table in TABLES:
                site_hourly = table == "site_forecasts_hourly"
                columns = ("wind_speed,wave_height,gust,wind_dir,current_speed" if site_hourly else
                           "wind_speed_avg,wave_height_avg,gust_max,wind_dir_mean,current_speed_avg")
                cur.execute(f"SELECT {columns} FROM {table} LIMIT 1")
                self.assertEqual(tuple(map(float, cur.fetchone())), (8.0, 2.0, 12.0, 90.0, 1.23))
                cur.execute(f"SELECT min(jsonb_array_length(source_file_ids)) FROM {table}")
                self.assertEqual(cur.fetchone()[0], 6)

    def test_older_wave_does_not_demote_newer_wind_batch(self):
        with self.conn.cursor() as cur:
            cur.execute(self.element_sql(DAY, "wspd"))
            cur.execute(self.element_sql(DAY - timedelta(days=1), "sigh"))
            for table in TABLES:
                cur.execute(f"SELECT DISTINCT base_date FROM {table} WHERE is_latest")
                self.assertEqual(cur.fetchall(), [(DAY,)])

    def test_daily_count_tracks_union_of_available_element_times(self):
        with self.conn.cursor() as cur:
            cur.execute(self.element_sql(DAY, "sigh"))
            cur.execute(self.element_sql(DAY, "wspd", time_values=[0, 6, 24, 30]))
            for table in ("region_forecasts_daily", "site_forecasts_daily"):
                cur.execute(f"SELECT hour_count FROM {table} ORDER BY forecast_date")
                self.assertEqual(cur.fetchall(), [(3,), (3,)])


if __name__ == "__main__":
    unittest.main(verbosity=2)
