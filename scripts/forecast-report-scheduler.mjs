import { mkdir, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const DEFAULT_API_BASE_URL = 'http://121.194.93.61:8082';
const API_BASE_URL = (process.env.FORECAST_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.FORECAST_REPORT_OUTPUT_DIR || './forecast-reports');
const INTERVAL_MINUTES = Math.max(5, Number(process.env.FORECAST_REPORT_INTERVAL_MINUTES || 60));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.FORECAST_REPORT_REQUEST_TIMEOUT_MS || 30_000));
const SITE_CONCURRENCY = Math.max(1, Number(process.env.FORECAST_REPORT_SITE_CONCURRENCY || 6));
const REGION_CONCURRENCY = Math.max(1, Number(process.env.FORECAST_REPORT_REGION_CONCURRENCY || 3));
const RETENTION_DAYS = Math.max(1, Number(process.env.FORECAST_REPORT_RETENTION_DAYS || 30));
const DAILY_HORIZON_DAYS = Math.max(1, Number(process.env.FORECAST_REPORT_DAILY_HORIZON_DAYS || 15));
const HOURLY_HORIZON_HOURS = Math.max(1, Number(process.env.FORECAST_REPORT_HOURLY_HORIZON_HOURS || 12));
const REPORT_NOW_OVERRIDE = String(process.env.FORECAST_REPORT_NOW || '').trim();

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const pad = (value) => String(value).padStart(2, '0');
const formatParts = (formatter, date) => Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
);
const formatDateTime = (date) => {
    const parts = formatParts(dateTimeFormatter, date);
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};
const formatDate = (date) => {
    const parts = formatParts(dateFormatter, date);
    return `${parts.year}-${parts.month}-${parts.day}`;
};
const formatFileStamp = (date) => {
    const parts = formatParts(dateTimeFormatter, date);
    return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`;
};
const formatNumber = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
const text = (value, fallback = '--') => value === undefined || value === null || value === '' ? fallback : String(value);
const firstValue = (record, fields) => fields.map((field) => record?.[field]).find((value) => value !== undefined && value !== null && value !== '');
const numberValue = (record, fields) => {
    const value = Number(firstValue(record, fields));
    return Number.isFinite(value) ? value : null;
};
const getReportNow = () => {
    if (!REPORT_NOW_OVERRIDE) return new Date();
    const normalized = REPORT_NOW_OVERRIDE.replace(' ', 'T');
    const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}+08:00`);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`FORECAST_REPORT_NOW 无法解析：${REPORT_NOW_OVERRIDE}`);
    }
    return parsed;
};

const unwrapArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
};

const requestJson = async (endpoint) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
        });
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
        }
        try {
            const payload = body ? JSON.parse(body) : null;
            if (payload?.success === false) {
                throw new Error(payload.error || payload.message || '接口返回失败');
            }
            return payload;
        } catch {
            throw new Error(`接口返回不是 JSON：${body.slice(0, 180)}`);
        }
    } finally {
        clearTimeout(timer);
    }
};

const parseDateOnly = (value) => {
    const match = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    return match ? `${match[1]}-${pad(match[2])}-${pad(match[3])}` : '';
};

const parseHour = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const raw = String(value).trim();
    const timeMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?/);
    if (!timeMatch) return null;
    const first = Number(timeMatch[1]);
    if (raw.includes(':')) return first >= 0 && first <= 23 ? first : null;
    if (first >= 0 && first <= 23) return first;
    if (first >= 100 && first <= 2359) return Math.floor(first / 100);
    return null;
};

const parseRecordTime = (record) => {
    const raw = firstValue(record, ['forecastTime', 'validTime', 'forecastDateTime', 'datetime', 'timestamp']);
    if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw || ''))) {
        const numeric = Number(raw);
        const timestamp = new Date(String(raw).length === 10 ? numeric * 1000 : numeric);
        return Number.isNaN(timestamp.getTime()) ? null : timestamp;
    }

    const rawText = String(raw || '').trim();
    const rawDate = parseDateOnly(rawText) || parseDateOnly(record?.forecastDate || record?.date);
    if (!rawDate) return null;
    const hasDateTime = /\d{4}[-/]\d{1,2}[-/]\d{1,2}[T\s]\d{1,2}/.test(rawText);
    if (hasDateTime) {
        const normalized = rawText.replace(/\//g, '-').replace(' ', 'T');
        const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}+08:00`);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const embeddedTime = rawText.match(/(?:T|\s|^)(\d{1,2})(?::(\d{2}))?/);
    const hour = embeddedTime ? Number(embeddedTime[1]) : parseHour(firstValue(record, ['forecastHour', 'hour', 'timeIndex', 'hourOfDay', 'forecastTime']));
    const minute = embeddedTime?.[2] ? Number(embeddedTime[2]) : 0;
    const local = `${rawDate}T${pad(hour ?? 0)}:${pad(minute)}:00+08:00`;
    const parsed = new Date(local);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const recordDate = (record) => parseDateOnly(record?.forecastDate || record?.date) || (parseRecordTime(record) ? formatDate(parseRecordTime(record)) : '');
const recordKey = (record) => `${recordDate(record)}|${parseRecordTime(record)?.getTime() || JSON.stringify(record)}`;
const sortRecords = (records) => [...records].sort((first, second) => {
    const firstTime = parseRecordTime(first)?.getTime() || Number.MAX_SAFE_INTEGER;
    const secondTime = parseRecordTime(second)?.getTime() || Number.MAX_SAFE_INTEGER;
    return firstTime - secondTime;
});
const uniqueRecords = (records) => [...new Map(records.map((record) => [recordKey(record), record])).values()];

const localDateAfter = (date, days) => {
    const next = new Date(`${date}T00:00:00+08:00`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
};
const currentLocalDate = (date) => formatDate(date);
const dateCandidates = (dailyRecords, now) => {
    const today = currentLocalDate(now);
    const dates = [today, localDateAfter(today, 1)];
    for (const record of sortRecords(dailyRecords)) {
        const date = recordDate(record);
        if (date && date >= today && !dates.includes(date)) dates.push(date);
        if (dates.length >= 2) break;
    }
    return dates.slice(0, 2);
};

const metrics = (record) => ({
    wind: numberValue(record, ['windSpeedMax', 'windSpeedAvg', 'windSpeed', 'wind_speed', 'wind']),
    gust: numberValue(record, ['gustMax', 'gust', 'windGust', 'wind_gust']),
    wave: numberValue(record, ['waveHeightMax', 'waveHeightAvg', 'waveHeight', 'wave_height', 'wave']),
    current: numberValue(record, ['currentSpeedMax', 'currentSpeedAvg', 'currentSpeed', 'current_speed', 'current'])
});

const maxMetric = (records, key) => records.reduce((max, record) => {
    const value = metrics(record)[key];
    return value === null ? max : max === null ? value : Math.max(max, value);
}, null);
const averageMetric = (records, key) => {
    const values = records.map((record) => metrics(record)[key]).filter((value) => value !== null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};
const summaryMetrics = (records) => ({
    wind: averageMetric(records, 'wind'),
    maxWind: maxMetric(records, 'wind'),
    gust: maxMetric(records, 'gust'),
    wave: averageMetric(records, 'wave'),
    maxWave: maxMetric(records, 'wave'),
    current: averageMetric(records, 'current'),
    maxCurrent: maxMetric(records, 'current')
});

const notableReasons = (records) => {
    const summary = summaryMetrics(records);
    const reasons = [];
    if (summary.maxWind !== null && summary.maxWind >= 12) reasons.push(`最大风速${formatNumber(summary.maxWind)} m/s`);
    if (summary.gust !== null && summary.gust >= 15) reasons.push(`最大阵风${formatNumber(summary.gust)} m/s`);
    if (summary.maxWave !== null && summary.maxWave >= 3) reasons.push(`最大浪高${formatNumber(summary.maxWave)} m`);
    if (summary.maxCurrent !== null && summary.maxCurrent >= 1.5) reasons.push(`最大流速${formatNumber(summary.maxCurrent)} m/s`);

    const ordered = sortRecords(records);
    for (let index = 1; index < ordered.length; index += 1) {
        const previous = metrics(ordered[index - 1]);
        const current = metrics(ordered[index]);
        if (previous.wind !== null && current.wind !== null && current.wind - previous.wind >= 3) reasons.push('风速变化较快');
        if (previous.wave !== null && current.wave !== null && current.wave - previous.wave >= 1) reasons.push('浪高变化较快');
        if (previous.current !== null && current.current !== null && current.current - previous.current >= 0.5) reasons.push('流速变化较快');
    }
    return [...new Set(reasons)];
};

const sourceBase = (records) => {
    const values = records.flatMap((record) => [
        record?.baseDate,
        record?.forecastBaseTime,
        record?.issuedAt,
        record?.issueTime,
        record?.dataTime,
        record?.generatedAt
    ]).filter(Boolean).map((value) => String(value));
    return values.sort().at(-1) || '--';
};
const sourceBaseDate = (records) => {
    const dates = records.flatMap((record) => [
        record?.baseDate,
        record?.forecastBaseTime,
        record?.issuedAt,
        record?.issueTime,
        record?.dataTime,
        record?.generatedAt
    ]).map(parseDateOnly).filter(Boolean).sort();
    return dates.at(-1) || '';
};

const mapLimit = async (items, limit, handler) => {
    const results = new Array(items.length);
    let cursor = 0;
    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await handler(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, worker));
    return results;
};

const fetchHourly = async (kind, id, dates) => {
    const records = [];
    const errors = [];
    for (const date of dates) {
        const endpoint = kind === 'region'
            ? `/api/mining-overview/regions/${encodeURIComponent(id)}/hourly?forecastDate=${encodeURIComponent(date)}`
            : `/api/mining-overview/sites/${encodeURIComponent(id)}/hourly?forecastDate=${encodeURIComponent(date)}`;
        try {
            records.push(...unwrapArray(await requestJson(endpoint)));
        } catch (error) {
            errors.push(`${date}: ${error.message}`);
        }
    }
    return { records: sortRecords(uniqueRecords(records)), errors };
};

const fetchSiteDaily = async (site) => {
    const id = site.id ?? site.siteId;
    if (!id) return { site, records: [], error: '缺少小矿区编号' };
    try {
        return { site, records: sortRecords(unwrapArray(await requestJson(`/api/mining-overview/sites/${encodeURIComponent(id)}/daily`))), error: '' };
    } catch (error) {
        return { site, records: [], error: error.message };
    }
};

const siteName = (site) => text(site?.name || site?.displayName || site?.siteName || site?.contractor || site?.code || site?.id, '未命名小矿区');
const regionName = (region) => text(region?.regionName || region?.name || region?.regionCode || region?.code || region?.id, '未命名大区域');
const siteId = (site) => text(site?.id || site?.siteId || site?.code, '--');

const filterFutureHourly = (records, generatedAt) => {
    const sorted = sortRecords(records);
    const withTime = sorted.filter((record) => parseRecordTime(record));
    const cutoff = generatedAt.getTime();
    const future = withTime.filter((record) => parseRecordTime(record).getTime() >= cutoff && parseRecordTime(record).getTime() <= cutoff + HOURLY_HORIZON_HOURS * 3600_000);
    return withTime.length ? future : sorted.slice(0, Math.max(1, Math.ceil(HOURLY_HORIZON_HOURS / 3)));
};
const filterFutureDaily = (records, generatedAt) => {
    const today = currentLocalDate(generatedAt);
    return sortRecords(records).filter((record) => recordDate(record) >= today).slice(0, DAILY_HORIZON_DAYS);
};

const peakDescription = (records, key, label, unit) => {
    const candidates = records.map((record) => ({ record, value: metrics(record)[key] })).filter((item) => item.value !== null);
    const peak = candidates.sort((first, second) => second.value - first.value)[0];
    if (!peak) return '';
    const time = parseRecordTime(peak.record);
    const when = time ? formatDateTime(time) : recordDate(peak.record);
    return `预计在${when}，${label}达到${formatNumber(peak.value)} ${unit}`;
};

const summaryText = (records) => {
    const summary = summaryMetrics(records);
    return `平均风速${formatNumber(summary.wind)} m/s，最大风速${formatNumber(summary.maxWind)} m/s，最大阵风${formatNumber(summary.gust)} m/s，平均浪高${formatNumber(summary.wave)} m，最大浪高${formatNumber(summary.maxWave)} m，平均流速${formatNumber(summary.current)} m/s，最大流速${formatNumber(summary.maxCurrent)} m/s`;
};

const formatDailyRow = (record) => {
    const value = metrics(record);
    return `${recordDate(record) || '--'}：风速${formatNumber(value.wind)} m/s，阵风${formatNumber(value.gust)} m/s，浪高${formatNumber(value.wave)} m，流速${formatNumber(value.current)} m/s`;
};

const formatHourlyRow = (record) => {
    const value = metrics(record);
    const time = parseRecordTime(record);
    return `${time ? formatDateTime(time) : `${recordDate(record)} ${text(record?.forecastHour, '--')}`}：风速${formatNumber(value.wind)} m/s，阵风${formatNumber(value.gust)} m/s，浪高${formatNumber(value.wave)} m，流速${formatNumber(value.current)} m/s`;
};

const collectRegion = async (region, generatedAt) => {
    const id = region.id ?? region.regionId;
    if (!id) return { region, daily: [], hourly: [], sites: [], seriousDetails: [], warnings: [], errors: ['缺少大区域编号'] };
    const errors = [];
    let daily = [];
    let sites = [];
    try {
        daily = sortRecords(unwrapArray(await requestJson(`/api/mining-overview/regions/${encodeURIComponent(id)}/daily`)));
    } catch (error) {
        errors.push(`区域逐日预报：${error.message}`);
    }
    let hourly = [];
    const hourlyResult = await fetchHourly('region', id, dateCandidates(daily, generatedAt));
    hourly = hourlyResult.records;
    errors.push(...hourlyResult.errors.map((error) => `区域逐时预报：${error}`));
    try {
        sites = unwrapArray(await requestJson(`/api/mining-overview/sites?regionId=${encodeURIComponent(id)}`));
    } catch (error) {
        errors.push(`小矿区列表：${error.message}`);
    }

    const siteDailyResults = await mapLimit(sites, SITE_CONCURRENCY, fetchSiteDaily);
    const staleSiteCount = siteDailyResults.filter((item) => item.records.length && !filterFutureDaily(item.records, generatedAt).length).length;
    const serious = siteDailyResults.filter((item) => notableReasons(filterFutureDaily(item.records, generatedAt)).length > 0);
    const seriousDetails = await mapLimit(serious, SITE_CONCURRENCY, async (item) => {
        const daily = filterFutureDaily(item.records, generatedAt);
        const hourlyResult = await fetchHourly('site', item.site.id ?? item.site.siteId, dateCandidates(daily, generatedAt));
        return { ...item, daily, hourly: filterFutureHourly(hourlyResult.records, generatedAt), hourlyErrors: hourlyResult.errors, reasons: notableReasons(daily) };
    });
    errors.push(...siteDailyResults.filter((item) => item.error).map((item) => `${siteName(item.site)}逐日预报：${item.error}`));
    errors.push(...seriousDetails.flatMap((item) => item.hourlyErrors.map((error) => `${siteName(item.site)}逐时预报：${error}`)));

    const rawRecords = [...daily, ...hourly];
    const baseDate = sourceBaseDate(rawRecords);
    const warnings = [];
    if (baseDate && baseDate < currentLocalDate(generatedAt)) {
        warnings.push(`后端预报基准${baseDate}早于报文生成日期${currentLocalDate(generatedAt)}，该区域没有可用于未来时段的最新有效预报。`);
    }
    if (staleSiteCount) {
        warnings.push(`${staleSiteCount} 个小矿区接口有返回，但其逐日预报已早于报文生成日期。`);
    }

    return {
        region,
        id: String(id),
        daily: filterFutureDaily(daily, generatedAt),
        hourly: filterFutureHourly(hourly, generatedAt),
        rawDailyCount: daily.length,
        rawHourlyCount: hourly.length,
        sites,
        seriousDetails,
        sourceBase: sourceBase([...daily, ...hourly]),
        errors,
        warnings
    };
};

const createReport = ({ generatedAt, regions, regionErrors }) => {
    const allDaily = regions.flatMap((item) => item.daily);
    const allHourly = regions.flatMap((item) => item.hourly);
    const seriousSites = regions.flatMap((item) => item.seriousDetails.map((site) => ({ ...site, region: item.region })));
    const lines = [
        '深海采矿自动海洋气象预报报文',
        '========================================',
        `报文生成时间：${formatDateTime(generatedAt)}`,
        `数据接口地址：${API_BASE_URL}`,
        `预报时间范围：生成时间之后未来${HOURLY_HORIZON_HOURS}小时、未来7天、未来${DAILY_HORIZON_DAYS}天`,
        '说明：本报文仅整理当前接口返回的真实预报数据，不补造缺失数据；严重小矿区按风速、阵风、浪高、流速及变化趋势筛选。',
        '',
        '一、总体概览',
        `大区域：${regions.length} 个；小矿区：${regions.reduce((sum, item) => sum + item.sites.length, 0)} 个；重点小矿区：${seriousSites.length} 个`,
        `未来${HOURLY_HORIZON_HOURS}小时区域预报记录：${allHourly.length} 条；未来${DAILY_HORIZON_DAYS}天区域逐日记录：${allDaily.length} 条`,
        `重点筛选阈值：最大风速≥12 m/s、最大阵风≥15 m/s、最大浪高≥3 m、最大流速≥1.5 m/s，或出现明显上升趋势。`,
        '',
        `二、未来${HOURLY_HORIZON_HOURS}小时总体预报`,
        allHourly.length ? summaryText(allHourly) : '暂无可用的未来逐时预报数据。',
        peakDescription(allHourly, 'wind', '风速', 'm/s'),
        peakDescription(allHourly, 'wave', '浪高', 'm'),
        peakDescription(allHourly, 'current', '流速', 'm/s'),
        '',
        '三、未来7天与未来15天趋势概览'
    ];

    for (const region of regions) {
        const daily7 = region.daily.slice(0, 7);
        const daily15 = region.daily.slice(0, DAILY_HORIZON_DAYS);
        lines.push(`${regionName(region.region)}：`);
        lines.push(`  数据基准：${region.sourceBase}`);
        lines.push(`  未来7天：${daily7.length ? summaryText(daily7) : '暂无数据'}`);
        lines.push(`  未来${DAILY_HORIZON_DAYS}天：${daily15.length ? summaryText(daily15) : '暂无数据'}`);
        if (region.warnings.length) lines.push(`  时效提醒：${region.warnings.join('；')}`);
    }

    lines.push('', '四、各大区域详细预报');
    for (const region of regions) {
        lines.push('', `【${regionName(region.region)}】`);
        lines.push(`区域编号：${text(region.id)}`);
        lines.push(`数据基准：${region.sourceBase}`);
        lines.push(`未来${HOURLY_HORIZON_HOURS}小时：${region.hourly.length ? summaryText(region.hourly) : '暂无逐时数据'}`);
        if (region.hourly.length) {
            lines.push(`  ${peakDescription(region.hourly, 'wind', '风速', 'm/s') || '暂无风速峰值'}`);
            lines.push(`  ${peakDescription(region.hourly, 'wave', '浪高', 'm') || '暂无浪高峰值'}`);
            lines.push(`  ${peakDescription(region.hourly, 'current', '流速', 'm/s') || '暂无流速峰值'}`);
        }
        lines.push('未来逐日预报：');
        if (region.daily.length) region.daily.forEach((record) => lines.push(`  ${formatDailyRow(record)}`));
        else lines.push('  暂无逐日数据');
        lines.push(`重点小矿区：${region.seriousDetails.length ? `${region.seriousDetails.length} 个` : '暂未筛选出达到重点阈值的小矿区'}`);
        for (const item of region.seriousDetails) {
            lines.push(`  - ${siteName(item.site)}（编号：${siteId(item.site)}）：${item.reasons.join('、')}`);
            lines.push(`    未来${HOURLY_HORIZON_HOURS}小时：${item.hourly.length ? summaryText(item.hourly) : '暂无逐时数据'}`);
            const firstPeak = peakDescription(item.hourly, 'wind', '风速', 'm/s') || peakDescription(item.hourly, 'wave', '浪高', 'm') || '';
            if (firstPeak) lines.push(`    重点时段：${firstPeak}`);
        }
    }

    lines.push('', '五、重点小矿区提醒汇总');
    if (seriousSites.length) {
        for (const item of seriousSites) {
            lines.push(`${regionName(item.region)} / ${siteName(item.site)}：${item.reasons.join('、')}`);
            lines.push(`  预报结论：${item.hourly.length ? summaryText(item.hourly) : summaryText(item.daily)}`);
            const peak = peakDescription(item.hourly, 'wind', '风速', 'm/s') || peakDescription(item.hourly, 'wave', '浪高', 'm') || peakDescription(item.daily, 'wind', '风速', 'm/s');
            if (peak) lines.push(`  ${peak}`);
        }
    } else {
        lines.push('当前预报范围内暂未筛选出达到重点提醒阈值的小矿区。');
    }

    lines.push('', '六、数据质量与作业建议');
    const warnings = regions.flatMap((item) => item.warnings.map((warning) => `${regionName(item.region)}：${warning}`));
    if (warnings.length) {
        lines.push('数据时效提醒：');
        warnings.forEach((warning) => lines.push(`- ${warning}`));
    }
    if (regionErrors.length || regions.some((item) => item.errors.length)) {
        lines.push('本次报文存在部分接口失败，以下数据不应视为完整覆盖：');
        [...regionErrors, ...regions.flatMap((item) => item.errors.map((error) => `${regionName(item.region)}：${error}`))].forEach((error) => lines.push(`- ${error}`));
    } else if (!warnings.length) {
        lines.push('本次区域、小矿区逐日及重点小矿区逐时数据均请求成功。');
    }
    lines.push(warnings.length
        ? '由于部分或全部预报基准已过期，本次不生成常规作业安全结论；请先更新后端预报数据。'
        : seriousSites.length
            ? '建议加强重点小矿区值守，结合重点时段安排作业窗口；严重海况请以实际预警和现场监测为准。'
            : '当前指标总体未达到重点提醒阈值，可按计划开展常规作业并关注下一轮报文。');
    lines.push('', '========================================', '报文结束');
    return lines.filter((line, index) => !(line === '' && lines[index - 1] === '')).join('\n') + '\n';
};

const cleanupReports = async () => {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600_000;
    const files = await readdir(OUTPUT_DIR, { withFileTypes: true });
    await Promise.all(files.filter((entry) => entry.isFile() && /^预报报文_\d{8}_\d{4}\.txt$/.test(entry.name)).map(async (entry) => {
        const file = path.join(OUTPUT_DIR, entry.name);
        const fileInfo = await stat(file).catch(() => null);
        if (!fileInfo) return;
        const match = entry.name.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/);
        if (!match) return;
        const time = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+08:00`);
        if (Number.isFinite(time) && time < cutoff) await unlink(file);
    }));
};

const runJob = async () => {
    const generatedAt = getReportNow();
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`[forecast-report] 开始生成：${formatDateTime(generatedAt)}，接口：${API_BASE_URL}`);
    const regionErrors = [];
    let regions = [];
    try {
        regions = unwrapArray(await requestJson('/api/mining-overview/regions'));
    } catch (error) {
        throw new Error(`无法获取大区域列表：${error.message}`);
    }
    const results = await mapLimit(regions, REGION_CONCURRENCY, async (region) => {
        try {
            return await collectRegion(region, generatedAt);
        } catch (error) {
            return { region, id: String(region?.id || region?.regionId || ''), daily: [], hourly: [], sites: [], seriousDetails: [], sourceBase: '--', errors: [error.message], warnings: [] };
        }
    });
    const report = createReport({ generatedAt, regions: results, regionErrors });
    const stamp = formatFileStamp(generatedAt);
    const filename = `预报报文_${stamp}.txt`;
    const target = path.join(OUTPUT_DIR, filename);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, report, 'utf8');
    await rename(temporary, target);
    const latest = {
        filename,
        generatedAt: formatDateTime(generatedAt),
        generatedAtIso: generatedAt.toISOString(),
        apiBaseUrl: API_BASE_URL,
        regionCount: results.length,
        siteCount: results.reduce((sum, item) => sum + item.sites.length, 0),
        seriousSiteCount: results.reduce((sum, item) => sum + item.seriousDetails.length, 0),
        path: target
    };
    await writeFile(path.join(OUTPUT_DIR, 'latest.json'), JSON.stringify(latest, null, 2), 'utf8');
    await cleanupReports();
    console.log(`[forecast-report] 已生成：${target}`);
    return latest;
};

const runOnce = async () => {
    try {
        await runJob();
    } catch (error) {
        console.error(`[forecast-report] 生成失败：${error.message}`);
        process.exitCode = 1;
    }
};

const runWatch = async () => {
    let running = false;
    const execute = async () => {
        if (running) {
            console.warn('[forecast-report] 上一轮仍在执行，本轮跳过。');
            return;
        }
        running = true;
        try {
            await runJob();
        } catch (error) {
            console.error(`[forecast-report] 本轮失败：${error.message}`);
        } finally {
            running = false;
        }
    };
    await execute();
    const scheduleNext = () => setTimeout(async () => {
        await execute();
        scheduleNext();
    }, INTERVAL_MINUTES * 60_000);
    scheduleNext();
    console.log(`[forecast-report] 定时服务已启动，每 ${INTERVAL_MINUTES} 分钟执行一次。`);
};

if (process.argv.includes('--watch')) {
    await runWatch();
} else {
    await runOnce();
}
