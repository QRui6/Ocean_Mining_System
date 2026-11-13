import {
    fetchMiningOverviewRegions,
    fetchMiningOverviewSiteDaily,
    fetchMiningOverviewSiteHourly,
    fetchMiningOverviewSites
} from '../api/miningRegionOverview.js';

const toNumberOrNull = (value) => {
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

const parseTime = (value) => {
    const timestamp = new Date(value || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

export const deriveSeaStateFromWaveHeight = (waveHeight) => {
    const height = toNumberOrNull(waveHeight);

    if (height === null) {
        return {
            code: null,
            label: '暂无浪高数据',
            range: '--',
            supportedBySelectionTable: false
        };
    }

    const ranges = [
        { max: 0, code: 0, label: '无浪', range: '0 m' },
        { max: 0.1, code: 1, label: '微浪', range: '0-0.1 m' },
        { max: 0.5, code: 2, label: '小浪', range: '0.1-0.5 m' },
        { max: 1.25, code: 3, label: '轻浪', range: '0.5-1.25 m' },
        { max: 2.5, code: 4, label: '中等浪', range: '1.25-2.5 m' },
        { max: 4, code: 5, label: '粗浪', range: '2.5-4 m' },
        { max: 6, code: 6, label: '很粗浪', range: '4-6 m' },
        { max: 9, code: 7, label: '高浪', range: '6-9 m' },
        { max: 14, code: 8, label: '很高浪', range: '9-14 m' }
    ];

    const matched = ranges.find((item) => height <= item.max) || {
        code: 9,
        label: '巨浪',
        range: '>14 m'
    };

    return {
        ...matched,
        supportedBySelectionTable: matched.code <= 5
    };
};

const normalizeForecastRecord = (record = {}) => ({
    ...record,
    forecastTime: record.forecastTime || `${record.forecastDate || ''} ${record.forecastHour ?? ''}`,
    windSpeed: toNumberOrNull(record.windSpeed ?? record.windSpeedAvg),
    gust: toNumberOrNull(record.gust ?? record.gustMax),
    waveHeight: toNumberOrNull(record.waveHeight ?? record.waveHeightAvg),
    wavePeriod: toNumberOrNull(record.wavePeriod ?? record.wavePeriodAvg),
    currentSpeed: toNumberOrNull(record.currentSpeed ?? record.currentSpeedAvg),
    currentDir: toNumberOrNull(record.currentDir ?? record.currentDirMean)
});

const pickForecastDate = (dailyForecast = []) => {
    const dates = dailyForecast
        .map((item) => item.forecastDate)
        .filter(Boolean)
        .sort();

    if (!dates.length) {
        return '';
    }

    const today = formatLocalDate();
    return dates.find((date) => date >= today) || dates[dates.length - 1];
};

const pickCurrentForecast = (hourlyForecast = []) => {
    if (!hourlyForecast.length) {
        return null;
    }

    const now = Date.now();
    return [...hourlyForecast].sort((first, second) => (
        Math.abs(parseTime(first.forecastTime) - now) - Math.abs(parseTime(second.forecastTime) - now)
    ))[0];
};

export const loadPipelineMiningSites = async () => {
    const regions = await fetchMiningOverviewRegions();
    const siteGroups = await Promise.all(
        regions.map(async (region) => {
            const sites = await fetchMiningOverviewSites(region.id);
            return sites.map((site) => ({
                ...site,
                regionId: String(site.regionId || region.id || ''),
                regionName: site.regionName || region.regionName || region.regionCode || '',
                displayName: site.siteName || site.siteCode || `矿区 ${site.id}`
            }));
        })
    );

    return siteGroups
        .flat()
        .sort((first, second) => (
            String(first.regionName).localeCompare(String(second.regionName), 'zh-CN')
            || String(first.siteCode).localeCompare(String(second.siteCode), 'zh-CN')
        ));
};

export const loadPipelineSiteMetocean = async (site) => {
    if (!site?.id) {
        return {
            site: null,
            forecastDate: '',
            dailyForecast: [],
            hourlyForecast: [],
            currentForecast: null,
            seaState: deriveSeaStateFromWaveHeight(null),
            flowDataAvailable: false,
            dataStatus: 'empty'
        };
    }

    const dailyForecast = await fetchMiningOverviewSiteDaily(site.id);
    const forecastDate = pickForecastDate(dailyForecast);
    const hourlyForecast = forecastDate
        ? (await fetchMiningOverviewSiteHourly(site.id, forecastDate)).map(normalizeForecastRecord)
        : [];
    const currentForecast = pickCurrentForecast(hourlyForecast);

    return {
        site,
        forecastDate,
        dailyForecast,
        hourlyForecast,
        currentForecast,
        seaState: deriveSeaStateFromWaveHeight(currentForecast?.waveHeight),
        flowDataAvailable: hourlyForecast.some((item) => item.currentSpeed !== null),
        dataStatus: currentForecast ? 'remote' : 'empty'
    };
};

