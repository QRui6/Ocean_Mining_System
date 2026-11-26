import {warningExportText} from '../forecastReportText.js';
const ACTIVE_KEY = 'OCEAN_WARNING_ACTIVE_V1';
const HISTORY_KEY = 'OCEAN_WARNING_HISTORY_V1';
const MAX_HISTORY = 500;

const readJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        const value = raw ? JSON.parse(raw) : fallback;
        return value ?? fallback;
    } catch (error) {
        console.warn(`读取预警生命周期数据失败：${key}`, error);
        return fallback;
    }
};

const writeJson = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`保存预警生命周期数据失败：${key}`, error);
    }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

// Store event identity and evidence locally. Large time series remain available from the API.
const compactItem = (item = {}) => {
    const {forecastData, bulletinText, region, site, versions, detail, ...rest} = item;
    const coordinates = location => location && Object.fromEntries(
        ['id','siteId','regionId','lng','lat','centerLng','centerLat','regionName','siteName'].filter(key=>location[key]!=null).map(key=>[key,location[key]])
    );
    return {...rest, region:coordinates(region), site:coordinates(site),
        bulletinText:item.type==='forecast_candidate'?(forecastData ? warningExportText(item) : bulletinText):bulletinText};
};

const numeric = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const fingerprint = (item = {}) => JSON.stringify({
    severity: item.severity || '',
    status: item.status || '',
    warningMessage: item.warningMessage || '',
    sourceBase: item.sourceBase || '',
    validUntil: item.validUntil || '',
    triggerDetail: (item.triggerDetail || []).map((trigger) => ({ type: trigger.type, value: trigger.value, threshold: trigger.threshold, forecastDate: trigger.forecastDate }))
});

const endOfDate = (value) => {
    const match = String(value || '').match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
    return Number.isNaN(date.getTime()) ? null : date;
};

const expiryTimeOf = (item) => {
    const exactValue = item?.analysis?.endAt || item?.validUntil || item?.endAt;
    const raw = String(exactValue || '').trim();
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}[T\s]\d{1,2}:\d{2}/.test(raw)) {
        const exact = new Date(raw.replace(/\//g, '-').replace(' ', 'T'));
        if (!Number.isNaN(exact.getTime())) return exact;
    }
    return endOfDate(raw);
};

const isExpired = (item, now) => {
    if (item?.demo) return false;
    const validUntil = expiryTimeOf(item);
    return Boolean(validUntil && validUntil.getTime() < now.getTime());
};

const sourceReady = (item, availability) => {
    if (item?.source === '正式预警') return availability.formal !== false;
    if (item?.source === '预报候选') return availability.candidate !== false;
    if (item?.source === '浮标监测') return availability.buoy !== false;
    if (item?.source === '管道评估') return availability.pipeline !== false;
    if (item?.sourceType === 'grid') return availability.grid !== false;
    return true;
};

const activeStatus = (item) => ['ACTIVE', 'CANDIDATE', 'UPDATED'].includes(String(item?.status || '').toUpperCase());

const eventText = (type, item, previous) => {
    const name = item?.warningCode || previous?.warningCode || '未命名预警';
    if (type === 'created') return `发现${name}，当前等级为${item?.candidateLevel || ({ INFO: '关注', WARNING: '预警', CRITICAL: '严重' }[item?.severity] || '待定')}。`;
    if (type === 'updated') return `${name}的预报条件或等级发生变化，请查看最新分析。`;
    if (type === 'expired') return `${name}已超过预报有效时段，系统自动解除。`;
    return `${name}已解除，最新数据已不再满足原预警条件。`;
};

export const getWarningLifecycleState = (scope = '') => ({
    active: readJson(ACTIVE_KEY + scope, {}),
    history: readJson(HISTORY_KEY + scope, [])
});

export const reconcileWarningLifecycle = (items = [], availability = {}, { now = new Date(), initializeSilently = false, scope = '' } = {}) => {
    const previousState = getWarningLifecycleState(scope);
    const previousActive = previousState.active && typeof previousState.active === 'object' ? previousState.active : {};
    const history = Array.isArray(previousState.history) ? previousState.history : [];
    const currentById = new Map(items.filter((item) => item?.id).map((item) => [String(item.id), item]));
    const events = [];
    const nextActive = {};
    const nextHistory = [...history];

    const appendHistory = (item, event) => {
        const id = String(item.id);
        const existing = nextHistory.find((record) => record.id === id);
        if (!existing) {
            nextHistory.push({
                id,
                createdAt: item.createdAt || now.toISOString(),
                status: event.type === 'resolved' || event.type === 'expired' ? 'RESOLVED' : 'ACTIVE',
                resolvedAt: event.type === 'resolved' || event.type === 'expired' ? now.toISOString() : '',
                resolveReason: event.type === 'expired' ? '预报有效时段已结束' : '',
                snapshot: clone(item),
                versions: [{ at: now.toISOString(), type: event.type, snapshot: clone(item), text: event.text }]
            });
            return;
        }
        existing.snapshot = clone(item);
        existing.status = event.type === 'resolved' || event.type === 'expired' ? 'RESOLVED' : 'ACTIVE';
        if (event.type === 'resolved' || event.type === 'expired') {
            existing.resolvedAt = now.toISOString();
            existing.resolveReason = event.type === 'expired' ? '预报有效时段已结束' : '最新预报已不再满足原预警条件';
        } else {
            existing.resolvedAt = '';
            existing.resolveReason = '';
        }
        existing.versions = Array.isArray(existing.versions) ? existing.versions : [];
        existing.versions.push({ at: now.toISOString(), type: event.type, snapshot: clone(item), text: event.text });
        if (existing.versions.length > 30) existing.versions = existing.versions.slice(-30);
    };

    currentById.forEach((item, id) => {
        const previous = previousActive[id];
        const expired = isExpired(item, now);
        if (String(item.status).toUpperCase() === 'RESOLVED') {
            if (!previous && nextHistory.some(r=>r.id===id && r.status==='RESOLVED' && fingerprint(r.snapshot)===fingerprint(item))) return;
            const event = { type: 'resolved', id, item, previous, text: eventText('resolved', item, previous), at: now.toISOString() };
            appendHistory(item, event);
            if (previous && !initializeSilently) events.push(event);
            return;
        }
        if (expired || item.stale) {
            nextActive[id] = { ...clone(item), stale: true, fingerprint: fingerprint(item), firstSeenAt: previous?.firstSeenAt || now.toISOString(), lastUpdatedAt: previous?.lastUpdatedAt || now.toISOString() };
            return;
        }

        let event = null;
        if (!previous) {
            event = { type: 'created', id, item, text: eventText('created', item), at: now.toISOString() };
        } else if (previous.fingerprint !== fingerprint(item)) {
            event = { type: 'updated', id, item, previous, text: eventText('updated', item, previous), at: now.toISOString() };
        }

        const snapshot = { ...clone(item), fingerprint: fingerprint(item), firstSeenAt: previous?.firstSeenAt || now.toISOString(), lastUpdatedAt: event ? now.toISOString() : previous?.lastUpdatedAt || now.toISOString() };
        nextActive[id] = snapshot;
        if (event) {
            appendHistory(item, event);
            if (!initializeSilently) events.push(event);
        } else if (!previous) {
            appendHistory(item, { type: 'created', text: eventText('created', item) });
        }
    });

    Object.entries(previousActive).forEach(([id, previous]) => {
        if (currentById.has(id)) return;
        if (!sourceReady(previous, availability)) {
            nextActive[id] = previous;
            return;
        }
        // Absence from a paginated or incomplete response does not prove recovery.
        nextActive[id] = { ...previous, stale: true };
    });

    const trimmedHistory = nextHistory.sort((a, b) => new Date(b.resolvedAt || b.createdAt || 0) - new Date(a.resolvedAt || a.createdAt || 0)).slice(0, MAX_HISTORY);
    writeJson(ACTIVE_KEY + scope, Object.fromEntries(Object.entries(nextActive).map(([id,item])=>[id,compactItem(item)])));
    writeJson(HISTORY_KEY + scope, trimmedHistory.map(record=>({...record,snapshot:compactItem(record.snapshot),versions:(record.versions||[]).map(v=>({...v,snapshot:compactItem(v.snapshot)}))})));
    const historyById = new Map(trimmedHistory.map((record) => [record.id, record]));
    const activeItems = Object.values(nextActive).map((item) => ({ ...item, versions: historyById.get(String(item.id))?.versions || [] }));
    return { activeItems, history: trimmedHistory, events };
};

export const clearWarningLifecycleHistory = () => {
    try {
        localStorage.removeItem(ACTIVE_KEY);
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.warn('清理预警历史失败', error);
    }
};

export const countWarningHistory = () => readJson(HISTORY_KEY, []).length;
