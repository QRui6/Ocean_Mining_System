import {
    fetchMiningOverviewRegionDaily,
    fetchMiningOverviewRegionHourly,
    fetchMiningOverviewRegions,
    fetchMiningOverviewSiteDaily,
    fetchMiningOverviewSiteHourly,
    fetchMiningOverviewSites
} from '../api/miningRegionOverview.js';

const ATTENTION = { wind: 10, gust: 12, wave: 2.5, current: 1 };
const WARNING = { wind: 12, gust: 15, wave: 3, current: 1.5 };
const CRITICAL = { wind: 18, gust: 22, wave: 5, current: 2 };
const CACHE_TTL = 90 * 1000;
let cache = { expiresAt: 0, value: null };

const numberValue = (record, fields) => {
    for (const field of fields) {
        const value = Number(record?.[field]);
        if (Number.isFinite(value)) return value;
    }
    return null;
};

const metrics = (record = {}) => ({
    wind: numberValue(record, ['windSpeedMax', 'windSpeedAvg', 'windSpeed', 'wind_speed', 'wind']),
    gust: numberValue(record, ['gustMax', 'gust', 'windGust', 'wind_gust']),
    wave: numberValue(record, ['waveHeightMax', 'waveHeightAvg', 'waveHeight', 'wave_height', 'wave']),
    current: numberValue(record, ['currentSpeedMax', 'currentSpeedAvg', 'currentSpeed', 'current_speed', 'current'])
});

const dateOnly = (value) => {
    const match = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}` : '';
};

const recordDate = (record) => dateOnly(record?.forecastDate || record?.date || record?.forecastTime || record?.validTime);

const recordDateTime = (record) => {
    const raw = record?.forecastTime || record?.validTime || record?.datetime || record?.time;
    if (raw && /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(raw))) {
        const match = String(raw).match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})(?:[T\s](\d{1,2})(?::?(\d{2}))?)/);
        if (match) return `${dateOnly(match[1])} ${String(match[2]).padStart(2, '0')}:${match[3] || '00'}`;
    }
    const date = recordDate(record);
    if (!date) return '';
    if (raw && /^\d{1,2}:\d{2}/.test(String(raw))) {
        const match = String(raw).match(/^(\d{1,2}):(\d{2})/);
        return `${date} ${String(match[1]).padStart(2, '0')}:${match[2]}`;
    }
    const hourValue = record?.forecastHour ?? record?.hour ?? record?.validHour;
    if (hourValue === undefined || hourValue === null || hourValue === '') return date;
    const numericHour = Number(hourValue);
    const hour = Number.isFinite(numericHour) ? (numericHour >= 100 ? Math.floor(numericHour / 100) : numericHour) : String(hourValue).split(':')[0];
    return `${date} ${String(hour).padStart(2, '0')}:00`;
};

const parseForecastTime = (value) => {
    const normalized = String(value || '').trim().replace(' ', 'T');
    if (!normalized) return null;
    const date = new Date(normalized.length === 16 ? `${normalized}:00` : normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
    const date = dateOnly(value);
    if (!date) return '未知时间';
    return date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日');
};

const formatDateTime = (value) => {
    const match = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})(?:\s|T)(\d{2}):?(\d{2})?/);
    if (!match) return formatDate(value);
    return `${match[1]}年${match[2]}月${match[3]}日${match[4]}时${match[5] || '00'}分`;
};

const formatNumber = (value) => Number.isFinite(value) ? value.toFixed(1) : '--';

const baseDateOf = (records) => [...new Set(records.map((record) => dateOnly(record?.baseDate || record?.forecastBaseTime || record?.issuedAt)).filter(Boolean))].sort().at(-1) || '';

const staleOf = (baseDate) => {
    if (!baseDate) return true;
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return baseDate < localToday;
};

const levelOf = (summary) => {
    if (Object.entries(CRITICAL).some(([key, threshold]) => (summary[key] ?? -Infinity) >= threshold)) return 'CRITICAL';
    if (Object.entries(WARNING).some(([key, threshold]) => (summary[key] ?? -Infinity) >= threshold)) return 'WARNING';
    if (Object.entries(ATTENTION).some(([key, threshold]) => (summary[key] ?? -Infinity) >= threshold)) return 'INFO';
    return '';
};

const unitOf = (key) => ({ wind: 'm/s', gust: 'm/s', wave: 'm', current: 'm/s' }[key] || '');
const labelOf = (key) => ({ wind: '风速', gust: '最大阵风', wave: '浪高', current: '流速' }[key] || key);

const summarize = (records) => {
    const summary = {};
    for (const key of Object.keys(ATTENTION)) {
        const values = records.map((record) => metrics(record)[key]).filter((value) => value !== null);
        summary[key] = values.length ? Math.max(...values) : null;
    }
    return summary;
};

const triggerDetails = (records, summary, level) => {
    const thresholds = level === 'CRITICAL' ? CRITICAL : level === 'WARNING' ? WARNING : ATTENTION;
    return Object.keys(ATTENTION).flatMap((key) => {
        const value = summary[key];
        if (value === null || value < thresholds[key]) return [];
        const record = records.find((item) => (metrics(item)[key] ?? -Infinity) >= thresholds[key]);
        return [{
            type: labelOf(key),
            value: formatNumber(value),
            unit: unitOf(key),
            threshold: formatNumber(thresholds[key]),
            forecastDate: recordDate(record)
        }];
    });
};

const notableDates = (records) => {
    const ordered = [...records].sort((a, b) => recordDate(a).localeCompare(recordDate(b)));
    const results = [];
    ordered.forEach((record, index) => {
        const current = metrics(record);
        const previous = metrics(ordered[index - 1]);
        const reasons = [];
        if (current.wind >= WARNING.wind) reasons.push(`风速${formatNumber(current.wind)} m/s`);
        if (current.gust >= WARNING.gust) reasons.push(`阵风${formatNumber(current.gust)} m/s`);
        if (current.wave >= WARNING.wave) reasons.push(`浪高${formatNumber(current.wave)} m`);
        if (current.current >= WARNING.current) reasons.push(`流速${formatNumber(current.current)} m/s`);
        if (previous.wind !== null && current.wind !== null && current.wind - previous.wind >= 3) reasons.push('风速上升较快');
        if (previous.wave !== null && current.wave !== null && current.wave - previous.wave >= 1) reasons.push('浪高上升较快');
        if (previous.current !== null && current.current !== null && current.current - previous.current >= 0.5) reasons.push('流速上升较快');
        if (reasons.length) results.push({ date: recordDate(record), reasons: [...new Set(reasons)] });
    });
    return results.slice(0, 4);
};

const buildBulletin = ({ scope, regionName, siteName, records, summary, level, baseDate, stale }) => {
    const dates = notableDates(records);
    const firstDate = dates[0]?.date || recordDate(records[0]);
    const detail = triggerDetails(records, summary, level);
    const lines = [
        `${scope}预警候选分析`,
        `预报对象：${regionName}${siteName ? ` / ${siteName}` : ''}`,
        `数据基准：${baseDate || '未知'}${stale ? '（当前数据基准早于系统日期，请先核对数据时效）' : ''}`,
        `预警级别：${level === 'CRITICAL' ? '严重' : level === 'WARNING' ? '预警' : '关注'}`,
        '',
        `预计在${formatDate(firstDate)}前后，${detail.map((item) => `${item.type}达到${item.value}${item.unit}`).join('、') || '部分海况指标达到关注阈值'}。`,
        dates.length ? `未来重点时段：${dates.map((item) => `${formatDate(item.date)}（${item.reasons.join('、')}）`).join('；')}。` : '未来时段暂未识别出明显快速变化。',
        level === 'CRITICAL' ? '作业建议：建议暂停高风险海上作业，启动值守和避险预案。' : level === 'WARNING' ? '作业建议：建议加强现场值守，谨慎安排敏感作业并持续跟踪后续预报。' : '作业建议：建议关注后续预报更新，按常规值守要求安排作业。',
        '',
        '说明：本记录为前端依据当前后端区域/小矿区预报数据计算出的候选，不等同于后端正式发布的气象预警。'
    ];
    return lines.join('\n');
};

const buildCandidate = ({ region, site, records }) => {
    const validRecords = records.filter(Boolean);
    const summary = summarize(validRecords);
    const level = levelOf(summary);
    if (!level) return null;
    const regionName = region?.regionName || region?.regionCode || `区域${region?.id || '--'}`;
    const siteName = site?.name || site?.displayName || site?.siteName || site?.siteCode || '';
    const baseDate = baseDateOf(validRecords);
    const stale = staleOf(baseDate);
    const scope = siteName ? '小矿区' : '区域';
    const trigger = triggerDetails(validRecords, summary, level);
    const range = validRecords.length > 1 ? '7d' : '12h';
    const id = `forecast-candidate-${region?.id || 'unknown'}-${site?.id || 'region'}-${recordDate(validRecords[0]) || 'latest'}`;
    return {
        id,
        source: '预报候选',
        type: 'forecast_candidate',
        warningCode: `${scope}预报候选 · ${siteName || regionName}`,
        regionId: String(region?.id || ''),
        regionName,
        siteId: site?.id ? String(site.id) : '',
        siteName,
        region,
        site,
        severity: level,
        candidateLevel: level === 'CRITICAL' ? '严重' : level === 'WARNING' ? '预警' : '关注',
        status: 'CANDIDATE',
        timeRange: range,
        triggerType: trigger.map((item) => item.type).join('、') || '预报指标',
        triggerDetail: trigger,
        warningMessage: `预计在${formatDate(trigger[0]?.forecastDate || recordDate(validRecords[0]))}前后出现${level === 'CRITICAL' ? '严重' : level === 'WARNING' ? '较明显' : '需要关注的'}风浪流条件。`,
        bulletinText: buildBulletin({ scope, regionName, siteName, records: validRecords, summary, level, baseDate, stale }),
        forecastData: { series: validRecords },
        sourceBase: baseDate || '--',
        validUntil: recordDate(validRecords.at(-1)) || '--',
        stale,
        createdAt: new Date().toISOString()
    };
};

const hourlyTriggerDetails = (records, level) => {
    const thresholds = level === 'CRITICAL' ? CRITICAL : level === 'WARNING' ? WARNING : ATTENTION;
    const summary = summarize(records);
    return Object.keys(ATTENTION).flatMap((key) => {
        const value = summary[key];
        if (value === null || value < thresholds[key]) return [];
        const matching = records.filter((record) => (metrics(record)[key] ?? -Infinity) >= thresholds[key]);
        const first = matching[0] || records.find((record) => metrics(record)[key] === value);
        return [{
            type: labelOf(key),
            value: formatNumber(value),
            unit: unitOf(key),
            threshold: formatNumber(thresholds[key]),
            forecastDate: recordDateTime(first),
            granularity: '逐小时'
        }];
    });
};

const buildHourlyBulletin = ({ candidate, hourlyRecords, analysis, triggers }) => {
    const { regionName, siteName, candidateLevel, sourceBase, stale, forecastData } = candidate;
    const scope = siteName ? `${regionName}的${siteName}` : regionName;
    const dailyRecords = forecastData?.dailySeries || [];
    const dates = notableDates(dailyRecords);
    const riskText = analysis.firstRiskAt
        ? `预计在${formatDateTime(analysis.firstRiskAt)}，${scope}首次达到${analysis.firstRiskLabel || '候选预警阈值'}。`
        : `当前${scope}已达到${candidateLevel}候选条件。`;
    const peakText = analysis.peakAt
        ? `预计${formatDateTime(analysis.peakAt)}附近风险指标达到峰值，其中${analysis.peakType}约为${analysis.peakValue}${analysis.peakUnit}。`
        : '逐小时数据中暂未识别出明确峰值时刻。';
    const endText = analysis.endAt ? `预计风险窗口持续至${formatDateTime(analysis.endAt)}${analysis.durationHours ? `，约${analysis.durationHours}小时` : ''}。` : '风险结束时间需以后续预报更新进一步确认。';
    const hourlyLines = hourlyRecords.slice(0, 24).map((record) => {
        const value = metrics(record);
        return `${formatDateTime(recordDateTime(record))}：风速${formatNumber(value.wind)}米/秒，阵风${formatNumber(value.gust)}米/秒，浪高${formatNumber(value.wave)}米，流速${formatNumber(value.current)}米/秒`;
    });
    const lines = [
        `${siteName ? '小矿区' : '区域'}预警候选分析`,
        `预报对象：${scope}`,
        `空间范围：${siteName ? '小矿区' : '大区域'}级`,
        `数据基准：${sourceBase || '未知'}${stale ? '（当前数据基准早于系统日期，请先核对数据时效）' : ''}`,
        `数据依据：逐小时预报，共${hourlyRecords.length}条${dailyRecords.length ? `；另含${dailyRecords.length}条逐日预报` : ''}`,
        `候选等级：${candidateLevel}`,
        '',
        '一、预报结论',
        riskText,
        peakText,
        endText,
        '',
        '二、触发指标',
        ...(triggers.length ? triggers.map((trigger) => `${trigger.type}最高约${trigger.value}${trigger.unit}，首次达到阈值时间：${formatDateTime(trigger.forecastDate)}，阈值${trigger.threshold}${trigger.unit}。`) : ['暂未提取到结构化触发指标。']),
        '',
        '三、未来重点时段',
        dates.length ? dates.map((item) => `${formatDate(item.date)}：${item.reasons.join('、')}`).join('；') : '逐日预报中暂未识别出明显快速变化时段。',
        '',
        '四、逐小时数据（前24条）',
        ...(hourlyLines.length ? hourlyLines : ['当前后端未返回逐小时明细。']),
        '',
        '五、作业建议',
        candidate.severity === 'CRITICAL' ? '建议暂停高风险海上作业，启动值守和避险预案。' : candidate.severity === 'WARNING' ? '建议加强现场值守，谨慎安排敏感作业，并持续跟踪后续预报。' : '建议关注后续预报更新，按常规值守要求安排作业。',
        '',
        '说明：本记录由前端依据当前后端区域/小矿区预报数据计算得出，仅用于风险筛查，不等同于后端正式发布的气象预警。'
    ];
    return lines.join('\n');
};

const enrichCandidateWithHourly = (candidate, hourlyRecords = []) => {
    const records = hourlyRecords.filter(Boolean).sort((a, b) => recordDateTime(a).localeCompare(recordDateTime(b)));
    if (!records.length) return candidate;
    const thresholds = candidate.severity === 'CRITICAL' ? CRITICAL : candidate.severity === 'WARNING' ? WARNING : ATTENTION;
    const riskRecords = records.filter((record) => Object.keys(thresholds).some((key) => (metrics(record)[key] ?? -Infinity) >= thresholds[key]));
    if (!riskRecords.length) return candidate;
    const firstRisk = riskRecords[0];
    const lastRisk = riskRecords.at(-1);
    let peak = null;
    records.forEach((record) => {
        Object.keys(thresholds).forEach((key) => {
            const value = metrics(record)[key];
            if (value === null || value < thresholds[key]) return;
            const ratio = value / thresholds[key];
            if (!peak || ratio > peak.ratio) peak = { key, value, ratio, record };
        });
    });
    const firstRiskAt = recordDateTime(firstRisk);
    const endAt = recordDateTime(lastRisk);
    const startTime = parseForecastTime(firstRiskAt);
    const endTime = parseForecastTime(endAt);
    const durationHours = startTime && endTime ? Math.max(1, Math.round((endTime - startTime) / 3600000) + 1) : null;
    const firstRiskKeys = Object.keys(thresholds).filter((key) => (metrics(firstRisk)[key] ?? -Infinity) >= thresholds[key]);
    const analysis = {
        firstRiskAt,
        firstRiskLabel: firstRiskKeys.map(labelOf).join('、'),
        peakAt: peak ? recordDateTime(peak.record) : '',
        peakType: peak ? labelOf(peak.key) : '',
        peakValue: peak ? formatNumber(peak.value) : '--',
        peakUnit: peak ? unitOf(peak.key) : '',
        endAt,
        durationHours,
        dataGranularity: '逐小时',
        hourlyCount: records.length,
        inferred: true
    };
    const triggers = hourlyTriggerDetails(records, candidate.severity);
    const updated = {
        ...candidate,
        timeRange: '12h',
        triggerDetail: triggers.length ? triggers : candidate.triggerDetail,
        triggerType: (triggers.length ? triggers : candidate.triggerDetail).map((item) => item.type).join('、') || candidate.triggerType,
        warningMessage: `预计在${formatDateTime(firstRiskAt)}，${candidate.siteName ? `${candidate.regionName}的${candidate.siteName}` : candidate.regionName}首次达到${analysis.firstRiskLabel || '候选预警'}条件；预计${analysis.peakType || '风险指标'}在${formatDateTime(analysis.peakAt)}附近达到峰值。`,
        analysis,
        forecastData: { ...(candidate.forecastData || {}), series: records, hourlySeries: records, dailySeries: candidate.forecastData?.series || [] },
        validUntil: dateOnly(endAt) || candidate.validUntil,
        sourceGranularity: '逐小时'
    };
    return { ...updated, bulletinText: buildHourlyBulletin({ candidate: updated, hourlyRecords: records, analysis, triggers }) };
};

const mapLimit = async (items, limit, worker) => {
    const results = [];
    let cursor = 0;
    const run = async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await worker(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
};

const loadRegion = async (region) => {
    const [dailyResult, sitesResult] = await Promise.allSettled([
        fetchMiningOverviewRegionDaily(region.id),
        fetchMiningOverviewSites(region.id)
    ]);
    const daily = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
    const sites = sitesResult.status === 'fulfilled' ? sitesResult.value : [];
    const siteItems = await mapLimit(sites, 6, async (site) => {
        try {
            const siteDaily = await fetchMiningOverviewSiteDaily(site.id);
            const candidate = buildCandidate({ region, site, records: siteDaily });
            if (!candidate) return null;
            const forecastDate = candidate.triggerDetail[0]?.forecastDate || recordDate(siteDaily[0]);
            if (!forecastDate) return candidate;
            try {
                const hourly = await fetchMiningOverviewSiteHourly(site.id, forecastDate);
                return enrichCandidateWithHourly(candidate, hourly);
            } catch (error) {
                return candidate;
            }
        } catch (error) {
            return null;
        }
    });
    const siteCandidates = siteItems.filter(Boolean);
    const regionCandidate = buildCandidate({ region, records: daily });
    let enrichedRegionCandidate = regionCandidate;
    if (regionCandidate) {
        const forecastDate = regionCandidate.triggerDetail[0]?.forecastDate || recordDate(daily[0]);
        if (forecastDate) {
            try {
                const hourly = await fetchMiningOverviewRegionHourly(region.id, forecastDate);
                enrichedRegionCandidate = enrichCandidateWithHourly(regionCandidate, hourly);
            } catch (error) {
                enrichedRegionCandidate = regionCandidate;
            }
        }
    }
    return {
        region,
        candidates: [...siteCandidates, ...(enrichedRegionCandidate && (enrichedRegionCandidate.severity === 'CRITICAL' || !siteCandidates.length) ? [enrichedRegionCandidate] : [])],
        sourceBase: baseDateOf(daily)
    };
};

export const fetchWarningCandidates = async ({ force = false } = {}) => {
    if (!force && cache.value && cache.expiresAt > Date.now()) return cache.value;
    const regions = await fetchMiningOverviewRegions();
    const loaded = await mapLimit(regions, 3, loadRegion);
    const candidates = loaded.flatMap((item) => item.candidates || []);
    const value = {
        items: candidates.sort((a, b) => {
            const levelOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
            return (levelOrder[a.severity] ?? 9) - (levelOrder[b.severity] ?? 9) || a.warningCode.localeCompare(b.warningCode);
        }),
        generatedAt: new Date().toISOString(),
        regions: regions.length,
        staleCount: candidates.filter((item) => item.stale).length
    };
    cache = { value, expiresAt: Date.now() + CACHE_TTL };
    return value;
};

export const clearWarningCandidateCache = () => {
    cache = { expiresAt: 0, value: null };
};
