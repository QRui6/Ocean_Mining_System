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

const isExpired = (item, now) => {
    const validUntil = endOfDate(item?.validUntil);
    return Boolean(validUntil && validUntil.getTime() < now.getTime());
};

const sourceReady = (item, availability) => {
    if (item?.source === '正式预警') return availability.formal !== false;
    if (item?.source === '预报候选') return availability.candidate !== false;
    if (item?.source === '浮标监测') return availability.buoy !== false;
    if (item?.source === '管道评估') return availability.pipeline !== false;
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

export const getWarningLifecycleState = () => ({
    active: readJson(ACTIVE_KEY, {}),
    history: readJson(HISTORY_KEY, [])
});

export const reconcileWarningLifecycle = (items = [], availability = {}, { now = new Date(), initializeSilently = false } = {}) => {
    const previousState = getWarningLifecycleState();
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
        if (expired) {
            const event = { type: 'expired', id, item, previous, text: eventText('expired', item, previous), at: now.toISOString() };
            appendHistory(item, event);
            if (previous && !initializeSilently) events.push(event);
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
        const item = previous;
        const event = { type: 'resolved', id, item, previous: item, text: eventText('resolved', item), at: now.toISOString() };
        appendHistory(item, event);
        if (!initializeSilently) events.push(event);
    });

    const trimmedHistory = nextHistory.sort((a, b) => new Date(b.resolvedAt || b.createdAt || 0) - new Date(a.resolvedAt || a.createdAt || 0)).slice(0, MAX_HISTORY);
    writeJson(ACTIVE_KEY, nextActive);
    writeJson(HISTORY_KEY, trimmedHistory);
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
