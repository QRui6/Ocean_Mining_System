const SETTINGS_KEY = 'MINING_OPERATION_LIMITS_V1';
const HISTORY_KEY = 'MINING_OPERATION_ASSESSMENTS_V1';
const LIMITS_VERSION = 2;

// Environmental comparison references, not certified equipment operating limits.
// Sources and scope: 作业环境参考阈值与依据_20261115.md in the workspace root.
export const DEFAULT_OPERATION_LIMITS = Object.freeze({
  surface: Object.freeze({ windSpeed: 15, gust: 17.2, waveHeight: 3, currentSpeed: 1 }),
  collection: Object.freeze({ bottomCurrentSpeed: 0.2 })
});

export const OPERATION_SYSTEMS = [
  { key: 'surface', label: '水面系统' },
  { key: 'lifting', label: '提升系统' },
  { key: 'collection', label: '矿石采集' }
];
export const SYSTEM_METRICS = {
  surface: [
    { key: 'windSpeed', label: '风速', unit: 'm/s' },
    { key: 'gust', label: '阵风', unit: 'm/s' },
    { key: 'waveHeight', label: '有效波高', unit: 'm' },
    { key: 'currentSpeed', label: '表层流速', unit: 'm/s' }
  ],
  collection: [{ key: 'bottomCurrentSpeed', label: '近底流速', unit: 'm/s' }]
};
const number = value => value === null || value === undefined || value === '' || typeof value === 'boolean'
  ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

export function loadOperationLimits(site, monitoredAreas = []) {
  const saved = read(SETTINGS_KEY, {})[String(site?.id)];
  const monitoring = monitoredAreas.find(area => String(area.miningAreaId) === String(site?.siteCode)
    || (site?.miningAreaId != null && String(area.miningAreaId) === String(site.miningAreaId)));
  const mergeLimits = (defaults, configured) => {
    const values = configured && typeof configured === 'object' ? configured : {};
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      const supplied = Object.hasOwn(values, key);
      const legacyEmpty = saved?.version !== LIMITS_VERSION && (values[key] === '' || values[key] == null);
      return [key, supplied && !legacyEmpty ? values[key] : fallback];
    }));
  };
  return {
    surface: mergeLimits({
      ...DEFAULT_OPERATION_LIMITS.surface,
      windSpeed: monitoring?.windSpeedThreshold ?? DEFAULT_OPERATION_LIMITS.surface.windSpeed,
      waveHeight: monitoring?.waveHeightThreshold ?? DEFAULT_OPERATION_LIMITS.surface.waveHeight,
      currentSpeed: monitoring?.currentSpeedThreshold ?? DEFAULT_OPERATION_LIMITS.surface.currentSpeed
    }, saved?.surface),
    collection: mergeLimits(DEFAULT_OPERATION_LIMITS.collection, saved?.collection)
  };
}
export function saveOperationLimits(siteId, limits) {
  if (!siteId) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...read(SETTINGS_KEY, {}), [siteId]: { ...limits, version: LIMITS_VERSION } }));
}

export function assessOperationSystem(system, limits = {}, records = []) {
  const metrics = SYSTEM_METRICS[system] || [];
  const rows = records.filter(row => row?.forecastTime && Number.isFinite(Date.parse(row.forecastTime)))
    .sort((a, b) => Date.parse(a.forecastTime) - Date.parse(b.forecastTime));
  const steps = rows.slice(1).map((row, index) => Date.parse(row.forecastTime) - Date.parse(rows[index].forecastTime)).filter(step => step > 0);
  const cadence = steps.length ? Math.min(...steps) : Infinity;
  const checks = metrics.map(metric => {
    const supplied = limits[metric.key];
    const threshold = number(supplied);
    const configured = threshold !== null && threshold > 0;
    // bottomCurrentSpeed is deliberately independent of the surface-current field.
    const valid = rows.map(row => ({ time: row.forecastTime, value: number(row[metric.key]) }))
      .filter(row => row.value !== null && row.value >= 0);
    const peak = valid.reduce((max, row) => !max || row.value > max.value ? row : max, null);
    const exceeded = configured ? valid.filter(row => row.value >= threshold) : [];
    const windows = [];
    let window, previousTime;
    for (const row of rows) {
      const time = Date.parse(row.forecastTime);
      if (previousTime !== undefined && time - previousTime > cadence * 1.5) window = null;
      const value = number(row[metric.key]);
      if (configured && value !== null && value >= threshold) {
        if (!window) { window = { start: row.forecastTime, end: row.forecastTime }; windows.push(window); }
        window.end = row.forecastTime;
      } else window = null;
      previousTime = time;
    }
    return { ...metric, threshold: configured ? threshold : null, peak, windows,
      ratio: configured && peak ? peak.value / threshold : null,
      status: !configured ? (supplied === '' || supplied == null ? '未配置' : '阈值无效')
        : !valid.length ? '暂无数据' : exceeded.length ? '超限' : valid.length < rows.length ? '数据不全' : '未超限',
      incomplete: valid.length < rows.length,
      exceededCount: exceeded.length, count: valid.length };
  });
  const violations = checks.filter(check => check.exceededCount > 0);
  const unconfigured = checks.filter(check => !check.threshold);
  const missing = checks.filter(check => !check.count || check.incomplete);
  let level = '未评估', tone = 'muted', title = '暂无可用数据', summary = '等待数据更新';
  if (violations.length) {
    level = '超限'; tone = 'orange'; title = system === 'surface' ? '水面参考阈值超限' : '近底流速超过参考值';
    summary = `超限指标：${violations.map(check => check.label).join('、')}`;
  } else if (unconfigured.length) {
    level = '未配置'; title = '参考阈值未配置'; summary = unconfigured.map(check => check.label).join('、');
  } else if (missing.length) {
    level = '未完成'; title = '评估数据待补充'; summary = missing.map(check => check.label).join('、');
  } else if (checks.length) {
    level = '未超限'; tone = 'green'; title = '参考指标未超限'; summary = '按船舶和设备作业规程复核';
  }
  const advice = violations.length ? (system === 'surface' ? '核查船舶定位和甲板作业条件，按实际设备限值复核。' : '核查采集设备受流条件，按实际设备限值复核。')
    : unconfigured.length ? '补充参考阈值后重新评估。'
      : missing.length ? `补充${missing.map(check => check.label).join('、')}数据后重新评估。` : '结合现场条件，按设备作业规程执行。';
  return { system, level, tone, title, summary, advice, checks, incomplete: Boolean(unconfigured.length || missing.length),
    windows: checks.flatMap(check => check.windows.map(window => ({ ...window, metric: check.label }))),
    start: rows[0]?.forecastTime || '', end: rows.at(-1)?.forecastTime || '' };
}

export function saveOperationAssessment(site, assessment) {
  const previous = read(HISTORY_KEY, []);
  const record = { ...assessment, siteId: site?.id, siteName: site?.displayName, evaluatedAt: new Date().toISOString() };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...(Array.isArray(previous) ? previous : [])].slice(0, 30)));
  return record;
}
