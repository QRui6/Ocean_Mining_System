import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

const requestJson = async (url, fallbackMessage) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

export const fetchMonitoringAreas = () => (
    requestJson(API_ENDPOINTS.AREAS.LIST, '监控区域接口返回失败')
);

export const fetchMonitoringAreaEvents = (areaId) => (
    requestJson(API_ENDPOINTS.AREAS.EVENTS(areaId), '监控事件接口返回失败')
);
