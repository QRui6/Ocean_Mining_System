import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

const DATASET_KEYS = ['wind', 'wave', 'current'];

const isValidYear = (value) => {
    const year = Number(value);
    return Number.isInteger(year) && year >= 1900 && year <= 2100;
};

const normalizeYearRange = ({ startYear, endYear } = {}) => {
    if (!isValidYear(startYear) || !isValidYear(endYear)) {
        return null;
    }

    const start = Number(startYear);
    const end = Number(endYear);
    return start <= end
        ? { startYear: start, endYear: end }
        : { startYear: end, endYear: start };
};

const requestJson = async (url, fallbackMessage) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result && typeof result === 'object' && result.success === false) {
        throw new Error(result.error || fallbackMessage);
    }

    return result?.data ?? result;
};

const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const toMonthKey = (item = {}) => {
    if (item.monthLabel) {
        return String(item.monthLabel);
    }

    const year = String(item.year ?? '').trim();
    const month = Number(item.month ?? 0);
    if (year && month) {
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    if (item.monthStart) {
        return String(item.monthStart).slice(0, 7);
    }

    return '';
};

const sortByMonth = (items = []) => (
    [...items].sort((first, second) => String(first.key || toMonthKey(first)).localeCompare(
        String(second.key || toMonthKey(second))
    ))
);

const normalizeWindItem = (item = {}) => ({
    ...item,
    key: toMonthKey(item),
    year: Number(item.year ?? 0) || null,
    month: Number(item.month ?? 0) || null,
    gust: parseNumber(item.gust),
    wind: item.wind
        ? {
            u: parseNumber(item.wind.u),
            v: parseNumber(item.wind.v),
            speed: parseNumber(item.wind.speed),
            direction: parseNumber(item.wind.direction)
        }
        : null
});

const normalizeWaveItem = (item = {}) => ({
    ...item,
    key: toMonthKey(item),
    year: Number(item.year ?? 0) || null,
    month: Number(item.month ?? 0) || null,
    wave: item.wave
        ? {
            height: parseNumber(item.wave.height),
            period: parseNumber(item.wave.period),
            direction: parseNumber(item.wave.direction)
        }
        : null
});

const normalizeCurrentItem = (item = {}) => ({
    ...item,
    key: toMonthKey(item),
    year: Number(item.year ?? 0) || null,
    month: Number(item.month ?? 0) || null,
    depthMeters: parseNumber(item.depthMeters),
    current: item.current
        ? {
            u: parseNumber(item.current.u),
            v: parseNumber(item.current.v),
            speed: parseNumber(item.current.speed),
            direction: parseNumber(item.current.direction)
        }
        : null
});

const POINT_DATASETS = {
    wind: {
        endpoint: API_ENDPOINTS.HISTORICAL_WIND.POINT_QUERY,
        fallbackMessage: '历史风场接口返回失败',
        normalizeItem: normalizeWindItem
    },
    wave: {
        endpoint: API_ENDPOINTS.HISTORICAL_WAVE.POINT_QUERY,
        fallbackMessage: '历史海浪接口返回失败',
        normalizeItem: normalizeWaveItem
    },
    current: {
        endpoint: API_ENDPOINTS.HISTORICAL_CURRENT.POINT_QUERY,
        fallbackMessage: '历史洋流接口返回失败',
        normalizeItem: normalizeCurrentItem
    }
};

const normalizeMonthsItem = (item = {}) => ({
    ...item,
    key: toMonthKey(item),
    year: Number(item.year ?? 0) || null,
    month: Number(item.month ?? 0) || null,
    gustMin: parseNumber(item.gustMin),
    gustMax: parseNumber(item.gustMax),
    uMin: parseNumber(item.uMin ?? item.umin),
    uMax: parseNumber(item.uMax ?? item.umax),
    vMin: parseNumber(item.vMin ?? item.vmin),
    vMax: parseNumber(item.vMax ?? item.vmax),
    swhMin: parseNumber(item.swhMin),
    swhMax: parseNumber(item.swhMax),
    mwpMin: parseNumber(item.mwpMin),
    mwpMax: parseNumber(item.mwpMax),
    mwdMin: parseNumber(item.mwdMin),
    mwdMax: parseNumber(item.mwdMax),
    depthMeters: parseNumber(item.depthMeters)
});

const normalizePointData = (data = {}, normalizeItem) => ({
    ...data,
    total: Number(data.total ?? 0),
    startYear: Number(data.startYear ?? 0) || null,
    endYear: Number(data.endYear ?? 0) || null,
    location: data.location
        ? {
            lat: parseNumber(data.location.lat),
            lon: parseNumber(data.location.lon)
        }
        : null,
    items: Array.isArray(data.items)
        ? sortByMonth(data.items.map(normalizeItem).filter((item) => item.key))
        : []
});

const normalizeMonthsData = (data = {}) => ({
    ...data,
    total: Number(data.total ?? 0),
    startYear: Number(data.startYear ?? 0) || null,
    endYear: Number(data.endYear ?? 0) || null,
    depthMeters: parseNumber(data.depthMeters),
    grid: data.grid
        ? {
            ...data.grid,
            width: Number(data.grid.width ?? 0) || null,
            height: Number(data.grid.height ?? 0) || null,
            lonMin: parseNumber(data.grid.lonMin),
            lonMax: parseNumber(data.grid.lonMax),
            latMin: parseNumber(data.grid.latMin),
            latMax: parseNumber(data.grid.latMax)
        }
        : null,
    items: Array.isArray(data.items)
        ? sortByMonth(data.items.map(normalizeMonthsItem).filter((item) => item.key))
        : []
});

const fetchPointDataset = async (datasetKey, query) => {
    const dataset = POINT_DATASETS[datasetKey];
    const data = await requestJson(dataset.endpoint(query), dataset.fallbackMessage);
    return normalizePointData(data, dataset.normalizeItem);
};

const buildPointQuery = (params = {}) => {
    const query = {
        lat: params.lat,
        lon: params.lon
    };

    const yearRange = normalizeYearRange(params);
    return yearRange
        ? { ...query, ...yearRange }
        : query;
};

const buildRecord = (key, source = {}) => {
    const wind = source.wind || null;
    const wave = source.wave || null;
    const current = source.current || null;
    const base = wind || wave || current || {};

    return {
        key,
        monthLabel: base.monthLabel || key,
        monthStart: base.monthStart || `${key}-01`,
        year: base.year || Number(String(key).slice(0, 4)) || null,
        month: base.month || Number(String(key).slice(5, 7)) || null,
        wind,
        wave,
        current,
        windSpeed: parseNumber(wind?.wind?.speed),
        windDirection: parseNumber(wind?.wind?.direction),
        windU: parseNumber(wind?.wind?.u),
        windV: parseNumber(wind?.wind?.v),
        gust: parseNumber(wind?.gust),
        waveHeight: parseNumber(wave?.wave?.height),
        wavePeriod: parseNumber(wave?.wave?.period),
        waveDirection: parseNumber(wave?.wave?.direction),
        currentSpeed: parseNumber(current?.current?.speed),
        currentDirection: parseNumber(current?.current?.direction),
        currentU: parseNumber(current?.current?.u),
        currentV: parseNumber(current?.current?.v),
        currentDepthMeters: parseNumber(current?.depthMeters),
        hasWind: Boolean(wind?.wind),
        hasWave: Boolean(wave?.wave),
        hasCurrent: Boolean(current?.current)
    };
};

const mergePointRecords = ({ wind = [], wave = [], current = [] } = {}) => {
    const monthMap = new Map();

    DATASET_KEYS.forEach((key) => {
        const items = { wind, wave, current }[key] || [];
        items.forEach((item) => {
            if (!item.key) {
                return;
            }

            const merged = monthMap.get(item.key) || {};
            merged[key] = item;
            monthMap.set(item.key, merged);
        });
    });

    return sortByMonth([...monthMap.entries()].map(([key, value]) => buildRecord(key, value)));
};

const maxBy = (records = [], field) => (
    records.reduce((best, item) => {
        const value = parseNumber(item[field]);
        if (value === null) {
            return best;
        }

        if (!best || value > best.value) {
            return {
                record: item,
                value
            };
        }

        return best;
    }, null)
);

const averageBy = (records = [], field) => {
    const values = records
        .map((record) => parseNumber(record[field]))
        .filter((value) => value !== null);

    if (!values.length) {
        return null;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
};

export const createEmptySeaStateSummary = () => ({
    hasData: false,
    totalMonths: 0,
    dataStartLabel: '--',
    dataEndLabel: '--',
    maxWind: null,
    maxWave: null,
    maxCurrent: null,
    averageWindSpeed: null,
    averageWaveHeight: null,
    averageCurrentSpeed: null
});

export const calculateSeaStateSummary = (records = []) => {
    const validRecords = records.filter((record) => record.hasWind || record.hasWave || record.hasCurrent);
    if (!validRecords.length) {
        return createEmptySeaStateSummary();
    }

    return {
        hasData: true,
        totalMonths: validRecords.length,
        dataStartLabel: validRecords[0]?.monthLabel || '--',
        dataEndLabel: validRecords[validRecords.length - 1]?.monthLabel || '--',
        maxWind: maxBy(validRecords, 'windSpeed'),
        maxWave: maxBy(validRecords, 'waveHeight'),
        maxCurrent: maxBy(validRecords, 'currentSpeed'),
        averageWindSpeed: averageBy(validRecords, 'windSpeed'),
        averageWaveHeight: averageBy(validRecords, 'waveHeight'),
        averageCurrentSpeed: averageBy(validRecords, 'currentSpeed')
    };
};

export const filterSeaStateRecords = (records = [], dataType = 'all') => {
    if (dataType === 'wind') {
        return records.filter((record) => record.hasWind);
    }

    if (dataType === 'wave') {
        return records.filter((record) => record.hasWave);
    }

    if (dataType === 'current') {
        return records.filter((record) => record.hasCurrent);
    }

    return records.filter((record) => record.hasWind || record.hasWave || record.hasCurrent);
};

export async function fetchHistoricalSeaStatePoint(params = {}) {
    const { lat, lon } = params;
    if (lat === null || lat === undefined || lon === null || lon === undefined) {
        return {
            datasets: {},
            records: [],
            summary: createEmptySeaStateSummary(),
            errors: {
                point: '缺少历史海况查询点'
            },
            succeeded: false
        };
    }

    const query = buildPointQuery(params);
    const yearRange = normalizeYearRange(params);

    const [windResult, waveResult, currentResult] = await Promise.allSettled([
        fetchPointDataset('wind', query),
        fetchPointDataset('wave', query),
        fetchPointDataset('current', query)
    ]);

    const datasets = {
        wind: windResult.status === 'fulfilled' ? windResult.value : null,
        wave: waveResult.status === 'fulfilled' ? waveResult.value : null,
        current: currentResult.status === 'fulfilled' ? currentResult.value : null
    };

    const records = mergePointRecords({
        wind: datasets.wind?.items || [],
        wave: datasets.wave?.items || [],
        current: datasets.current?.items || []
    });

    const errors = {
        wind: windResult.status === 'rejected'
            ? windResult.reason?.message || String(windResult.reason)
            : '',
        wave: waveResult.status === 'rejected'
            ? waveResult.reason?.message || String(waveResult.reason)
            : '',
        current: currentResult.status === 'rejected'
            ? currentResult.reason?.message || String(currentResult.reason)
            : ''
    };

    return {
        datasets,
        records,
        summary: calculateSeaStateSummary(records),
        errors,
        location: datasets.wind?.location || datasets.wave?.location || datasets.current?.location || {
            lat: parseNumber(lat),
            lon: parseNumber(lon)
        },
        startYear: datasets.wind?.startYear || datasets.wave?.startYear || datasets.current?.startYear || yearRange?.startYear || null,
        endYear: datasets.wind?.endYear || datasets.wave?.endYear || datasets.current?.endYear || yearRange?.endYear || null,
        rangeSource: yearRange ? 'filters' : 'default',
        succeeded: records.length > 0
    };
}

export async function fetchHistoricalSeaStateMonths(params = {}) {
    const [windResult, waveResult, currentResult] = await Promise.allSettled([
        requestJson(API_ENDPOINTS.HISTORICAL_WIND.MONTHS(params), '历史风场月份总览接口返回失败'),
        requestJson(API_ENDPOINTS.HISTORICAL_WAVE.MONTHS(params), '历史海浪月份总览接口返回失败'),
        requestJson(API_ENDPOINTS.HISTORICAL_CURRENT.MONTHS(params), '历史洋流月份总览接口返回失败')
    ]);

    return {
        wind: windResult.status === 'fulfilled' ? normalizeMonthsData(windResult.value) : null,
        wave: waveResult.status === 'fulfilled' ? normalizeMonthsData(waveResult.value) : null,
        current: currentResult.status === 'fulfilled' ? normalizeMonthsData(currentResult.value) : null,
        errors: {
            wind: windResult.status === 'rejected' ? windResult.reason?.message || String(windResult.reason) : '',
            wave: waveResult.status === 'rejected' ? waveResult.reason?.message || String(waveResult.reason) : '',
            current: currentResult.status === 'rejected' ? currentResult.reason?.message || String(currentResult.reason) : ''
        }
    };
}
