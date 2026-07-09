import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

const normalizeResponseData = async (response, fallbackMessage) => {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result && typeof result === 'object' && result.success === false) {
        throw new Error(result.error || fallbackMessage);
    }

    return result?.data ?? result;
};

const requestJson = async (url, fallbackMessage) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    return normalizeResponseData(response, fallbackMessage);
};

const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeTrackPoint = (point = {}) => ({
    ...point,
    lat: parseNumber(point.lat),
    lon: parseNumber(point.lon),
    wmoWind: parseNumber(point.wmoWind),
    wmoPres: parseNumber(point.wmoPres),
    distanceToAreaKm: parseNumber(point.distanceToAreaKm),
    inBuffer: Boolean(point.inBuffer)
});

const normalizeEventItem = (item = {}) => ({
    ...item,
    minDistanceKm: parseNumber(item.minDistanceKm),
    influenceDurationHours: parseNumber(item.influenceDurationHours),
    maxWindNearArea: parseNumber(item.maxWindNearArea),
    minPresNearArea: parseNumber(item.minPresNearArea)
});

const normalizeSummaryData = (data = {}) => ({
    ...data,
    bufferKm: parseNumber(data.bufferKm),
    summary: {
        totalAffectedTyphoons: Number(data.summary?.totalAffectedTyphoons ?? 0),
        recent10yCount: Number(data.summary?.recent10yCount ?? 0),
        annualAverageCount: parseNumber(data.summary?.annualAverageCount),
        historicalMinDistanceKm: parseNumber(data.summary?.historicalMinDistanceKm),
        historicalMaxWind: parseNumber(data.summary?.historicalMaxWind),
        historicalMinPressure: parseNumber(data.summary?.historicalMinPressure)
    },
    strongestTyphoon: data.strongestTyphoon
        ? normalizeEventItem(data.strongestTyphoon)
        : null,
    nearestTyphoon: data.nearestTyphoon
        ? normalizeEventItem(data.nearestTyphoon)
        : null
});

const normalizeEventPage = (data = {}, params = {}) => ({
    ...data,
    bufferKm: parseNumber(data?.bufferKm),
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? params.page ?? 1),
    pageSize: Number(data?.pageSize ?? params.pageSize ?? 20),
    items: Array.isArray(data?.items) ? data.items.map(normalizeEventItem) : []
});

const fetchAllEventPages = async (fetchPage, params = {}) => {
    const pageSize = 200;
    const items = [];
    let page = 1;
    let total = 0;

    do {
        const result = await fetchPage({
            ...params,
            page,
            pageSize
        });

        items.push(...result.items);
        total = result.total;

        if (!result.items.length) {
            break;
        }

        page += 1;
    } while (items.length < total);

    return items;
};

export async function fetchMiningAreaTyphoonSummary(areaId, params = {}) {
    const data = await requestJson(
        API_ENDPOINTS.MINING_AREAS.TYPHOON_SUMMARY(areaId, params),
        '历史台风总览接口返回失败'
    );

    return normalizeSummaryData(data || {});
}

export async function fetchMiningAreaTyphoonEvents(areaId, params = {}) {
    const data = await requestJson(
        API_ENDPOINTS.MINING_AREAS.TYPHOON_EVENTS(areaId, params),
        '历史台风列表接口返回失败'
    );

    return normalizeEventPage(data, params);
}

export async function fetchMiningAreaTyphoonAllEvents(areaId, params = {}) {
    return fetchAllEventPages(
        (pageParams) => fetchMiningAreaTyphoonEvents(areaId, pageParams),
        params
    );
}

export async function fetchMiningRegionTyphoonEvents(regionId, params = {}) {
    const data = await requestJson(
        API_ENDPOINTS.MINING_REGIONS.TYPHOON_EVENTS(regionId, params),
        '区域历史台风列表接口返回失败'
    );

    return normalizeEventPage(data, params);
}

export async function fetchMiningRegionTyphoonAllEvents(regionId, params = {}) {
    return fetchAllEventPages(
        (pageParams) => fetchMiningRegionTyphoonEvents(regionId, pageParams),
        params
    );
}

export async function fetchMiningAreaTyphoonYearly(areaId, params = {}) {
    const data = await requestJson(
        API_ENDPOINTS.MINING_AREAS.TYPHOON_YEARLY(areaId, params),
        '年度台风统计接口返回失败'
    );

    return (Array.isArray(data) ? data : []).map((item) => ({
        year: Number(item.year),
        count: Number(item.count ?? 0),
        maxWind: parseNumber(item.maxWind),
        minDistanceKm: parseNumber(item.minDistanceKm)
    }));
}

export async function fetchTyphoonTrack(sid, params = {}) {
    const data = await requestJson(
        API_ENDPOINTS.TYPHOONS.TRACK(sid, params),
        '台风轨迹接口返回失败'
    );

    return {
        ...data,
        maxWind: parseNumber(data?.maxWind),
        minPres: parseNumber(data?.minPres),
        bufferKm: parseNumber(data?.bufferKm),
        pointCount: Number(data?.pointCount ?? 0),
        points: Array.isArray(data?.points) ? data.points.map(normalizeTrackPoint) : []
    };
}
