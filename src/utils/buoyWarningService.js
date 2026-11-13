import { fetchBuoyRealtime, fetchBuoys } from '../api/forecastWarningBuoy.js';

const thresholds = {
    windSpeed: { attention: 12, warning: 15, critical: 20, unit: 'm/s', name: '风速' },
    waveHeight: { attention: 2.5, warning: 3.5, critical: 4.5, unit: 'm', name: '浪高' },
    currentSpeed: { attention: 1, warning: 1.5, critical: 2, unit: 'm/s', name: '流速' }
};

const levelOrder = { INFO: 1, WARNING: 2, CRITICAL: 3 };
const levelText = { INFO: '关注', WARNING: '预警', CRITICAL: '严重' };

const numberOf = (row, fields) => {
    for (const field of fields) {
        const value = Number(row?.[field]);
        if (Number.isFinite(value)) return value;
    }
    return null;
};

const metricValues = (row) => ({
    windSpeed: numberOf(row, ['windSpeed', 'wind_speed', 'wind', 'windSpeedAvg']),
    waveHeight: numberOf(row, ['waveHeight', 'wave_height', 'wave', 'waveHeightAvg']),
    currentSpeed: numberOf(row, ['currentSpeed', 'current_speed', 'current', 'currentSpeedAvg'])
});

const metricLevel = (key, value) => {
    const threshold = thresholds[key];
    if (!threshold || !Number.isFinite(value)) return '';
    if (value >= threshold.critical) return 'CRITICAL';
    if (value >= threshold.warning) return 'WARNING';
    if (value >= threshold.attention) return 'INFO';
    return '';
};

const formatNumber = (value) => Number.isFinite(value) ? value.toFixed(1) : '--';
const formatTime = (value) => {
    const date = new Date(value || '');
    return Number.isNaN(date.getTime()) ? '未知时间' : date.toLocaleString('zh-CN', { hour12: false });
};
const formatLocation = (row) => {
    const lat = Number(row?.lat ?? row?.latitude);
    const lng = Number(row?.lng ?? row?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '位置坐标未提供';
    return `纬度${lat.toFixed(2)}°，经度${lng.toFixed(2)}°`;
};
const adviceOf = (level) => level === 'CRITICAL'
    ? '建议立即暂停高风险海上作业，核查浮标状态并启动现场避险和值守措施。'
    : level === 'WARNING'
        ? '建议加强现场值守，谨慎安排敏感作业，并持续关注浮标后续更新。'
        : '建议关注实时读数变化，按常规值守要求安排作业。';

const buildWarning = (buoy, live) => {
    const row = { ...buoy, ...live };
    const observedAt = row.timestamp || row.observedAt || row.time || '';
    if (!observedAt) return null;
    const values = metricValues(row);
    const triggerDetail = Object.entries(thresholds).flatMap(([key, threshold]) => {
        const value = values[key];
        const severity = metricLevel(key, value);
        if (!severity) return [];
        const selectedThreshold = threshold[severity === 'CRITICAL' ? 'critical' : severity === 'WARNING' ? 'warning' : 'attention'];
        return [{ type: threshold.name, value: formatNumber(value), unit: threshold.unit, threshold: formatNumber(selectedThreshold), forecastDate: observedAt, source: '浮标实时监测' }];
    });
    if (!triggerDetail.length) return null;
    const severity = triggerDetail.reduce((highest, item) => {
        const key = Object.entries(thresholds).find(([, threshold]) => threshold.name === item.type)?.[0];
        return levelOrder[metricLevel(key, values[key])] > levelOrder[highest] ? metricLevel(key, values[key]) : highest;
    }, 'INFO');
    const buoyId = String(row.buoyId ?? row.id ?? '');
    if (!buoyId) return null;
    const buoyName = row.name || row.buoyName || row.displayName || buoyId;
    const regionName = row.regionName || row.areaName || row.region || '浮标监测区域';
    const scope = `${regionName}的${buoyName}`;
    const valueText = [`风速${formatNumber(values.windSpeed)}米/秒`, `浪高${formatNumber(values.waveHeight)}米`, `流速${formatNumber(values.currentSpeed)}米/秒`].join('，');
    const triggerText = triggerDetail.map((item) => `${item.type}${item.value}${item.unit}`).join('、');
    const levelLabel = levelText[severity];
    return {
        id: `buoy-live-${buoyId}`,
        source: '浮标监测',
        sourceType: 'buoy',
        type: 'buoy_realtime_warning',
        warningCode: `浮标实时风险 · ${buoyName}`,
        buoyId,
        buoy: row,
        regionName,
        siteName: buoyName,
        severity,
        candidateLevel: levelLabel,
        status: 'ACTIVE',
        timeRange: 'realtime',
        triggerType: triggerDetail.map((item) => item.type).join('、'),
        triggerDetail,
        warningMessage: `浮标“${buoyName}”于${formatTime(observedAt)}监测到${triggerText}，当前判定为${levelLabel}风险。`,
        bulletinText: [
            '浮标实时风险分析',
            `监测对象：${scope}`,
            `位置：${formatLocation(row)}`,
            `数据时间：${formatTime(observedAt)}`,
            `风险等级：${levelLabel}`,
            '',
            '一、实时结论',
            `浮标当前监测到${triggerText}达到前端设定的${levelLabel}风险阈值。`,
            `当前风浪流读数：${valueText}。`,
            '',
            '二、超阈值指标',
            ...triggerDetail.map((item) => `${item.type}：${item.value}${item.unit}，判定阈值${item.threshold}${item.unit}。`),
            '',
            '三、处置建议',
            adviceOf(severity),
            '',
            '说明：本记录由前端依据浮标实时接口返回值和环境监测模块当前阈值计算生成，不等同于后端正式气象预警。'
        ].join('\n'),
        forecastData: { series: [{ forecastTime: observedAt, timestamp: observedAt, windSpeed: values.windSpeed, waveHeight: values.waveHeight, currentSpeed: values.currentSpeed }] },
        sourceBase: '实时浮标接口',
        observedAt,
        validUntil: '--',
        stale: false,
        createdAt: observedAt
    };
};

export const fetchBuoyWarnings = async () => {
    const [buoyList, liveList] = await Promise.all([fetchBuoys(), fetchBuoyRealtime()]);
    const buoys = Array.isArray(buoyList) ? buoyList : [];
    const live = Array.isArray(liveList) ? liveList : [];
    const buoyById = new Map(buoys.map((item) => [String(item.id ?? item.buoyId), item]));
    return live.map((item) => buildWarning(buoyById.get(String(item.buoyId ?? item.id)) || {}, item)).filter(Boolean);
};
