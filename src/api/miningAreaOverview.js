import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';
import {
    fetchMiningOverviewRegionDaily,
    fetchMiningOverviewRegionHourly,
    fetchMiningOverviewSiteDaily,
    fetchMiningOverviewSiteHourly
} from './miningRegionOverview.js';

const PLACEHOLDER_POINTS = 12;

const createPlaceholderTimeline = () => {
    const now = new Date();
    return Array.from({ length: PLACEHOLDER_POINTS }, (_, index) => {
        const pointTime = new Date(now);
        pointTime.setMonth(now.getMonth() - (PLACEHOLDER_POINTS - index - 1));
        return pointTime.toISOString();
    });
};

const buildPlaceholderOverview = (area = {}) => {
    const timeline = createPlaceholderTimeline();

    return {
        id: area.id || 'unknown',
        name: area.name || area.contractor || '未命名矿区',
        contractor: area.contractor || '未知',
        sponsor: area.sponsor || '未知',
        mineral: area.mineral || '未知',
        location: area.location || '未知',
        dateRange: area.dateRange || '未知',
        areaSize: area.area || '未知',
        polygon: area.polygon || [],
        waterDepth: {
            average: null,
            min: null,
            max: null,
            center: null,
            point: null,
            unit: 'm',
            message: '暂无矿区水深数据'
        },
        historical: {
            timestamps: timeline,
            windSpeed: timeline.map(() => null),
            waveHeight: timeline.map(() => null),
            currentSpeed: timeline.map(() => null),
            unitMap: {
                windSpeed: 'm/s',
                waveHeight: 'm',
                currentSpeed: 'm/s'
            }
        },
        currentForecast: null,
        notices: [
            '已预留矿区水深字段，等待接入真实勘测数据。',
            '已预留风、浪、流历史序列接口，当前返回空数据占位。'
        ],
        dataStatus: 'placeholder'
    };
};

const requestJson = async (url) => {
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
        throw new Error(result.error || '矿区总览接口返回失败');
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

const formatLocalDate = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const sortForecastDates = (records = []) => (
    [...records].sort((first, second) => {
        const firstTime = new Date(first.forecastDate || first.baseDate || 0).getTime();
        const secondTime = new Date(second.forecastDate || second.baseDate || 0).getTime();
        return firstTime - secondTime;
    })
);

const sortForecastTimes = (records = []) => (
    [...records].sort((first, second) => {
        const firstValue = `${first.forecastDate || ''} ${first.forecastTime || ''} ${String(first.forecastHour ?? '').padStart(4, '0')}`;
        const secondValue = `${second.forecastDate || ''} ${second.forecastTime || ''} ${String(second.forecastHour ?? '').padStart(4, '0')}`;
        return firstValue.localeCompare(secondValue);
    })
);

const pickForecastDate = (dailyForecast = []) => {
    const sorted = sortForecastDates(dailyForecast);
    const dates = sorted
        .map((item) => item.forecastDate)
        .filter(Boolean);

    if (!dates.length) {
        return '';
    }

    const today = formatLocalDate();
    return dates.find((date) => date >= today) || dates[0];
};

const parseTimestamp = (value, fallbackDate = '') => {
    if (!value && !fallbackDate) {
        return 0;
    }

    const normalized = value && String(value).includes('T')
        ? value
        : `${fallbackDate || ''} ${value || ''}`.trim();
    const time = new Date(normalized).getTime();
    return Number.isFinite(time) ? time : 0;
};

const normalizeForecastRecord = (record = {}) => ({
    ...record,
    windSpeed: parseNumber(record.windSpeed ?? record.windSpeedAvg),
    windSpeedMax: parseNumber(record.windSpeedMax),
    gust: parseNumber(record.gust ?? record.gustMax),
    waveHeight: parseNumber(record.waveHeight ?? record.waveHeightAvg),
    waveHeightMax: parseNumber(record.waveHeightMax),
    wavePeriod: parseNumber(record.wavePeriod ?? record.wavePeriodAvg),
    currentSpeed: parseNumber(record.currentSpeed ?? record.currentSpeedAvg),
    currentSpeedMax: parseNumber(record.currentSpeedMax),
    currentDir: parseNumber(record.currentDir ?? record.currentDirMean)
});

const pickCurrentForecast = (hourlyForecast = [], fallbackDailyForecast = []) => {
    const normalizedHourly = sortForecastTimes(hourlyForecast).map(normalizeForecastRecord);
    if (normalizedHourly.length) {
        const now = Date.now();
        return [...normalizedHourly].sort((first, second) => (
            Math.abs(parseTimestamp(first.forecastTime, first.forecastDate) - now)
            - Math.abs(parseTimestamp(second.forecastTime, second.forecastDate) - now)
        ))[0];
    }

    const normalizedDaily = sortForecastDates(fallbackDailyForecast).map(normalizeForecastRecord);
    return normalizedDaily[0] || null;
};

const computePolygonCentroid = (polygon = []) => {
    const validPoints = polygon
        .map((point) => {
            if (!Array.isArray(point) || point.length < 2) {
                return null;
            }

            const lng = parseNumber(point[0]);
            const lat = parseNumber(point[1]);
            return lng === null || lat === null ? null : { lng, lat };
        })
        .filter(Boolean);

    if (!validPoints.length) {
        return { lng: null, lat: null };
    }

    const sum = validPoints.reduce((accumulator, point) => ({
        lng: accumulator.lng + point.lng,
        lat: accumulator.lat + point.lat
    }), { lng: 0, lat: 0 });

    return {
        lng: sum.lng / validPoints.length,
        lat: sum.lat / validPoints.length
    };
};

const buildReferencePoints = (area = {}, context = {}) => {
    const site = context.site || {};
    const region = context.region || {};
    const points = [];
    const pointKeys = new Set();

    const addPoint = (lng, lat, source) => {
        if (lng === null || lat === null) {
            return;
        }

        const pointKey = `${lng}:${lat}`;
        if (pointKeys.has(pointKey)) {
            return;
        }

        pointKeys.add(pointKey);
        points.push({ lng, lat, source });
    };

    addPoint(parseNumber(site.lng), parseNumber(site.lat), 'site');

    const centroid = computePolygonCentroid(area.polygon || []);
    addPoint(centroid.lng, centroid.lat, 'polygon');

    addPoint(parseNumber(region.centerLng), parseNumber(region.centerLat), 'region');

    return points.length
        ? points
        : [{ lng: null, lat: null, source: 'polygon' }];
};

const buildWaterDepth = (region = {}, site = {}, fallback = {}) => {
    const siteDepth = parseNumber(site.depthMeters);
    const centerDepth = parseNumber(region.centerDepthMeters);
    const averageDepth = parseNumber(region.depthAvgMeters);
    const minDepth = parseNumber(region.depthMinMeters);
    const maxDepth = parseNumber(region.depthMaxMeters);
    const sampleCount = Number(region.bathymetrySampleCount ?? 0) || null;
    const updatedAt = site.bathymetryUpdatedAt || region.bathymetryUpdatedAt || null;

    const values = [averageDepth, minDepth, maxDepth, centerDepth, siteDepth].filter((value) => value !== null);

    return {
        average: siteDepth ?? averageDepth ?? fallback.average ?? null,
        min: minDepth ?? siteDepth ?? fallback.min ?? null,
        max: maxDepth ?? siteDepth ?? fallback.max ?? null,
        center: centerDepth ?? fallback.center ?? null,
        point: siteDepth ?? fallback.point ?? null,
        sampleCount,
        updatedAt,
        unit: 'm',
        message: values.length ? '' : '暂无矿区水深数据'
    };
};

const sortHistoricalItems = (items = []) => (
    [...items].sort((first, second) => {
        const firstYear = Number(first.year ?? 0);
        const secondYear = Number(second.year ?? 0);
        if (firstYear !== secondYear) {
            return firstYear - secondYear;
        }

        const firstMonth = Number(first.month ?? 0);
        const secondMonth = Number(second.month ?? 0);
        if (firstMonth !== secondMonth) {
            return firstMonth - secondMonth;
        }

        return String(first.monthLabel || first.monthStart || '').localeCompare(
            String(second.monthLabel || second.monthStart || '')
        );
    })
);

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

const mergeHistoricalItems = (seriesMap = {}) => {
    const monthMap = new Map();

    Object.entries(seriesMap).forEach(([key, items]) => {
        sortHistoricalItems(items).forEach((item) => {
            const monthKey = toMonthKey(item);
            if (!monthKey) {
                return;
            }

            const merged = monthMap.get(monthKey) || {
                key: monthKey,
                monthLabel: item.monthLabel || monthKey,
                monthStart: item.monthStart || monthKey
            };
            merged[key] = item;
            monthMap.set(monthKey, merged);
        });
    });

    return [...monthMap.values()]
        .sort((first, second) => String(first.key).localeCompare(String(second.key)));
};

const buildMonthKeySet = (items = []) => (
    new Set(
        sortHistoricalItems(items)
            .map((item) => toMonthKey(item))
            .filter(Boolean)
    )
);

const intersectMonthKeySets = (...sets) => {
    const validSets = sets.filter((set) => set instanceof Set && set.size > 0);
    if (!validSets.length) {
        return new Set();
    }

    const [firstSet, ...restSets] = validSets;
    return new Set(
        [...firstSet].filter((key) => restSets.every((set) => set.has(key)))
    );
};

const buildHistoricalSeries = (windItems = [], waveItems = [], currentItems = []) => {
    const merged = mergeHistoricalItems({
        wind: windItems,
        wave: waveItems,
        current: currentItems
    });
    const commonMonthKeys = intersectMonthKeySets(
        buildMonthKeySet(windItems),
        buildMonthKeySet(waveItems),
        buildMonthKeySet(currentItems)
    );
    const alignedMerged = (
        commonMonthKeys.size
            ? merged.filter((item) => commonMonthKeys.has(item.key))
            : merged
    ).slice(-PLACEHOLDER_POINTS);

    return {
        timestamps: alignedMerged.map((item) => item.monthLabel || item.key),
        windSpeed: alignedMerged.map((item) => parseNumber(item.wind?.wind?.speed)),
        waveHeight: alignedMerged.map((item) => parseNumber(item.wave?.wave?.height)),
        currentSpeed: alignedMerged.map((item) => parseNumber(item.current?.current?.speed)),
        unitMap: {
            windSpeed: 'm/s',
            waveHeight: 'm',
            currentSpeed: 'm/s'
        }
    };
};

const fetchHistoricalPointSeries = async (urlBuilder, lat, lon) => {
    if (lat === null || lon === null) {
        return [];
    }

    const data = await requestJson(urlBuilder({
        lat,
        lon
    }));

    return Array.isArray(data?.items) ? data.items : [];
};

const hasHistoricalValues = (historical = {}) => (
    historical.windSpeed?.some((value) => value !== null)
    || historical.waveHeight?.some((value) => value !== null)
    || historical.currentSpeed?.some((value) => value !== null)
);

const fetchHistoricalSeriesForPoint = async (referencePoint) => {
    if (referencePoint.lat === null || referencePoint.lng === null) {
        return {
            historical: buildHistoricalSeries([], [], []),
            succeeded: false
        };
    }

    const [windResult, waveResult, currentResult] = await Promise.allSettled([
        fetchHistoricalPointSeries(API_ENDPOINTS.HISTORICAL_WIND.POINT_QUERY, referencePoint.lat, referencePoint.lng),
        fetchHistoricalPointSeries(API_ENDPOINTS.HISTORICAL_WAVE.POINT_QUERY, referencePoint.lat, referencePoint.lng),
        fetchHistoricalPointSeries(API_ENDPOINTS.HISTORICAL_CURRENT.POINT_QUERY, referencePoint.lat, referencePoint.lng)
    ]);

    if (windResult.status === 'rejected') {
        console.warn('⚠️ 历史风场查询失败:', referencePoint, windResult.reason);
    }
    if (waveResult.status === 'rejected') {
        console.warn('⚠️ 历史海浪查询失败:', referencePoint, waveResult.reason);
    }
    if (currentResult.status === 'rejected') {
        console.warn('⚠️ 历史洋流查询失败:', referencePoint, currentResult.reason);
    }

    const historical = buildHistoricalSeries(
        windResult.status === 'fulfilled' ? windResult.value : [],
        waveResult.status === 'fulfilled' ? waveResult.value : [],
        currentResult.status === 'fulfilled' ? currentResult.value : []
    );

    return {
        historical,
        succeeded: hasHistoricalValues(historical)
    };
};

const buildNotices = ({ waterDepth, currentForecast, historical, referencePoint, region, site }) => {
    const notices = [];

    if (referencePoint.lng !== null && referencePoint.lat !== null) {
        const sourceLabel = {
            site: '单矿区站点',
            region: '区域中心点',
            polygon: '矿区多边形几何中心'
        }[referencePoint.source] || '参考点';
        notices.push(`历史风浪流趋势按${sourceLabel} (${referencePoint.lat.toFixed(3)}, ${referencePoint.lng.toFixed(3)}) 查询。`);
    }

    if (waterDepth.message) {
        notices.push(waterDepth.message);
    } else if (region?.bathymetrySampleCount || site?.depthMeters !== undefined) {
        notices.push('矿区水深已改为矿区总览区域/站点接口返回值。');
    }

    const hasHistorical = historical.windSpeed.some((value) => value !== null)
        || historical.waveHeight.some((value) => value !== null)
        || historical.currentSpeed.some((value) => value !== null);

    if (hasHistorical) {
        notices.push('历史趋势已接入月均风场、海浪、洋流接口。');
    }

    if (currentForecast) {
        notices.push('作业辅助判断优先使用单矿区/区域近期风浪流预报。');
    }

    return notices.length ? notices : ['暂无可展示的海深或风浪流数据。'];
};

export async function fetchMiningAreaOverview(area, context = {}) {
    const areaId = typeof area === 'object' ? (area.dbId || area.id) : area;
    const fallback = buildPlaceholderOverview(typeof area === 'object' ? area : { id: areaId });

    try {
        const region = context.region || null;
        const site = context.site || null;
        const referencePoints = buildReferencePoints(area || {}, context || {});

        const currentForecastPromise = (async () => {
            try {
                if (site?.id) {
                    const dailyForecast = await fetchMiningOverviewSiteDaily(site.id);
                    const forecastDate = pickForecastDate(dailyForecast);
                    const hourlyForecast = forecastDate
                        ? await fetchMiningOverviewSiteHourly(site.id, forecastDate)
                        : [];
                    return pickCurrentForecast(hourlyForecast, dailyForecast);
                }

                if (region?.id) {
                    const dailyForecast = await fetchMiningOverviewRegionDaily(region.id);
                    const forecastDate = pickForecastDate(dailyForecast);
                    const hourlyForecast = forecastDate
                        ? await fetchMiningOverviewRegionHourly(region.id, forecastDate)
                        : [];
                    return pickCurrentForecast(hourlyForecast, dailyForecast);
                }
            } catch (error) {
                console.warn('⚠️ 近期风浪流预报查询失败，继续加载其余数据:', error);
            }

            return null;
        })();

        let referencePoint = referencePoints[0];
        let historical = buildHistoricalSeries([], [], []);

        for (const candidatePoint of referencePoints) {
            const result = await fetchHistoricalSeriesForPoint(candidatePoint);
            if (result.succeeded) {
                referencePoint = candidatePoint;
                historical = result.historical;
                break;
            }

            if (!hasHistoricalValues(historical)) {
                referencePoint = candidatePoint;
                historical = result.historical;
            }
        }

        const currentForecast = await currentForecastPromise;
        const waterDepth = buildWaterDepth(region || {}, site || {}, fallback.waterDepth);
        const hasHistorical = hasHistoricalValues(historical);
        const hasWaterDepth = [waterDepth.average, waterDepth.min, waterDepth.max, waterDepth.center, waterDepth.point]
            .some((value) => value !== null);
        const dataStatus = currentForecast || hasHistorical || hasWaterDepth ? 'remote' : 'placeholder';

        return {
            ...fallback,
            waterDepth,
            historical,
            currentForecast: currentForecast ? normalizeForecastRecord(currentForecast) : null,
            notices: buildNotices({
                waterDepth,
                currentForecast,
                historical,
                referencePoint,
                region,
                site
            }),
            matchedRegion: region,
            matchedSite: site,
            referencePoint,
            dataStatus
        };
    } catch (error) {
        console.warn('⚠️ 矿区总览接口不可用，回退到占位数据:', error);
        return fallback;
    }
}
