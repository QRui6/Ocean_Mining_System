const metrics = {
    wind: { label: '风速', field: 'windSpeedMax' },
    wave: { label: '浪高', field: 'waveHeightMax' },
    ocean_current: { label: '流速', field: 'currentSpeedMax' }
};
const timeText = value => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—';

export function miningRiskWarning(event, now = Date.now()) {
    const snapshot = event.snapshot;
    const label = metrics[event.metric].label;
    const value = snapshot.value?.toFixed(2);
    const unit = snapshot.rule.unit;
    const active = event.status === 'ACTIVE';
    const stale = active && (!snapshot.end || Date.parse(snapshot.end) < now
        || Date.parse(snapshot.initialTime) + 48 * 3600_000 < now);
    const name = event.area_name;
    const point = snapshot.point ? { lng: snapshot.point.lon, lat: snapshot.point.lat } : null;
    const lines = [
        '矿区作业预警',
        `预报：${name}；经度：${point?.lng?.toFixed(4) ?? '未提供'}；纬度：${point?.lat?.toFixed(4) ?? '未提供'}`,
        `初始时间：${timeText(snapshot.initialTime)}`,
        `状态：${active ? (stale ? '已过期' : '生效') : '解除'}`,
        `${label}阈值：${snapshot.rule.warning} ${unit}`
    ];
    if (value != null) lines.push(`${label}峰值：${value} ${unit}`, `时段：${timeText(snapshot.start)} 至 ${timeText(snapshot.end)}`);
    return {
        id: `grid-${event.id}`, eventId: event.id, areaId: event.area_id, regionName: name,
        region: { id: event.area_id, regionName: name, ...point }, point,
        metric: event.metric, pointIndex: snapshot.pointIndex, runId: snapshot.runId,
        source: '矿区评估', sourceType: 'grid', timeRange: 'grid', severity: event.severity, status: event.status,
        warningCode: `${label}预警 · ${name}`, triggerType: label,
        sourceBase: snapshot.initialTime, validFrom: snapshot.start, validUntil: snapshot.end,
        warningMessage: active ? `${name}预计${label}达到 ${value} ${unit}。` : `${name}的${label}预警已解除。`,
        createdAt: event.created_at, resolvedAt: event.resolved_at, stale,
        triggerDetail: value == null ? [] : [{ type: label, value, unit, threshold: snapshot.rule.warning, forecastDate: snapshot.start }],
        bulletinText: lines.join('\n')
    };
}

export async function fetchMiningRiskWarnings() {
    const { monitoringRequest } = await import('../../api/monitoring.js');
    const rows = await monitoringRequest('/api/mining-risk/events');
    return rows.map(event => miningRiskWarning(event));
}

export async function fetchMiningRiskTrend(item) {
    if (!item.runId || item.pointIndex == null || item.pointIndex < 0) return [];
    const { monitoringRequest } = await import('../../api/monitoring.js');
    const run = await monitoringRequest(`/api/mining-risk/runs/${encodeURIComponent(item.runId)}`);
    const field = metrics[item.metric].field;
    return (run.result?.datasets?.[item.metric]?.frames || []).map(frame => ({
        forecastTime: frame.time,
        [field]: frame.values[item.pointIndex]
    }));
}
export async function fetchMiningRiskVersions(id) {
    const { monitoringRequest } = await import('../../api/monitoring.js');
    const versions = await monitoringRequest(`/api/mining-risk/events/${id}/versions`);
    return versions.map(version => ({
        at: version.created_at,
        type: { CREATED: 'created', UPDATED: 'updated', ACKNOWLEDGED: 'acknowledged', RESOLVED: 'resolved' }[version.action]
    }));
}
