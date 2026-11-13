import { DEFAULT_PIPELINE_CONFIGS, PIPELINE_THRESHOLD_DATA } from '../data/pipelineThresholdData.js';
import { DEFAULT_PIPE_SELECTION_STATE } from '../data/liftingPipeSelection.js';
import { generateForecast72h } from './pipelineMockGenerator.js';

export const PIPELINE_STORAGE_KEYS = {
    configList: 'PIPELINE_CONFIG_LIST',
    thresholdList: 'PIPELINE_THRESHOLD_LIST',
    forecastList: 'PIPELINE_FORECAST_LIST',
    riskHistory: 'PIPELINE_RISK_HISTORY',
    warningList: 'PIPELINE_WARNING_LIST',
    selectionState: 'PIPE_SELECTION_EVALUATION_STATE'
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const read = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
        console.warn(`读取${key}失败，已使用默认数据`, error);
        return clone(fallback);
    }
};

const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getConfigList = () => read(PIPELINE_STORAGE_KEYS.configList, DEFAULT_PIPELINE_CONFIGS);

export const saveConfigList = (list) => {
    write(PIPELINE_STORAGE_KEYS.configList, list);
};

export const getCurrentConfig = () => {
    const list = getConfigList();
    return list.find((item) => item.enabled) || list[0] || null;
};

export const saveCurrentConfig = (config) => {
    const list = getConfigList();
    const nextList = list.map((item) => ({
        ...item,
        enabled: item.id === config.id
    }));

    if (!nextList.some((item) => item.id === config.id)) {
        nextList.push({ ...config, enabled: true });
    }

    saveConfigList(nextList);
};

export const getThresholdList = () => read(PIPELINE_STORAGE_KEYS.thresholdList, PIPELINE_THRESHOLD_DATA);

export const saveThresholdList = (list) => {
    write(PIPELINE_STORAGE_KEYS.thresholdList, list);
};

export const getForecastList = () => {
    const currentConfig = getCurrentConfig();
    return read(PIPELINE_STORAGE_KEYS.forecastList, generateForecast72h(currentConfig?.miningArea || 'CC区'));
};

export const saveForecastList = (list) => {
    write(PIPELINE_STORAGE_KEYS.forecastList, list);
};

export const getRiskHistory = () => read(PIPELINE_STORAGE_KEYS.riskHistory, []);

export const saveRiskHistory = (list) => {
    write(PIPELINE_STORAGE_KEYS.riskHistory, list);
};

export const getPipeSelectionState = () => read(PIPELINE_STORAGE_KEYS.selectionState, DEFAULT_PIPE_SELECTION_STATE);

export const savePipeSelectionState = (state) => {
    write(PIPELINE_STORAGE_KEYS.selectionState, state);
};

export const resetPipelineData = () => {
    Object.values(PIPELINE_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

export const initializePipelineData = () => {
    if (!localStorage.getItem(PIPELINE_STORAGE_KEYS.configList)) {
        saveConfigList(clone(DEFAULT_PIPELINE_CONFIGS));
    }

    if (!localStorage.getItem(PIPELINE_STORAGE_KEYS.thresholdList)) {
        saveThresholdList(clone(PIPELINE_THRESHOLD_DATA));
    }

    if (!localStorage.getItem(PIPELINE_STORAGE_KEYS.forecastList)) {
        saveForecastList(generateForecast72h(DEFAULT_PIPELINE_CONFIGS[0].miningArea));
    }

    if (!localStorage.getItem(PIPELINE_STORAGE_KEYS.riskHistory)) {
        saveRiskHistory([]);
    }

    if (!localStorage.getItem(PIPELINE_STORAGE_KEYS.selectionState)) {
        savePipeSelectionState(clone(DEFAULT_PIPE_SELECTION_STATE));
    }
};
