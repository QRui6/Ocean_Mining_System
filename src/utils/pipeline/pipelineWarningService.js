export const PIPELINE_WARNING_KEY = 'PIPELINE_WARNING_LIST';

const clone = (value) => JSON.parse(JSON.stringify(value));

const readWarnings = () => {
    try {
        const raw = localStorage.getItem(PIPELINE_WARNING_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(normalizeWarning) : [];
    } catch (error) {
        console.warn('读取管道预警失败，已使用空列表', error);
        return [];
    }
};

const writeWarnings = (list) => {
    localStorage.setItem(PIPELINE_WARNING_KEY, JSON.stringify(list));
};

const formatLocalMinute = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const warningLevels = ['绿色', '黄色', '橙色', '红色'];

const getWarningLevel = (riskLevel) => {
    if (warningLevels.includes(riskLevel)) return riskLevel;
    return '黄色';
};

const normalizeWarning = (item = {}) => {
    const forecast = item.forecast || {};

    return {
        ...item,
        status: item.status || 'active',
        warningLevel: item.warningLevel || getWarningLevel(item.riskLevel),
        windSpeed: item.windSpeed ?? forecast.windSpeed ?? null,
        gust: item.gust ?? forecast.gust ?? null,
        waveHeight: item.waveHeight ?? forecast.waveHeight ?? null,
        currentSpeed: item.currentSpeed ?? forecast.currentSpeed ?? item.surfaceCurrent ?? forecast.surfaceCurrent ?? null,
        estimatedStress: item.estimatedStress ?? item.topEquivalentStress ?? item.matchedThreshold?.topEquivalentStress ?? null,
        allowableStress: item.allowableStress ?? null,
        dataCompleteness: item.dataCompleteness || ''
    };
};

const buildWarning = ({ type, result, message, suggestion, sourceKey }) => {
    const config = result?.config || {};
    const forecast = result?.forecast || {};
    const createdAt = new Date().toISOString();

    return {
        id: sourceKey || `PIPE-${Date.now()}`,
        sourceKey: sourceKey || `PIPE-${type}-${forecast.forecastTime || createdAt}`,
        type: 'pipeline',
        source: '管道评估',
        category: type,
        projectName: config.projectName || '深海采矿试验项目',
        miningArea: config.miningArea || forecast.miningArea || 'CC区',
        pipeSize: config.pipeSize || '--',
        operationType: config.operationType || '--',
        riskLevel: result?.riskLevel || '黄色',
        warningLevel: getWarningLevel(result?.riskLevel),
        warningTime: forecast.forecastTime || createdAt.slice(0, 16).replace('T', ' '),
        windSpeed: forecast.windSpeed ?? null,
        gust: forecast.gust ?? null,
        waveHeight: forecast.waveHeight ?? null,
        wavePeriod: forecast.wavePeriod ?? null,
        currentSpeed: forecast.currentSpeed ?? null,
        seaState: result?.seaState?.code ?? forecast.seaState ?? null,
        seaStateLabel: result?.seaState?.label || '',
        matchType: result?.matchType || '',
        matchedScenario: result?.selectedScenarioText || '',
        estimatedStress: result?.estimatedStress ?? null,
        allowableStress: result?.allowableStress ?? null,
        safetyMargin: result?.safetyMargin ?? null,
        dataCompleteness: result?.dataCompleteness || '',
        message,
        suggestion,
        createdAt,
        status: 'active',
        riskReason: result?.riskReason || ''
    };
};

const upsertWarnings = (incoming) => {
    const current = readWarnings();
    const byKey = new Map(current.map((item) => [item.sourceKey || item.id, item]));

    incoming.forEach((item) => {
        const key = item.sourceKey || item.id;
        byKey.set(key, {
            ...(byKey.get(key) || {}),
            ...item
        });
    });

    const next = [...byKey.values()]
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .slice(0, 100);

    writeWarnings(next);
    return next;
};

export const getPipelineWarnings = () => readWarnings();

export const savePipelineWarnings = (list) => {
    writeWarnings(clone(list));
};

export const clearPipelineWarnings = () => {
    writeWarnings([]);
};

export const updatePipelineWarningStatus = (id, status) => {
    const next = readWarnings().map((item) => (
        item.id === id ? { ...item, status } : item
    ));
    writeWarnings(next);
    return next;
};

export const syncPipelineWarningsFromRisk = (riskResult) => {
    if (!riskResult || !['橙色', '红色'].includes(riskResult.riskLevel)) {
        return readWarnings();
    }

    const forecastTime = riskResult.forecast?.forecastTime || new Date().toISOString();
    return upsertWarnings([
        buildWarning({
            type: 'current-risk',
            result: riskResult,
            sourceKey: `PIPE-CURRENT-${forecastTime}-${riskResult.riskLevel}`,
            message: `${riskResult.config?.miningArea || '当前矿区'}管道作业风险达到${riskResult.riskLevel}`,
            suggestion: riskResult.suggestion || '请按管道安全作业预案处置'
        })
    ]);
};

export const syncPipelineWarningsFromWindow = (windowResult) => {
    const results = windowResult?.results || [];
    const incoming = [];
    const firstRed = results.find((item) => item.riskLevel === '红色');
    const firstOrange = results.find((item) => item.riskLevel === '橙色');

    if (firstRed) {
        incoming.push(buildWarning({
            type: 'future-red-risk',
            result: firstRed,
            sourceKey: `PIPE-FUTURE-RED-${firstRed.forecast.forecastTime}`,
            message: `未来窗口将在 ${firstRed.forecast.forecastTime} 出现红色管道风险`,
            suggestion: '停止作业，启动回收或撤离预案'
        }));
    }

    if (firstOrange) {
        incoming.push(buildWarning({
            type: 'future-orange-risk',
            result: firstOrange,
            sourceKey: `PIPE-FUTURE-ORANGE-${firstOrange.forecast.forecastTime}`,
            message: `未来窗口将在 ${firstOrange.forecast.forecastTime} 出现橙色管道风险`,
            suggestion: '暂停新一轮布放，准备回收方案'
        }));
    }

    if (!windowResult?.availableWindows?.length && results[0]) {
        incoming.push(buildWarning({
            type: 'window-unavailable',
            result: results[0],
            sourceKey: `PIPE-WINDOW-NONE-${results[0].forecast.forecastTime}`,
            message: '未来72小时未形成连续安全作业窗口',
            suggestion: windowResult.summarySuggestion || '建议推迟作业并持续跟踪预报'
        }));
    }

    return incoming.length ? upsertWarnings(incoming) : readWarnings();
};

export const syncPipelineWarningsFromPipeSelection = (evaluation) => {
    if (!evaluation || !warningLevels.includes(evaluation.conclusionLevel)) {
        return readWarnings();
    }

    const candidate = evaluation.referenceCandidate || evaluation.candidates?.[0] || {};
    const warningTime = formatLocalMinute();
    const result = {
        config: {
            projectName: '提升管道选型',
            miningArea: evaluation.site?.displayName || evaluation.site?.siteName || evaluation.site?.siteCode || '当前矿区',
            pipeSize: candidate.size || '--',
            operationType: '选型评估'
        },
        forecast: {
            ...(evaluation.metocean?.currentForecast || {}),
            forecastTime: evaluation.metocean?.currentForecast?.forecastTime || warningTime
        },
        riskLevel: evaluation.conclusionLevel,
        riskReason: evaluation.riskReason,
        seaState: evaluation.seaState,
        matchType: evaluation.matchType,
        selectedScenarioText: evaluation.selectedScenarioText,
        estimatedStress: candidate.combinedStress ?? null,
        allowableStress: evaluation.allowableStress ?? null,
        safetyMargin: candidate.safetyMargin ?? null,
        dataCompleteness: evaluation.dataCompleteness
    };

    return upsertWarnings([
        buildWarning({
            type: 'selection-risk',
            result,
            sourceKey: `PIPE-SELECTION-${evaluation.site?.id || 'unknown'}-${evaluation.scenario?.id || 'unknown'}-${evaluation.material}-${evaluation.safetyFactor}`,
            message: `${result.config.miningArea}管道评估达到${evaluation.conclusionLevel}`,
            suggestion: evaluation.summarySuggestion
        })
    ]);
};
