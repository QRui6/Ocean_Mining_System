import { deriveSeaStateFromWaveHeight } from './pipelineMetoceanService.js';

const RISK_ORDER = {
    绿色: 0,
    黄色: 1,
    橙色: 2,
    红色: 3
};

const riskMeta = {
    绿色: {
        title: '可以继续作业',
        shortTitle: '继续作业',
        tone: 'green',
        summary: '风险可控，保持监测。',
        actionItems: ['保持常规监测', '按当前工况继续跟踪风浪流变化']
    },
    黄色: {
        title: '谨慎继续作业',
        shortTitle: '谨慎作业',
        tone: 'yellow',
        summary: '可以作业，加强监测。',
        actionItems: ['加强风浪流监测', '确认管道回收准备状态', '下一轮预报更新后复核结论']
    },
    橙色: {
        title: '准备撤收管道',
        shortTitle: '准备撤收',
        tone: 'orange',
        summary: '暂停新作业，准备回收。',
        actionItems: ['暂停新一轮布放或采矿', '检查回收设备和甲板固定条件', '确认返航和避险预案']
    },
    红色: {
        title: '建议撤收管道',
        shortTitle: '立即处置',
        tone: 'red',
        summary: '停止作业，启动预案。',
        actionItems: ['停止当前作业', '启动管道回收或撤离预案', '持续跟踪高风险到达时间']
    }
};

const missingDecisionData = [
    {
        key: 'distance',
        label: '矿区距离',
        endpoint: 'GET /api/mining-overview/sites/{siteId}/decision-support',
        fields: 'basePort、distance.value、distance.unit、distance.method'
    },
    {
        key: 'vessel',
        label: '船舶吨位与航速',
        endpoint: 'GET /api/mining-overview/sites/{siteId}/decision-support',
        fields: 'vessel.name、deadweightTonnage、grossTonnage、normalSpeed、returnSpeed'
    },
    {
        key: 'pipelineRecovery',
        label: '管道回收时间',
        endpoint: 'GET /api/mining-overview/sites/{siteId}/decision-support',
        fields: 'pipelineRecovery.recoverHours、prepareHours、safetyBufferHours、totalRequiredHours'
    },
    {
        key: 'navigation',
        label: '航行时间与返航速度',
        endpoint: 'GET /api/mining-overview/sites/{siteId}/decision-support',
        fields: 'navigation.estimatedOutboundHours、estimatedReturnHours、returnSpeed、speedUnit'
    }
];

const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const formatMetric = (value, digits, unit) => {
    const numberValue = toNumberOrNull(value);
    return numberValue === null ? '--' : `${numberValue.toFixed(digits)} ${unit}`;
};

const normalizeRiskLevel = (level) => (
    Object.prototype.hasOwnProperty.call(RISK_ORDER, level) ? level : '黄色'
);

const elevateRisk = (current, next) => (
    RISK_ORDER[next] > RISK_ORDER[current] ? next : current
);

const assessMetoceanRisk = (forecast = {}) => {
    let level = '绿色';
    const reasons = [];
    const windSpeed = toNumberOrNull(forecast.windSpeed ?? forecast.windSpeedAvg);
    const gust = toNumberOrNull(forecast.gust ?? forecast.gustMax);
    const waveHeight = toNumberOrNull(forecast.waveHeight ?? forecast.waveHeightAvg);
    const currentSpeed = toNumberOrNull(forecast.currentSpeed ?? forecast.currentSpeedAvg);
    const seaState = deriveSeaStateFromWaveHeight(waveHeight);

    if (seaState.code !== null) {
        if (seaState.code >= 6) {
            level = '红色';
            reasons.push(`${seaState.code}级海况超出当前管道选型表支持范围`);
        } else if (seaState.code >= 5) {
            level = elevateRisk(level, '橙色');
            reasons.push(`${seaState.code}级海况接近作业控制上限`);
        } else if (seaState.code >= 4) {
            level = elevateRisk(level, '黄色');
            reasons.push(`${seaState.code}级海况需要加强关注`);
        }
    }

    if (windSpeed !== null) {
        if (windSpeed >= 20) {
            level = elevateRisk(level, '红色');
            reasons.push(`风速 ${windSpeed.toFixed(1)} m/s 达到停止作业关注值`);
        } else if (windSpeed >= 15) {
            level = elevateRisk(level, '橙色');
            reasons.push(`风速 ${windSpeed.toFixed(1)} m/s 达到高风险关注值`);
        } else if (windSpeed >= 10) {
            level = elevateRisk(level, '黄色');
            reasons.push(`风速 ${windSpeed.toFixed(1)} m/s 接近关注区间`);
        }
    }

    if (gust !== null && gust >= 18) {
        level = elevateRisk(level, gust >= 24 ? '红色' : '橙色');
        reasons.push(`阵风 ${gust.toFixed(1)} m/s 偏高`);
    }

    if (waveHeight !== null) {
        if (waveHeight > 4) {
            level = elevateRisk(level, '红色');
            reasons.push(`浪高 ${waveHeight.toFixed(1)} m 超出常规作业范围`);
        } else if (waveHeight > 3) {
            level = elevateRisk(level, '橙色');
            reasons.push(`浪高 ${waveHeight.toFixed(1)} m 进入高风险区间`);
        } else if (waveHeight > 2.5) {
            level = elevateRisk(level, '黄色');
            reasons.push(`浪高 ${waveHeight.toFixed(1)} m 接近控制阈值`);
        }
    }

    if (currentSpeed !== null && currentSpeed > 1.2) {
        level = elevateRisk(level, currentSpeed > 2 ? '橙色' : '黄色');
        reasons.push(`流速 ${currentSpeed.toFixed(2)} m/s 偏高`);
    }

    return {
        level,
        reasons,
        seaState,
        metrics: {
            windSpeed,
            gust,
            waveHeight,
            currentSpeed
        }
    };
};

export const getDecisionToneClass = (tone) => ({
    green: 'decision-tone-green',
    yellow: 'decision-tone-yellow',
    orange: 'decision-tone-orange',
    red: 'decision-tone-red',
    muted: 'decision-tone-muted'
}[tone] || 'decision-tone-muted');

export const getMissingDecisionData = () => missingDecisionData;

export const buildPipelineOperationDecision = (evaluation = {}) => {
    const level = normalizeRiskLevel(evaluation.conclusionLevel);
    const meta = riskMeta[level];
    const currentForecast = evaluation.metocean?.currentForecast || {};
    const reasons = [
        evaluation.riskReason,
        evaluation.matchType ? `工况匹配：${evaluation.matchType}` : '',
        evaluation.flowDataAvailable ? '' : '当前流速数据未完整接入'
    ].filter(Boolean);
    const actionItems = [...meta.actionItems];

    if (!evaluation.canRecommend && level !== '红色') {
        actionItems.push('当前无推荐管径时，不应作为正常作业方案');
    }

    return {
        level,
        tone: meta.tone,
        title: meta.title,
        shortTitle: meta.shortTitle,
        summary: meta.summary,
        primaryReason: reasons[0] || meta.summary,
        canContinueOperation: ['绿色', '黄色'].includes(level),
        needRecoverPipeline: ['橙色', '红色'].includes(level),
        needImmediateRecovery: level === '红色',
        actionItems,
        reasons,
        metrics: [
            { label: '自动海况', value: evaluation.seaState?.code === null ? '--' : `${evaluation.seaState?.code}级 · ${evaluation.seaState?.label || ''}` },
            { label: '风速 / 阵风', value: `${formatMetric(currentForecast.windSpeed, 1, 'm/s')} / ${formatMetric(currentForecast.gust, 1, 'm/s')}` },
            { label: '浪高 / 周期', value: `${formatMetric(currentForecast.waveHeight, 1, 'm')} / ${formatMetric(currentForecast.wavePeriod, 1, 's')}` },
            { label: '流速', value: formatMetric(currentForecast.currentSpeed, 2, 'm/s') }
        ]
    };
};

export const buildWarningOperationDecision = (warning = {}) => {
    const level = normalizeRiskLevel(warning.warningLevel || warning.riskLevel);
    const meta = riskMeta[level];

    return {
        level,
        tone: meta.tone,
        title: meta.title,
        shortTitle: meta.shortTitle,
        summary: meta.summary,
        primaryReason: warning.riskReason || warning.message || meta.summary,
        canContinueOperation: ['绿色', '黄色'].includes(level),
        needRecoverPipeline: ['橙色', '红色'].includes(level),
        needImmediateRecovery: level === '红色',
        actionItems: meta.actionItems,
        reasons: [warning.riskReason, warning.message].filter(Boolean)
    };
};

export const buildMiningOverviewDecision = (area = {}) => {
    const historical = area.historical || {};
    const currentForecast = area.currentForecast || null;
    const latestIndex = Math.max(
        historical.windSpeed?.length || 0,
        historical.waveHeight?.length || 0,
        historical.currentSpeed?.length || 0
    ) - 1;
    const latestHistoricalForecast = latestIndex >= 0
        ? {
            windSpeed: historical.windSpeed?.[latestIndex],
            waveHeight: historical.waveHeight?.[latestIndex],
            currentSpeed: historical.currentSpeed?.[latestIndex]
        }
        : {};
    const latestForecast = currentForecast || latestHistoricalForecast;
    const hasAnyMetocean = Object.values(latestForecast).some((value) => toNumberOrNull(value) !== null);
    const metoceanRisk = assessMetoceanRisk(latestForecast);

    if (!hasAnyMetocean || area.dataStatus === 'placeholder') {
        return {
            level: '待接入',
            tone: 'muted',
            title: '等待作业数据接入',
            shortTitle: '待接入',
            summary: '当前矿区总览暂无可用于作业决策的风浪流、水深、船舶和回收时间数据。',
            canContinueOperation: false,
            needRecoverPipeline: false,
            actionItems: ['接入单矿区逐3小时风浪流预报', '补充船舶吨位、返航速度和管道回收时间', '接入矿区距离或标准航线距离'],
            reasons: ['矿区总览接口当前返回占位数据或未匹配到可用海深/风浪流记录'],
            missingData: missingDecisionData,
            metrics: [
                { label: '海况等级', value: '--' },
                { label: '风速', value: '--' },
                { label: '浪高', value: '--' },
                { label: '流速', value: '--' }
            ]
        };
    }

    const meta = riskMeta[metoceanRisk.level];

    return {
        level: metoceanRisk.level,
        tone: meta.tone,
        title: meta.title,
        shortTitle: meta.shortTitle,
        summary: metoceanRisk.reasons.length ? metoceanRisk.reasons.join('；') : meta.summary,
        canContinueOperation: ['绿色', '黄色'].includes(metoceanRisk.level),
        needRecoverPipeline: ['橙色', '红色'].includes(metoceanRisk.level),
        actionItems: meta.actionItems,
        reasons: metoceanRisk.reasons,
        missingData: missingDecisionData,
        metrics: [
            { label: '海况等级', value: metoceanRisk.seaState.code === null ? '--' : `${metoceanRisk.seaState.code}级 · ${metoceanRisk.seaState.label}` },
            { label: '风速', value: formatMetric(metoceanRisk.metrics.windSpeed, 1, 'm/s') },
            { label: '浪高', value: formatMetric(metoceanRisk.metrics.waveHeight, 1, 'm') },
            { label: '流速', value: formatMetric(metoceanRisk.metrics.currentSpeed, 2, 'm/s') }
        ]
    };
};
