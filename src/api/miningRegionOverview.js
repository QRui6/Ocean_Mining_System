import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

const normalizeResponseData = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result && typeof result === 'object' && result.success === false) {
        throw new Error(result.error || '矿区总览接口返回失败');
    }

    return result?.data ?? result;
};

const requestJson = async (url) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    return normalizeResponseData(response);
};

const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeBoundaryPolygon = (boundaryPolygon) => {
    if (!boundaryPolygon) {
        return [];
    }

    let polygon = boundaryPolygon;

    if (typeof polygon === 'string') {
        try {
            polygon = JSON.parse(polygon);
        } catch (error) {
            console.warn('⚠️ boundaryPolygon JSON 解析失败:', error);
            return [];
        }
    }

    if (polygon?.type === 'Polygon' && Array.isArray(polygon.coordinates)) {
        polygon = polygon.coordinates[0];
    } else if (polygon?.type === 'MultiPolygon' && Array.isArray(polygon.coordinates)) {
        polygon = polygon.coordinates[0]?.[0] || [];
    } else if (polygon?.coordinates && Array.isArray(polygon.coordinates)) {
        polygon = polygon.coordinates[0] || [];
    }

    if (Array.isArray(polygon) && Array.isArray(polygon[0]) && Array.isArray(polygon[0][0])) {
        polygon = polygon[0];
    }

    if (!Array.isArray(polygon)) {
        return [];
    }

    return polygon
        .map((point) => {
            if (!Array.isArray(point) || point.length < 2) {
                return null;
            }

            const lng = parseNumber(point[0]);
            const lat = parseNumber(point[1]);

            if (lng === null || lat === null) {
                return null;
            }

            return [lng, lat];
        })
        .filter(Boolean);
};

const sortByForecastDate = (records = []) => (
    [...records].sort((first, second) => {
        const firstTime = new Date(first.forecastDate || first.baseDate || 0).getTime();
        const secondTime = new Date(second.forecastDate || second.baseDate || 0).getTime();
        return firstTime - secondTime;
    })
);

const sortByForecastTime = (records = []) => (
    [...records].sort((first, second) => {
        const firstValue = `${first.forecastDate || ''} ${first.forecastTime || ''} ${String(first.forecastHour ?? '').padStart(4, '0')}`;
        const secondValue = `${second.forecastDate || ''} ${second.forecastTime || ''} ${String(second.forecastHour ?? '').padStart(4, '0')}`;
        return firstValue.localeCompare(secondValue);
    })
);

export async function fetchMiningOverviewRegions() {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.REGIONS);

    return (Array.isArray(data) ? data : []).map((region) => ({
        ...region,
        id: String(region.id ?? ''),
        centerLng: parseNumber(region.centerLng),
        centerLat: parseNumber(region.centerLat),
        siteCount: Number(region.siteCount ?? 0),
        boundaryPolygon: normalizeBoundaryPolygon(region.boundaryPolygon)
    }));
}

export async function fetchMiningOverviewRegionDaily(regionId) {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.REGION_DAILY(regionId));
    return sortByForecastDate(Array.isArray(data) ? data : []);
}

export async function fetchMiningOverviewRegionHourly(regionId, forecastDate) {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.REGION_HOURLY(regionId, forecastDate));
    return sortByForecastTime(Array.isArray(data) ? data : []);
}

export async function fetchMiningOverviewSites(regionId) {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.SITES(regionId));

    return (Array.isArray(data) ? data : []).map((site) => ({
        ...site,
        id: String(site.id ?? ''),
        regionId: String(site.regionId ?? ''),
        lng: parseNumber(site.lng),
        lat: parseNumber(site.lat)
    }));
}

export async function fetchMiningOverviewSiteDaily(siteId) {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.SITE_DAILY(siteId));
    return sortByForecastDate(Array.isArray(data) ? data : []);
}

export async function fetchMiningOverviewSiteHourly(siteId, forecastDate) {
    const data = await requestJson(API_ENDPOINTS.MINING_OVERVIEW.SITE_HOURLY(siteId, forecastDate));
    return sortByForecastTime(Array.isArray(data) ? data : []);
}
