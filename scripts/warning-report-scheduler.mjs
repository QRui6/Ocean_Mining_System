import { mkdir, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const DEFAULT_API_BASE_URL = 'http://121.194.93.61:8082';
const API_BASE_URL = (process.env.WARNING_API_BASE_URL || process.env.FORECAST_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.WARNING_REPORT_OUTPUT_DIR || './warning-reports');
const INTERVAL_MINUTES = Math.max(5, Number(process.env.WARNING_REPORT_INTERVAL_MINUTES || 60));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.WARNING_REPORT_REQUEST_TIMEOUT_MS || 30_000));
const SITE_CONCURRENCY = Math.max(1, Number(process.env.WARNING_REPORT_SITE_CONCURRENCY || 6));
const REGION_CONCURRENCY = Math.max(1, Number(process.env.WARNING_REPORT_REGION_CONCURRENCY || 3));
const RETENTION_DAYS = Math.max(1, Number(process.env.WARNING_REPORT_RETENTION_DAYS || 90));
const REPORT_NOW_OVERRIDE = String(process.env.WARNING_REPORT_NOW || '').trim();

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const pad = (value) => String(value).padStart(2, '0');
const formatParts = (formatter, date) => Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
const formatDateTime = (date) => { const parts = formatParts(dateTimeFormatter, date); return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`; };
const formatDate = (date) => { const parts = formatParts(dateFormatter, date); return `${parts.year}-${parts.month}-${parts.day}`; };
const formatFileStamp = (date) => { const parts = formatParts(dateTimeFormatter, date); return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`; };
const formatNumber = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
const text = (value, fallback = '--') => value === undefined || value === null || value === '' ? fallback : String(value);
const firstValue = (record, fields) => fields.map((field) => record?.[field]).find((value) => value !== undefined && value !== null && value !== '');
const numberValue = (record, fields) => { const value = Number(firstValue(record, fields)); return Number.isFinite(value) ? value : null; };

const getReportNow = () => {
    if (!REPORT_NOW_OVERRIDE) return new Date();
    const normalized = REPORT_NOW_OVERRIDE.replace(' ', 'T');
    const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}+08:00`);
    if (Number.isNaN(parsed.getTime())) throw new Error(`WARNING_REPORT_NOW 无法解析：${REPORT_NOW_OVERRIDE}`);
    return parsed;
};

const unwrapArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    const candidates = [payload?.data, payload?.items, payload?.records, payload?.content, payload?.data?.items, payload?.data?.records, payload?.data?.content];
    return candidates.find((value) => Array.isArray(value)) || [];
};

const requestJson = async (endpoint) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        const body = await response.text();
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
        const payload = body ? JSON.parse(body) : null;
        if (payload?.success === false) throw new Error(payload.error || payload.message || '接口返回失败');
        return payload?.data ?? payload;
    } catch (error) {
        if (error instanceof SyntaxError) throw new Error('接口返回不是 JSON');
        throw error;
    } finally {
        clearTimeout(timer);
    }
};

const parseDateOnly = (value) => { const match = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/); return match ? `${match[1]}-${pad(match[2])}-${pad(match[3])}` : ''; };
const parseRecordTime = (record) => {
    const raw = firstValue(record, ['forecastTime', 'validTime', 'observedAt', 'observationTime', 'timestamp', 'datetime', 'time']);
    if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw || ''))) {
        const value = Number(raw); const date = new Date(String(raw).length === 10 ? value * 1000 : value); return Number.isNaN(date.getTime()) ? null : date;
    }
    const rawText = String(raw || '').trim();
    const date = parseDateOnly(rawText) || parseDateOnly(record?.forecastDate || record?.date);
    if (!date) return null;
    const match = rawText.match(/(?:T|\s|^)(\d{1,2})(?::(\d{2}))?/);
    const hourValue = record?.forecastHour ?? record?.hour ?? record?.validHour;
    const hour = match ? Number(match[1]) : Number.isFinite(Number(hourValue)) ? (Number(hourValue) >= 100 ? Math.floor(Number(hourValue) / 100) : Number(hourValue)) : 0;
    const minute = match?.[2] ? Number(match[2]) : 0;
    const parsed = new Date(`${date}T${pad(hour)}:${pad(minute)}:00+08:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const recordDate = (record) => parseDateOnly(record?.forecastDate || record?.date) || (parseRecordTime(record) ? formatDate(parseRecordTime(record)) : '');
const sortRecords = (records = []) => [...records].sort((first, second) => (parseRecordTime(first)?.getTime() || Number.MAX_SAFE_INTEGER) - (parseRecordTime(second)?.getTime() || Number.MAX_SAFE_INTEGER));
const uniqueRecords = (records = []) => [...new Map(records.map((record) => [`${recordDate(record)}|${parseRecordTime(record)?.getTime() || JSON.stringify(record)}`, record])).values()];
const parseTimeValue = (value) => { const raw = String(value || '').trim(); if (!raw) return null; const date = new Date(raw.replace(/\//g, '-').replace(' ', 'T').replace(/^([\d-]+)$/, '$1T00:00:00')); return Number.isNaN(date.getTime()) ? null : date; };
const formatTimeValue = (value) => { const date = parseTimeValue(value); return date ? formatDateTime(date) : text(value, '未提供'); };
const currentLocalDate = (date) => formatDate(date);

const mapLimit = async (items, limit, handler) => {
    const results = new Array(items.length); let cursor = 0;
    const worker = async () => { while (cursor < items.length) { const index = cursor++; results[index] = await handler(items[index], index); } };
    await Promise.all(Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, worker));
    return results;
};

const RULES = {
    forecast: [
        { key: 'wind', name: '风速', unit: '米/秒', fields: ['windSpeedMax', 'windSpeedAvg', 'windSpeed'], attention: 10, warning: 12, critical: 18 },
        { key: 'gust', name: '最大阵风', unit: '米/秒', fields: ['gustMax', 'gust', 'windGust'], attention: 12, warning: 15, critical: 22 },
        { key: 'wave', name: '浪高', unit: '米', fields: ['waveHeightMax', 'waveHeightAvg', 'waveHeight'], attention: 2.5, warning: 3, critical: 5 },
        { key: 'current', name: '流速', unit: '米/秒', fields: ['currentSpeedMax', 'currentSpeedAvg', 'currentSpeed'], attention: 1, warning: 1.5, critical: 2 }
    ],
    buoy: [
        { key: 'wind', name: '风速', unit: '米/秒', fields: ['windSpeed', 'windSpeedAvg', 'wind_speed'], attention: 12, warning: 15, critical: 20 },
        { key: 'wave', name: '浪高', unit: '米', fields: ['waveHeight', 'waveHeightAvg', 'wave_height'], attention: 2.5, warning: 3.5, critical: 4.5 },
        { key: 'current', name: '流速', unit: '米/秒', fields: ['currentSpeed', 'currentSpeedAvg', 'current_speed'], attention: 1, warning: 1.5, critical: 2 }
    ]
};
const severityRank = { INFO: 1, WARNING: 2, CRITICAL: 3 };
const severityText = { INFO: '关注', WARNING: '预警', CRITICAL: '严重' };
const metricValues = (record, rules) => Object.fromEntries(rules.map((rule) => [rule.key, numberValue(record, rule.fields)]));
const levelOf = (records, rules) => {
    let rank = 0;
    for (const record of records) for (const rule of rules) {
        const value = metricValues(record, rules)[rule.key];
        if (value !== null && value >= rule.critical) rank = Math.max(rank, severityRank.CRITICAL);
        else if (value !== null && value >= rule.warning) rank = Math.max(rank, severityRank.WARNING);
        else if (value !== null && value >= rule.attention) rank = Math.max(rank, severityRank.INFO);
    }
    return rank === severityRank.CRITICAL ? 'CRITICAL' : rank === severityRank.WARNING ? 'WARNING' : rank === severityRank.INFO ? 'INFO' : '';
};
const thresholdFor = (rule, level) => rule[level === 'CRITICAL' ? 'critical' : level === 'WARNING' ? 'warning' : 'attention'];
const triggerDetails = (records, level, rules) => rules.flatMap((rule) => {
    const threshold = thresholdFor(rule, level);
    const matches = records.filter((record) => { const value = metricValues(record, rules)[rule.key]; return value !== null && value >= threshold; });
    if (!matches.length) return [];
    const peak = matches.reduce((best, record) => metricValues(record, rules)[rule.key] > metricValues(best, rules)[rule.key] ? record : best, matches[0]);
    return [{ type: rule.name, value: formatNumber(metricValues(peak, rules)[rule.key]), unit: rule.unit, threshold: formatNumber(threshold), firstAt: recordDateTimeText(matches[0]), peakAt: recordDateTimeText(peak) }];
});
const recordDateTimeText = (record) => { const date = parseRecordTime(record); return date ? formatDateTime(date) : recordDate(record) || '未提供'; };
const riskWindow = (records, level, rules) => {
    const thresholdMatches = records.filter((record) => rules.some((rule) => { const value = metricValues(record, rules)[rule.key]; return value !== null && value >= thresholdFor(rule, level); }));
    if (!thresholdMatches.length) return { start: '', end: '', duration: '--' };
    const start = parseRecordTime(thresholdMatches[0]); const end = parseRecordTime(thresholdMatches.at(-1));
    const hours = start && end ? Math.max(1, Math.round((end - start) / 3600000) + 1) : null;
    return { start: recordDateTimeText(thresholdMatches[0]), end: recordDateTimeText(thresholdMatches.at(-1)), duration: hours ? `${hours}小时` : '--' };
};
const metricsText = (record, rules) => rules.map((rule) => `${rule.name}${formatNumber(metricValues(record, rules)[rule.key])}${rule.unit}`).join('，');
const summaryText = (records, rules) => rules.map((rule) => { const values = records.map((record) => metricValues(record, rules)[rule.key]).filter((value) => value !== null); return `${rule.name}最高${values.length ? formatNumber(Math.max(...values)) : '--'}${rule.unit}`; }).join('，');
const futureRecords = (records, generatedAt) => sortRecords(records).filter((record) => { const date = parseRecordTime(record); return !date || date.getTime() >= generatedAt.getTime() - 24 * 3600_000; });

const fetchHourly = async (kind, id, date) => {
    const endpoint = kind === 'region' ? `/api/mining-overview/regions/${encodeURIComponent(id)}/hourly?forecastDate=${encodeURIComponent(date)}` : `/api/mining-overview/sites/${encodeURIComponent(id)}/hourly?forecastDate=${encodeURIComponent(date)}`;
    return sortRecords(uniqueRecords(unwrapArray(await requestJson(endpoint))));
};

const normalizeFormal = (item, detail = {}) => {
    const merged = { ...item, ...detail };
    const series = [merged.forecastData?.series, merged.forecastData?.hourly, merged.series, merged.forecastSeries, merged.hourlyForecast, merged.data?.series].find(Array.isArray) || [];
    const rawLevel = String(merged.severity || merged.warningLevel || merged.level || merged.alertLevel || '').toUpperCase();
    const derivedLevel = levelOf(series, RULES.forecast);
    const severity = ['CRITICAL', 'RED', '红色', '严重'].includes(rawLevel) ? 'CRITICAL' : ['INFO', 'BLUE', '蓝色', '提示'].includes(rawLevel) ? 'INFO' : derivedLevel || 'WARNING';
    const regionName = text(merged.regionName || merged.regionCode || merged.areaName || merged.miningArea || merged.region?.regionName, '未明确区域');
    const siteName = text(merged.siteName || merged.siteDisplayName || merged.mineName || merged.site?.siteName, '区域范围内');
    const window = { start: text(merged.validFrom || merged.startTime || merged.effectiveTime || merged.forecastTime || series[0]?.forecastTime || series[0]?.forecastDate, ''), end: text(merged.validUntil || merged.endTime || merged.expireTime || merged.expiryTime || series.at(-1)?.forecastTime || series.at(-1)?.forecastDate, '') };
    const triggers = triggerDetails(series, severity, RULES.forecast);
    return { id: `formal:${merged.id ?? merged.warningId ?? merged.code ?? JSON.stringify(merged)}`, source: '正式预警', sourceType: 'formal', warningCode: text(merged.warningCode || merged.code, '气象预警'), regionName, siteName, severity, status: String(merged.status || merged.state || 'ACTIVE').toUpperCase(), warningMessage: text(merged.warningMessage || merged.message || merged.description || merged.summary, '后端未返回预警摘要。'), validFrom: window.start, validUntil: window.end, sourceBase: text(merged.sourceBase || merged.baseDate || merged.forecastBaseTime || series[0]?.baseDate), triggers, series, detail: merged };
};

const fetchFormalWarnings = async () => {
    const payload = await requestJson('/api/warnings/weather?page=1&pageSize=100');
    const records = unwrapArray(payload);
    const items = await mapLimit(records, 4, async (item) => {
        const id = item?.id ?? item?.warningId;
        if (!id) return normalizeFormal(item);
        try { return normalizeFormal(item, await requestJson(`/api/warnings/weather/${encodeURIComponent(id)}`)); } catch { return normalizeFormal(item); }
    });
    return items.filter((item) => item.severity && item.status !== 'RESOLVED');
};

const buildForecastCandidate = async ({ region, site, daily, generatedAt }) => {
    const records = futureRecords(daily, generatedAt);
    const level = levelOf(records, RULES.forecast);
    if (!level) return null;
    const regionName = text(region?.regionName || region?.regionCode || region?.name, '未命名大区域');
    const siteName = text(site?.siteName || site?.name || site?.displayName || site?.siteCode, '区域范围内');
    const trigger = triggerDetails(records, level, RULES.forecast);
    const date = trigger[0]?.firstAt?.slice(0, 10) || recordDate(records[0]);
    let hourly = [];
    let hourlyError = '';
    try { hourly = date ? await fetchHourly(site ? 'site' : 'region', site?.id ?? region?.id, date) : []; } catch (error) { hourlyError = error.message; }
    const hourlyFuture = futureRecords(hourly, generatedAt);
    const effectiveRecords = hourlyFuture.length ? hourlyFuture : records;
    const effectiveLevel = levelOf(effectiveRecords, RULES.forecast) || level;
    const exactTriggers = triggerDetails(effectiveRecords, effectiveLevel, RULES.forecast);
    const window = riskWindow(effectiveRecords, effectiveLevel, RULES.forecast);
    return { id: `candidate:${region?.id || region?.regionId}:${site?.id || 'region'}`, source: '预报候选', sourceType: 'candidate', warningCode: `${site ? '小矿区' : '区域'}预报候选 · ${siteName || regionName}`, regionName, siteName: site ? siteName : '区域范围内', regionId: String(region?.id || region?.regionId || ''), siteId: site?.id ? String(site.id) : '', severity: effectiveLevel, status: 'CANDIDATE', warningMessage: `预计在${window.start || '未来预报时段'}，${regionName}${site ? `的${siteName}` : ''}出现${exactTriggers.map((item) => `${item.type}达到${item.value}${item.unit}`).join('、') || '需要关注的风浪流条件'}。`, validFrom: window.start, validUntil: window.end, sourceBase: text(records[0]?.baseDate || records[0]?.forecastBaseTime), triggers: exactTriggers, daily: records, hourly: hourlyFuture, hourlyError };
};

const collectCandidates = async (generatedAt) => {
    const regions = unwrapArray(await requestJson('/api/mining-overview/regions'));
    const errors = [];
    const results = await mapLimit(regions, REGION_CONCURRENCY, async (region) => {
        const regionId = region?.id ?? region?.regionId;
        if (!regionId) return { candidates: [], errors: ['大区域缺少编号'] };
        let daily = [];
        let sites = [];
        try { daily = unwrapArray(await requestJson(`/api/mining-overview/regions/${encodeURIComponent(regionId)}/daily`)); } catch (error) { errors.push(`${text(region?.regionName, '未知区域')}逐日预报：${error.message}`); }
        try { sites = unwrapArray(await requestJson(`/api/mining-overview/sites?regionId=${encodeURIComponent(regionId)}`)); } catch (error) { errors.push(`${text(region?.regionName, '未知区域')}小矿区列表：${error.message}`); }
        const siteResults = await mapLimit(sites, SITE_CONCURRENCY, async (site) => {
            try { const siteDaily = unwrapArray(await requestJson(`/api/mining-overview/sites/${encodeURIComponent(site.id ?? site.siteId)}/daily`)); return await buildForecastCandidate({ region, site, daily: siteDaily, generatedAt }); } catch (error) { errors.push(`${text(site?.siteName || site?.name, '未知小矿区')}预报：${error.message}`); return null; }
        });
        const siteCandidates = siteResults.filter(Boolean);
        let regionCandidate = null;
        if (!siteCandidates.length || siteCandidates.some((item) => item.severity === 'CRITICAL')) regionCandidate = await buildForecastCandidate({ region, daily, generatedAt });
        return { candidates: [...siteCandidates, ...(regionCandidate ? [regionCandidate] : [])], errors: [] };
    });
    return { items: results.flatMap((result) => result.candidates || []), errors };
};

const collectBuoyWarnings = async () => {
    const [buoyPayload, livePayload] = await Promise.all([requestJson('/api/buoys'), requestJson('/api/buoys/realtime')]);
    const buoys = unwrapArray(buoyPayload); const live = unwrapArray(livePayload);
    const buoyById = new Map(buoys.map((item) => [String(item.id ?? item.buoyId), item]));
    return live.flatMap((row) => {
        const merged = { ...(buoyById.get(String(row.buoyId ?? row.id)) || {}), ...row };
        const values = metricValues(merged, RULES.buoy); const level = levelOf([merged], RULES.buoy);
        if (!level) return [];
        const triggers = triggerDetails([merged], level, RULES.buoy);
        const buoyName = text(merged.name || merged.buoyName || merged.displayName || merged.buoyId, '未命名浮标');
        const regionName = text(merged.regionName || merged.areaName || merged.region, '浮标监测区域');
        const observedAt = text(merged.timestamp || merged.observedAt || merged.time, '');
        return [{ id: `buoy:${merged.buoyId ?? merged.id}`, source: '浮标监测', sourceType: 'buoy', warningCode: `浮标实时风险 · ${buoyName}`, regionName, siteName: buoyName, severity: level, status: 'ACTIVE', warningMessage: `浮标“${buoyName}”于${formatTimeValue(observedAt)}监测到${triggers.map((item) => `${item.type}${item.value}${item.unit}`).join('、')}，当前为${severityText[level]}风险。`, validFrom: observedAt, validUntil: observedAt, sourceBase: '浮标实时接口', triggers, current: values, observedAt, detail: merged }];
    });
};

const fingerprint = (item) => JSON.stringify({
    severity: item.severity,
    warningMessage: item.warningMessage,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    sourceBase: item.sourceBase,
    triggers: (item.triggers || []).map((trigger) => ({ type: trigger.type, value: trigger.value, threshold: trigger.threshold, firstAt: trigger.firstAt, peakAt: trigger.peakAt })),
    current: item.current ? { wind: item.current.wind, wave: item.current.wave, current: item.current.current } : null
});
const readState = async () => { try { return JSON.parse(await (await import('node:fs/promises')).readFile(path.join(OUTPUT_DIR, 'state.json'), 'utf8')); } catch { return { active: {}, history: [] }; } };
const writeAtomic = async (file, content) => { const temporary = `${file}.tmp`; await writeFile(temporary, content, 'utf8'); await rename(temporary, file); };
const safeName = (value) => String(value || '未命名预警').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60);

const itemConclusion = (item) => {
    const scope = item.siteName && item.siteName !== '区域范围内' ? `${item.regionName}的${item.siteName}` : item.regionName;
    const triggerText = item.triggers?.map((trigger) => `${trigger.type}达到${trigger.value}${trigger.unit}`).join('、') || '风险指标达到判定条件';
    return `预计在${formatTimeValue(item.validFrom)}，${scope}将出现${triggerText}${item.validUntil ? `，预计持续至${formatTimeValue(item.validUntil)}` : ''}。`;
};
const itemLines = (item) => {
    const lines = [`【${item.source}】${item.warningCode}`, `具体区域：${item.regionName}`, `具体矿区/浮标：${item.siteName || '区域范围内'}`, `风险等级：${severityText[item.severity] || item.severity}`, `数据基准：${text(item.sourceBase)}`, `预计开始/监测时间：${formatTimeValue(item.validFrom)}`, `预计结束/最新时间：${formatTimeValue(item.validUntil)}`, '', '一、预警结论', itemConclusion(item), `原始摘要：${item.warningMessage}`, '', '二、触发指标'];
    if (item.triggers?.length) item.triggers.forEach((trigger) => lines.push(`${trigger.type}：${trigger.value}${trigger.unit}，判定阈值${trigger.threshold}${trigger.unit}${trigger.firstAt ? `，首次达到时间${trigger.firstAt}` : ''}${trigger.peakAt ? `，峰值时间${trigger.peakAt}` : ''}`));
    else lines.push('未提取到结构化触发指标。');
    if (item.daily?.length) { lines.push('', '三、逐日预报摘要'); item.daily.slice(0, 7).forEach((record) => lines.push(`${recordDate(record)}：${metricsText(record, RULES.forecast)}`)); }
    if (item.hourly?.length) { lines.push('', '四、逐小时预报摘要'); item.hourly.slice(0, 24).forEach((record) => lines.push(`${recordDateTimeText(record)}：${metricsText(record, RULES.forecast)}`)); }
    if (item.current) lines.push('', '三、浮标最新读数', `风速${formatNumber(item.current.wind)}米/秒，浪高${formatNumber(item.current.wave)}米，流速${formatNumber(item.current.current)}米/秒。`);
    lines.push('', '五、处置建议', item.severity === 'CRITICAL' ? '建议暂停高风险海上作业，启动值守和避险预案。' : item.severity === 'WARNING' ? '建议加强现场值守，谨慎安排敏感作业，并持续跟踪最新数据。' : '建议关注后续预报更新，按常规值守要求安排作业。');
    return lines;
};
const createSnapshot = ({ generatedAt, items, errors }) => {
    const counts = Object.fromEntries(['正式预警', '预报候选', '浮标监测'].map((source) => [source, items.filter((item) => item.source === source).length]));
    const lines = ['深海采矿自动预警报文快照', '========================================', `报文生成时间：${formatDateTime(generatedAt)}`, `数据接口地址：${API_BASE_URL}`, '说明：本报文由当前后端正式预警、区域/小矿区预报和浮标实时接口数据整理生成，不改变后端正式预警判定。', '', '一、当前预警概览', `当前预警总数：${items.length} 条`, `正式预警：${counts['正式预警']} 条；预报候选：${counts['预报候选']} 条；浮标实时风险：${counts['浮标监测']} 条`, ''];
    if (!items.length) lines.push('当前接口数据中暂无生效的正式预警、预报候选或浮标风险。');
    ['正式预警', '预报候选', '浮标监测'].forEach((source) => { const sourceItems = items.filter((item) => item.source === source); if (!sourceItems.length) return; lines.push(`二、${source}`); sourceItems.forEach((item) => lines.push(...itemLines(item), '')); });
    if (errors.length) { lines.push('六、数据质量提醒'); errors.forEach((error) => lines.push(`- ${error}`)); lines.push('接口失败的数据源不参与预警解除判断，请在下一轮任务恢复后复核。'); }
    lines.push('========================================', '报文结束');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
};

const eventText = (type, item) => type === 'created' ? `发现${item.warningCode}，当前等级为${severityText[item.severity] || item.severity}。` : type === 'updated' ? `${item.warningCode}的风险等级、指标或有效时间发生变化。` : `${item.warningCode}已解除，最新数据不再满足原风险条件。`;
const createEventReport = ({ generatedAt, type, item, previous }) => {
    const title = type === 'created' ? '预警新增报文' : type === 'updated' ? '预警更新报文' : '预警解除报文';
    const lines = [title, '========================================', `事件时间：${formatDateTime(generatedAt)}`, `事件类型：${type === 'created' ? '新增' : type === 'updated' ? '更新' : '解除'}`, `预警编号：${item.warningCode || previous?.warningCode || '--'}`, eventText(type, item), ''];
    lines.push(...itemLines(item));
    if (previous && type === 'updated') { lines.push('', '六、更新前后对比', `更新前等级：${severityText[previous.severity] || previous.severity}`, `更新后等级：${severityText[item.severity] || item.severity}`, `更新前风险时间：${formatTimeValue(previous.validFrom)} 至 ${formatTimeValue(previous.validUntil)}`, `更新后风险时间：${formatTimeValue(item.validFrom)} 至 ${formatTimeValue(item.validUntil)}`); }
    if (type === 'resolved') lines.push('', '六、解除说明', '本次解除仅表示当前一轮数据已不再满足原风险条件，历史报文仍保留用于追溯。');
    lines.push('', '========================================', '报文结束');
    return lines.join('\n') + '\n';
};

const relativeFile = (file) => path.relative(OUTPUT_DIR, file).split(path.sep).join('/');
const writeReport = async (directory, filename, content) => { await mkdir(directory, { recursive: true }); const file = path.join(directory, filename); await writeAtomic(file, content); return file; };
const cleanupReports = async () => {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600_000;
    const visit = async (directory) => { const entries = await readdir(directory, { withFileTypes: true }).catch(() => []); for (const entry of entries) { const file = path.join(directory, entry.name); if (entry.isDirectory()) await visit(file); else if ((entry.name.startsWith('预警快照_') || entry.name.startsWith('预警事件_')) && (await stat(file).catch(() => null))?.mtimeMs < cutoff) await unlink(file).catch(() => {}); } };
    await visit(OUTPUT_DIR);
};

const runJob = async () => {
    const generatedAt = getReportNow();
    await mkdir(OUTPUT_DIR, { recursive: true });
    const errors = [];
    const availability = { formal: false, candidate: false, buoy: false };
    let formal = []; let candidates = []; let buoy = [];
    try { formal = await fetchFormalWarnings(); availability.formal = true; } catch (error) { errors.push(`正式预警接口：${error.message}`); }
    try { const result = await collectCandidates(generatedAt); candidates = result.items; errors.push(...result.errors); availability.candidate = true; } catch (error) { errors.push(`预报候选接口：${error.message}`); }
    try { buoy = await collectBuoyWarnings(); availability.buoy = true; } catch (error) { errors.push(`浮标接口：${error.message}`); }
    const items = [...formal, ...candidates, ...buoy];
    const state = await readState();
    const previousActive = state.active && typeof state.active === 'object' ? state.active : {};
    const currentById = new Map(items.map((item) => [item.id, item]));
    const events = []; const nextActive = {};
    for (const item of items) {
        const previous = previousActive[item.id]; const nextFingerprint = fingerprint(item);
        const type = !previous ? 'created' : previous.fingerprint !== nextFingerprint ? 'updated' : '';
        nextActive[item.id] = { item, fingerprint: nextFingerprint, firstSeenAt: previous?.firstSeenAt || generatedAt.toISOString(), lastUpdatedAt: type ? generatedAt.toISOString() : previous?.lastUpdatedAt || generatedAt.toISOString() };
        if (type) events.push({ type, item, previous: previous?.item || null });
    }
    for (const [id, previous] of Object.entries(previousActive)) {
        if (currentById.has(id)) continue;
        const sourceKey = previous.item?.sourceType || (previous.item?.source === '正式预警' ? 'formal' : previous.item?.source === '预报候选' ? 'candidate' : 'buoy');
        if (!availability[sourceKey]) { nextActive[id] = previous; continue; }
        events.push({ type: 'resolved', item: previous.item, previous: previous.item });
    }
    const stamp = formatFileStamp(generatedAt); const day = formatDate(generatedAt); const dayPath = day.replace(/-/g, '/');
    const snapshotFile = await writeReport(path.join(OUTPUT_DIR, 'snapshots', dayPath), `预警快照_${stamp}.txt`, createSnapshot({ generatedAt, items, errors }));
    const eventFiles = [];
    for (const event of events) {
        const base = event.item?.warningCode || event.item?.id || '预警';
        const uniqueId = safeName(event.item?.id || `${event.item?.source || 'warning'}_${event.item?.regionName || ''}_${event.item?.siteName || ''}`);
        const file = await writeReport(path.join(OUTPUT_DIR, 'events', dayPath), `预警事件_${safeName(base)}_${uniqueId}_${event.type}_${stamp}.txt`, createEventReport({ generatedAt, ...event }));
        eventFiles.push({ type: event.type, warningCode: base, file: relativeFile(file) });
    }
    const history = Array.isArray(state.history) ? state.history : [];
    events.forEach((event) => history.push({ at: generatedAt.toISOString(), type: event.type, warningCode: event.item?.warningCode, id: event.item?.id, file: eventFiles.find((file) => file.warningCode === (event.item?.warningCode || event.item?.id))?.file || '' }));
    const nextState = { generatedAt: generatedAt.toISOString(), active: nextActive, history: history.slice(-1000) };
    await writeAtomic(path.join(OUTPUT_DIR, 'state.json'), JSON.stringify(nextState, null, 2));
    const latest = { snapshot: relativeFile(snapshotFile), generatedAt: formatDateTime(generatedAt), generatedAtIso: generatedAt.toISOString(), counts: { total: items.length, formal: formal.length, candidate: candidates.length, buoy: buoy.length }, events: eventFiles, errors };
    await writeAtomic(path.join(OUTPUT_DIR, 'latest.json'), JSON.stringify(latest, null, 2));
    const indexFile = path.join(OUTPUT_DIR, 'index.json'); let index = { reports: [] }; try { index = JSON.parse(await (await import('node:fs/promises')).readFile(indexFile, 'utf8')); } catch { /* 首次运行 */ }
    index.reports = [{ ...latest }, ...(Array.isArray(index.reports) ? index.reports : [])].slice(0, 500);
    await writeAtomic(indexFile, JSON.stringify(index, null, 2));
    await cleanupReports();
    console.log(`[warning-report] 已生成快照：${snapshotFile}；事件：${eventFiles.length}；当前预警：${items.length}`);
    return latest;
};

const runOnce = async () => { try { await runJob(); } catch (error) { console.error(`[warning-report] 生成失败：${error.message}`); process.exitCode = 1; } };
const runWatch = async () => { let running = false; const execute = async () => { if (running) return; running = true; try { await runJob(); } catch (error) { console.error(`[warning-report] 本轮失败：${error.message}`); } finally { running = false; } }; await execute(); const scheduleNext = () => setTimeout(async () => { await execute(); scheduleNext(); }, INTERVAL_MINUTES * 60_000); scheduleNext(); console.log(`[warning-report] 定时服务已启动，每 ${INTERVAL_MINUTES} 分钟执行一次。`); };

if (process.argv.includes('--watch')) await runWatch(); else await runOnce();
