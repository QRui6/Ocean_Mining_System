import { API_BASE_URL, REQUEST_TIMEOUT } from './config.js';

const requestJson = async (path, options = {}) => {
    const { timeout = REQUEST_TIMEOUT, signal, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
            Accept: 'application/json',
            ...(fetchOptions.headers || {})
        },
        signal: signal || AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText || '请求失败'}`);
    }

    const result = await response.json();
    if (result?.success === false) {
        throw new Error(result.error || '接口返回失败');
    }
    return result?.data ?? result;
};

const queryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    const serialized = query.toString();
    return serialized ? `?${serialized}` : '';
};

const downloadText = async (path, fallbackName) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: 下载失败`);

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const matched = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const filename = decodeURIComponent(matched?.[1] || matched?.[2] || fallbackName);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const fetchBuoys = () => requestJson('/api/buoys');
export const fetchBuoyRealtime = () => requestJson('/api/buoys/realtime');
export const fetchBuoyHistory = (buoyId, range, options = {}) => requestJson(
    `/api/buoys/${encodeURIComponent(buoyId)}/history${queryString({ range })}`,
    { timeout: 60000, ...options }
);

export const fetchForecastRegions = () => requestJson('/api/forecast/regions');
export const fetchForecastSummary = (regionId, range) => requestJson(`/api/forecast/regions/${encodeURIComponent(regionId)}/summary${queryString({ range })}`);
export const fetchForecastSeries = (regionId, range) => {
    const endpoint = range === '12h' ? 'hourly' : 'daily';
    return requestJson(`/api/forecast/regions/${encodeURIComponent(regionId)}/${endpoint}${queryString({ range })}`);
};
export const fetchForecastBulletin = (regionId, range) => requestJson(`/api/forecast/regions/${encodeURIComponent(regionId)}/bulletin${queryString({ range })}`);
export const downloadForecastBulletin = (regionId, range) => downloadText(
    `/api/forecast/regions/${encodeURIComponent(regionId)}/bulletin/download${queryString({ range, format: 'txt' })}`,
    `forecast_${regionId}_${range}.txt`
);

export const fetchWeatherWarnings = (params = {}) => requestJson(`/api/warnings/weather${queryString(params)}`);
export const fetchWeatherWarningStats = () => requestJson('/api/warnings/weather/stats');
export const fetchWeatherWarningDetail = (id) => requestJson(`/api/warnings/weather/${encodeURIComponent(id)}`);
export const downloadWeatherWarningBulletin = (id, warningCode = 'weather_warning') => downloadText(
    `/api/warnings/weather/${encodeURIComponent(id)}/bulletin/download${queryString({ format: 'txt' })}`,
    `${warningCode}.txt`
);
