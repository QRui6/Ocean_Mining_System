import { RISK_LEVELS } from '../data/marineForecastMockData.js';
import { PIPE_SELECTION_MATERIALS, PIPE_SELECTION_SCENARIOS } from '../data/liftingPipeSelection.js';
import { deriveSeaStateFromWaveHeight } from './pipelineMetoceanService.js';

const adviceByRisk = {
    绿色: '可正常作业',
    黄色: '谨慎作业，加强监测',
    橙色: '暂停新一轮布放，准备回收方案',
    红色: '停止作业，启动回收或撤离预案'
};

const riskOrder = Object.fromEntries(RISK_LEVELS.map((level, index) => [level, index]));

export const getRiskAdvice = (riskLevel) => adviceByRisk[riskLevel] || '请根据当前风险等级执行对应作业控制措施';

export const calculateAllowableStress = (yieldStrength, safetyFactor) => (
    Number((Number(yieldStrength || 0) * Number(safetyFactor || 0)).toFixed(3))
);

export const calculateSafetyMargin = (allowableStress, equivalentStress) => (
    Number((Number(allowableStress || 0) - Number(equivalentStress || 0)).toFixed(3))
);

export const judgeRiskLevel = (equivalentStress, yieldStrength, safetyFactor) => {
    const allowableStress = calculateAllowableStress(yieldStrength, safetyFactor);
    const stress = Number(equivalentStress || 0);

    if (stress <= allowableStress * 0.85) {
        return { riskLevel: '绿色', suggestion: adviceByRisk['绿色'], riskReason: '综合应力低于许用应力85%' };
    }

    if (stress <= allowableStress) {
        return { riskLevel: '黄色', suggestion: adviceByRisk['黄色'], riskReason: '综合应力接近许用应力' };
    }

    if (stress <= Number(yieldStrength || 0)) {
        return { riskLevel: '橙色', suggestion: adviceByRisk['橙色'], riskReason: '综合应力超过许用应力但未超过屈服强度' };
    }

    return { riskLevel: '红色', suggestion: adviceByRisk['红色'], riskReason: '综合应力超过材料屈服强度' };
};

const getMaterialYieldStrength = (material, fallback) => (
    PIPE_SELECTION_MATERIALS.find((item) => item.key === material)?.yieldStrength
    || Number(fallback || 0)
);

const isLowRiskCandidate = (riskLevel) => ['绿色', '黄色'].includes(riskLevel);

const rankPipeCandidates = (first, second) => (
    riskOrder[first.riskLevel] - riskOrder[second.riskLevel]
    || first.stressRatio - second.stressRatio
    || first.weightPerMeter - second.weightPerMeter
);

export const evaluatePipeSelectionScenario = (state = {}, scenarios = PIPE_SELECTION_SCENARIOS) => {
    const scenario = scenarios.find((item) => item.id === state.scenarioId) || null;
    const material = state.material || 'X80';
    const yieldStrength = getMaterialYieldStrength(material, state.yieldStrength);
    const safetyFactor = Number(state.safetyFactor || 0.9);
    const allowableStress = calculateAllowableStress(yieldStrength, safetyFactor);

    if (!scenario) {
        return {
            scenario: null,
            material,
            yieldStrength,
            safetyFactor,
            allowableStress,
            candidates: [],
            recommendedCandidate: null,
            referenceCandidate: null,
            conclusionLevel: '红色',
            riskReason: '当前工况暂无表格数据，不能给出工程结论',
            summarySuggestion: '请选择表格中已有的提升管道选型工况。'
        };
    }

    const candidates = scenario.pipes.map((pipe) => {
        const judged = judgeRiskLevel(pipe.combinedStress, yieldStrength, safetyFactor);
        const safetyMargin = calculateSafetyMargin(allowableStress, pipe.combinedStress);
        const stressRatio = allowableStress
            ? Number((pipe.combinedStress / allowableStress).toFixed(3))
            : 0;

        return {
            ...pipe,
            material,
            yieldStrength,
            safetyFactor,
            allowableStress,
            safetyMargin,
            stressRatio,
            riskLevel: judged.riskLevel,
            riskReason: judged.riskReason,
            suggestion: judged.suggestion
        };
    });

    const safeCandidates = candidates
        .filter((item) => isLowRiskCandidate(item.riskLevel))
        .sort((first, second) => second.safetyMargin - first.safetyMargin || first.weightPerMeter - second.weightPerMeter);
    const referenceCandidate = [...candidates].sort(rankPipeCandidates)[0] || null;
    const recommendedCandidate = safeCandidates[0] || null;
    const conclusionLevel = recommendedCandidate?.riskLevel || referenceCandidate?.riskLevel || '红色';
    const riskReason = recommendedCandidate
        ? `${recommendedCandidate.size} 综合应力满足许用应力控制要求，安全余量 ${recommendedCandidate.safetyMargin.toFixed(3)} MPa`
        : `候选管径均未达到绿色或黄色区间，最低风险管径为 ${referenceCandidate?.size || '--'}（${referenceCandidate?.riskLevel || '--'}）`;
    const summarySuggestion = recommendedCandidate
        ? `推荐 ${recommendedCandidate.size}。该管径在当前材料和安全系数下满足作业控制要求。`
        : `当前材料 ${material}、安全系数 ${safetyFactor} 下暂无推荐管径，不建议作为正常作业方案。`;

    return {
        scenario,
        material,
        yieldStrength,
        safetyFactor,
        allowableStress,
        candidates,
        recommendedCandidate,
        referenceCandidate,
        conclusionLevel,
        riskReason,
        summarySuggestion
    };
};

const normalizeSelectionTopCondition = (value) => (
    String(value || '').includes('8') ? '顶端方向节8度' : '顶端固支'
);

const findConservativeSelectionScenario = ({ depth, topCondition, seaState }, scenarios = PIPE_SELECTION_SCENARIOS) => {
    const normalizedDepth = Number(depth);
    const normalizedCondition = normalizeSelectionTopCondition(topCondition);
    const normalizedSeaState = Number(seaState);
    const sameDepth = scenarios.filter((item) => Number(item.depth) === normalizedDepth);
    const sameCondition = sameDepth.filter((item) => normalizeSelectionTopCondition(item.topCondition) === normalizedCondition);
    const candidates = sameCondition.length ? sameCondition : sameDepth;

    if (!candidates.length || !Number.isFinite(normalizedSeaState)) {
        return {
            scenario: null,
            matchType: '无匹配',
            exceeded: false
        };
    }

    const ordered = [...candidates].sort((first, second) => first.seaState - second.seaState);
    const exact = ordered.find((item) => item.seaState === normalizedSeaState);
    if (exact) {
        return {
            scenario: exact,
            matchType: '完全匹配',
            exceeded: false
        };
    }

    const conservative = ordered.find((item) => item.seaState > normalizedSeaState);
    if (conservative) {
        return {
            scenario: conservative,
            matchType: '保守匹配',
            exceeded: false
        };
    }

    return {
        scenario: ordered[ordered.length - 1],
        matchType: '超出表格范围',
        exceeded: true
    };
};

export const evaluatePipeSelectionForMetocean = (state = {}, metocean = {}, scenarios = PIPE_SELECTION_SCENARIOS) => {
    const currentForecast = metocean.currentForecast || {};
    const seaState = metocean.seaState || deriveSeaStateFromWaveHeight(currentForecast.waveHeight);
    const matched = findConservativeSelectionScenario({
        depth: state.depth,
        topCondition: state.topCondition,
        seaState: seaState.code
    }, scenarios);
    const base = evaluatePipeSelectionScenario({
        ...state,
        scenarioId: matched.scenario?.id
    }, scenarios);
    const site = metocean.site || null;
    const flowDataAvailable = Boolean(metocean.flowDataAvailable);
    const hasWaveData = seaState.code !== null;
    const canRecommend = Boolean(matched.scenario) && hasWaveData && !matched.exceeded;
    const dataCompleteness = flowDataAvailable ? '风浪流数据完整' : '风浪数据可用，流速待补充';
    const selectedScenarioText = matched.scenario
        ? `${matched.scenario.depth}米 · ${matched.scenario.seaState}级海况 · ${matched.scenario.topCondition}`
        : '暂无可用参考工况';
    const currentConditionText = seaState.code === null
        ? '暂无有效浪高，无法自动识别海况'
        : `${seaState.code}级海况 · ${seaState.label} · 浪高 ${Number(currentForecast.waveHeight).toFixed(1)} m`;

    let recommendedCandidate = canRecommend ? base.recommendedCandidate : null;
    let conclusionLevel = base.conclusionLevel;
    let riskReason = base.riskReason;
    let summarySuggestion = base.summarySuggestion;

    if (!hasWaveData) {
        conclusionLevel = '红色';
        riskReason = '当前矿区暂无有效浪高数据，无法匹配选型表';
        summarySuggestion = '请等待矿区风浪预报数据更新后再生成管道评估。';
    } else if (matched.exceeded) {
        recommendedCandidate = null;
        conclusionLevel = '红色';
        riskReason = `自动识别为${seaState.code}级海况，已超出当前选型表最高5级海况范围`;
        summarySuggestion = '当前海况超出已有选型表范围，暂停推荐管径，需要补充工程校核。';
    } else if (matched.matchType === '保守匹配') {
        riskReason = `${base.riskReason}；自动识别为${seaState.code}级海况，采用${matched.scenario.seaState}级表格进行保守评估`;
        summarySuggestion = `${base.summarySuggestion} 当前使用更高一级已有表格进行保守参考。`;
    }

    return {
        ...base,
        scenario: matched.scenario,
        recommendedCandidate,
        conclusionLevel,
        riskReason,
        summarySuggestion,
        site,
        metocean,
        seaState,
        matchType: matched.matchType,
        canRecommend,
        flowDataAvailable,
        dataCompleteness,
        currentConditionText,
        selectedScenarioText
    };
};

export const elevateRiskLevel = (riskLevel, minimumLevel) => (
    riskOrder[riskLevel] >= riskOrder[minimumLevel] ? riskLevel : minimumLevel
);

export const applyTyphoonRule = (riskLevel, forecast = {}) => {
    let nextLevel = riskLevel;
    const reasons = [];
    const distance = Number(forecast.typhoonDistance);
    const typhoonLevel = String(forecast.typhoonLevel || '');

    if (typhoonLevel === '严重') {
        nextLevel = '红色';
        reasons.push('台风影响等级为严重');
    } else if (typhoonLevel === '影响') {
        nextLevel = elevateRiskLevel(nextLevel, '橙色');
        reasons.push('台风影响等级达到影响');
    }

    if (Number.isFinite(distance) && distance < 300) {
        nextLevel = '红色';
        reasons.push('台风距离小于300 km');
    } else if (Number.isFinite(distance) && distance < 500) {
        nextLevel = elevateRiskLevel(nextLevel, '橙色');
        reasons.push('台风距离小于500 km');
    }

    return {
        riskLevel: nextLevel,
        typhoonReason: reasons.join('；')
    };
};

const normalizeConstraint = (value) => {
    const text = String(value || '').trim();
    if (text.includes('固')) return '固定';
    if (text.includes('8')) return '方向节释放8°';
    return text;
};

const getMatchScore = (config, forecast, threshold) => {
    const depthScore = Math.abs(Number(config.waterDepth || 0) - Number(threshold.waterDepth || 0)) / 100;
    const pipeScore = config.pipeSize === threshold.pipeSize ? 0 : 120;
    const constraintScore = normalizeConstraint(config.topConstraint) === normalizeConstraint(threshold.topConstraint) ? 0 : 80;
    const seaStateScore = Math.abs(Number(forecast.seaState || 0) - Number(threshold.seaState || 0)) * 30;
    const surfaceScore = Math.abs(Number(forecast.surfaceCurrent || 0) - Number(threshold.surfaceCurrent || 0)) * 20;
    const bottomScore = Math.abs(Number(forecast.bottomCurrent || 0) - Number(threshold.bottomCurrent || 0)) * 40;

    return Number((depthScore + pipeScore + constraintScore + seaStateScore + surfaceScore + bottomScore).toFixed(3));
};

export const matchNearestThreshold = (config, forecast, thresholdList = []) => {
    if (!thresholdList.length) {
        return { threshold: null, matchType: '无匹配', matchScore: 0 };
    }

    const ranked = [...thresholdList]
        .map((threshold) => ({
            threshold,
            matchScore: getMatchScore(config, forecast, threshold)
        }))
        .sort((first, second) => first.matchScore - second.matchScore);

    const best = ranked[0];
    const threshold = best.threshold;
    const isExact = (
        Number(config.waterDepth) === Number(threshold.waterDepth)
        && config.pipeSize === threshold.pipeSize
        && normalizeConstraint(config.topConstraint) === normalizeConstraint(threshold.topConstraint)
        && Number(forecast.seaState) === Number(threshold.seaState)
        && Math.abs(Number(forecast.surfaceCurrent) - Number(threshold.surfaceCurrent)) <= 0.02
        && Math.abs(Number(forecast.bottomCurrent) - Number(threshold.bottomCurrent)) <= 0.02
    );

    return {
        threshold,
        matchType: isExact ? '完全匹配' : '近似匹配',
        matchScore: best.matchScore
    };
};

export const evaluateCurrentRisk = (config, forecast, thresholdList = []) => {
    const matched = matchNearestThreshold(config, forecast, thresholdList);
    const threshold = matched.threshold;
    const estimatedStress = Number(threshold?.topEquivalentStress || 0);
    const yieldStrength = Number(config?.yieldStrength || threshold?.yieldStrength || 0);
    const safetyFactor = Number(config?.safetyFactor || threshold?.safetyFactor || 0.9);
    const allowableStress = calculateAllowableStress(yieldStrength, safetyFactor);
    const safetyMargin = calculateSafetyMargin(allowableStress, estimatedStress);
    const baseRisk = judgeRiskLevel(estimatedStress, yieldStrength, safetyFactor);
    const typhoonRisk = applyTyphoonRule(baseRisk.riskLevel, forecast);
    const riskReason = [baseRisk.riskReason, typhoonRisk.typhoonReason, matched.matchType === '近似匹配' ? '采用最接近工况阈值评估' : '采用完全匹配工况阈值评估']
        .filter(Boolean)
        .join('；');

    return {
        config,
        forecast,
        matchedThreshold: threshold,
        matchType: matched.matchType,
        matchScore: matched.matchScore,
        estimatedStress,
        yieldStrength,
        safetyFactor,
        allowableStress,
        safetyMargin,
        riskLevel: typhoonRisk.riskLevel,
        riskReason,
        suggestion: adviceByRisk[typhoonRisk.riskLevel],
        createdAt: new Date().toISOString()
    };
};

const parseForecastTime = (value) => {
    if (!value) return null;
    return new Date(String(value).replace(' ', 'T'));
};

const diffHours = (start, end) => {
    const startDate = parseForecastTime(start);
    const endDate = parseForecastTime(end);
    if (!startDate || !endDate) return 0;
    return Math.max(0, Math.round((endDate - startDate) / 36e5));
};

const isSafeForOperation = (level) => ['绿色', '黄色'].includes(level);

const buildAvailableWindows = (results) => {
    const windows = [];
    let start = null;
    let last = null;

    results.forEach((result, index) => {
        if (isSafeForOperation(result.riskLevel)) {
            if (!start) start = result;
            last = result;
        }

        const next = results[index + 1];
        if (start && (!next || !isSafeForOperation(next.riskLevel))) {
            windows.push({
                startTime: start.forecast.forecastTime,
                endTime: last.forecast.forecastTime,
                durationHours: diffHours(start.forecast.forecastTime, last.forecast.forecastTime) + 3,
                riskLevels: [...new Set(results
                    .filter((item) => item.forecast.forecastTime >= start.forecast.forecastTime && item.forecast.forecastTime <= last.forecast.forecastTime)
                    .map((item) => item.riskLevel))]
            });
            start = null;
            last = null;
        }
    });

    return windows;
};

export const generateOperationAdvice = (config, riskResults = []) => {
    const operationType = config?.operationType || '布放';
    const availableWindows = buildAvailableWindows(riskResults);
    const highRisk = riskResults.find((item) => ['橙色', '红色'].includes(item.riskLevel));
    const redRisk = riskResults.find((item) => item.riskLevel === '红色');
    const firstTime = riskResults[0]?.forecast?.forecastTime;
    const earliestHighRiskTime = highRisk?.forecast?.forecastTime || '';
    const hoursToHighRisk = earliestHighRiskTime && firstTime ? diffHours(firstTime, earliestHighRiskTime) : Number.POSITIVE_INFINITY;
    const depth = Number(config?.waterDepth || 0);
    const deployNeed = depth >= 6000 ? 48 : Number(config?.deployDurationHours || 36);
    const recoverNeed = Number(config?.recoverDurationHours || 0) + Number(config?.evacuationBufferHours || 0);
    const evacuationNeed = Number(config?.evacuationBufferHours || 0);
    const bestWindow = [...availableWindows].sort((a, b) => b.durationHours - a.durationHours)[0];

    if (operationType === '布放') {
        const enoughWindow = availableWindows.find((window) => window.durationHours >= deployNeed);
        return enoughWindow
            ? `未来72小时存在满足${depth}米管道布放要求的连续${deployNeed}小时安全窗口，可优先选择 ${enoughWindow.startTime} 至 ${enoughWindow.endTime}。`
            : `未来72小时内不存在满足${depth}米管道布放要求的连续${deployNeed}小时安全窗口，建议推迟布放。${bestWindow ? `当前较长安全窗口为 ${bestWindow.startTime} 至 ${bestWindow.endTime}，仍不足布放需求。` : '当前预报时段内未形成连续安全窗口。'}`;
    }

    if (operationType === '采矿') {
        const redIn24h = redRisk && diffHours(firstTime, redRisk.forecast.forecastTime) <= 24;
        const orangeIn24h = highRisk && diffHours(firstTime, highRisk.forecast.forecastTime) <= 24;
        if (redIn24h) return '未来24小时内出现红色风险，建议停止采矿并启动回收。';
        if (orangeIn24h) return '未来24小时内出现橙色风险，建议降低作业强度并准备回收。';
        return '当前及未来24小时处于可控风险区间，可以继续采矿并保持监测。';
    }

    if (operationType === '回收') {
        return hoursToHighRisk < recoverNeed
            ? `最早高风险到达时间不足${recoverNeed}小时回收撤离需求，需立即进入红色响应。`
            : `预计仍有不少于${recoverNeed}小时回收撤离窗口，可按预案组织回收。`;
    }

    if (operationType === '撤离') {
        return hoursToHighRisk < evacuationNeed
            ? `最早高风险到达时间不足${evacuationNeed}小时撤离缓冲，建议立即撤离。`
            : `撤离缓冲时间满足要求，建议保持待命并跟踪下一轮预报。`;
    }

    return '请根据当前风险等级执行对应作业控制措施。';
};

export const evaluateRiskWindow = (config, forecastList = [], thresholdList = []) => {
    const results = forecastList.map((forecast) => evaluateCurrentRisk(config, forecast, thresholdList));
    const availableWindows = buildAvailableWindows(results);
    const earliestHighRiskTime = results.find((item) => ['橙色', '红色'].includes(item.riskLevel))?.forecast?.forecastTime || '';

    return {
        results,
        availableWindows,
        earliestHighRiskTime,
        summarySuggestion: generateOperationAdvice(config, results)
    };
};
