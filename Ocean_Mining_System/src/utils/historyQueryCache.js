const abortError = () => new DOMException('查询已取消', 'AbortError');
const pointKey = (type, params) => JSON.stringify([type, Number(params.lat), Number(params.lon), params.startYear ?? null, params.endYear ?? null]);

export function createHistoryQueryCache({ fetchVersions, fetchDataset, now = Date.now, versionTtl = 10000, maxEntries = 64 }) {
  const cache = new Map(), pending = new Map();
  let versions = {}, checkedAt = -Infinity, versionRequest;
  async function refreshVersions({ force = false } = {}) {
    if (!force && now() - checkedAt < versionTtl) return versions;
    if (!versionRequest) {
      versionRequest = (async () => {
        try {
          const updated = await fetchVersions();
          for (const [key, entry] of cache) if (entry.version !== updated[entry.type]) cache.delete(key);
          versions = updated; checkedAt = now();
          return versions;
        } finally { versionRequest = null; }
      })();
    }
    return versionRequest;
  }
  function peek(type, params) {
    const key = pointKey(type, params), entry = cache.get(key);
    if (!entry || entry.version !== versions[type]) return null;
    cache.delete(key); cache.set(key, entry);
    return entry.data;
  }
  function subscribe(entry, signal) {
    if (signal?.aborted) return Promise.reject(abortError());
    entry.users++;
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = (callback, value) => {
        if (finished) return;
        finished = true; entry.users--; signal?.removeEventListener('abort', cancel);
        callback(value);
      };
      const cancel = () => {
        finish(reject, abortError());
        queueMicrotask(() => { if (!entry.users && !entry.settled) entry.controller.abort(); });
      };
      signal?.addEventListener('abort', cancel, { once: true });
      entry.promise.then(value => finish(resolve, value), error => finish(reject, error));
    });
  }
  async function load(type, params, { signal } = {}) {
    if (signal?.aborted) throw abortError();
    await refreshVersions();
    if (signal?.aborted) throw abortError();
    const cached = peek(type, params);
    if (cached) return cached;
    const key = pointKey(type, params), requestKey = `${key}|${versions[type]}`;
    let entry = pending.get(requestKey);
    if (!entry || entry.controller.signal.aborted) {
      entry = { users: 0, settled: false, controller: new AbortController() };
      const version = versions[type];
      entry.promise = fetchDataset(type, params, { signal: entry.controller.signal }).then(data => {
        if (entry.controller.signal.aborted) throw abortError();
        // A concurrent import can change the version while this query runs.
        const actualVersion = data.dataVersion || version;
        if (versions[type] === version && actualVersion === version) {
          cache.set(key, { type, version, data });
          while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
        }
        return data;
      }).finally(() => {
        entry.settled = true;
        if (pending.get(requestKey) === entry) pending.delete(requestKey);
      });
      pending.set(requestKey, entry);
    }
    return subscribe(entry, signal);
  }
  return { load, peek, refreshVersions };
}
