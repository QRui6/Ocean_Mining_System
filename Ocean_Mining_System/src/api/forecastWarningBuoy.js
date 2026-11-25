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

const downloadFile = async (path, fallbackName, contentType = 'text/plain') => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Accept: contentType },
        signal: AbortSignal.timeout(contentType === 'application/pdf' ? 60000 : REQUEST_TIMEOUT)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: 下载失败`);

    if (contentType === 'application/pdf' && !response.headers.get('Content-Type')?.toLowerCase().includes('application/pdf')) {
        throw new Error('服务器未返回 PDF 文件，请确认后端已更新。');
    }
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
export const downloadForecastBulletin = (regionId, range, variant = 'report', format = 'pdf') => downloadFile(
    `/api/forecast/regions/${encodeURIComponent(regionId)}/bulletin/download${queryString({ range, format, variant })}`,
    `forecast_${variant}_${regionId}_${range}.${format}`,
    format==='pdf'?'application/pdf':'text/plain'
);

export const fetchWeatherWarnings = (params = {}) => requestJson(`/api/warnings/weather${queryString(params)}`);
export const fetchWeatherWarningStats = () => requestJson('/api/warnings/weather/stats');
export const fetchWeatherWarningDetail = (id) => requestJson(`/api/warnings/weather/${encodeURIComponent(id)}`);
export const downloadWeatherWarningBulletin = (id, warningCode = 'weather_warning', format = 'txt') => downloadFile(
    `/api/warnings/weather/${encodeURIComponent(id)}/bulletin/download${queryString({ format })}`,
    `${warningCode}.${format}`,
    format === 'pdf' ? 'application/pdf' : 'text/plain'
);

export const downloadWarningAnalysisPdf = async (content, report = null) => {
    const response = await fetch(`${API_BASE_URL}/api/warnings/analysis/bulletin/pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
        body: JSON.stringify({content, report}), signal: AbortSignal.timeout(60000)
    });
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('PDF生成失败');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = '预警分析报文.pdf';
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
};
