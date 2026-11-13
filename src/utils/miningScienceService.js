const EARTH_RADIUS_NM = 3440.065;
const MS_TO_KNOT = 1.943844;

export const SCIENCE_RULE_SOURCES = [
    {
        key: 'seaState',
        label: 'WMO海况表',
        detail: '按WMO 3700海况码划分浪高等级'
    },
    {
        key: 'wind',
        label: '蒲福风级',
        detail: '按持续风速换算风级'
    },
    {
        key: 'safeSpeed',
        label: '安全航速',
        detail: '航速需考虑风、浪、流、吃水和水深'
    },
    {
        key: 'stability',
        label: '稳性原则',
        detail: '吨位不是稳性合格的唯一依据'
    }
];

export const SEA_STATE_RULES = [
    { code: 0, label: '无浪', minWave: 0, maxWave: 0, speedFactor: 1, risk: '低' },
    { code: 1, label: '微浪', minWave: 0, maxWave: 0.1, speedFactor: 0.99, risk: '低' },
    { code: 2, label: '小浪', minWave: 0.1, maxWave: 0.5, speedFactor: 0.96, risk: '低' },
    { code: 3, label: '轻浪', minWave: 0.5, maxWave: 1.25, speedFactor: 0.91, risk: '中' },
    { code: 4, label: '中浪', minWave: 1.25, maxWave: 2.5, speedFactor: 0.82, risk: '中' },
    { code: 5, label: '大浪', minWave: 2.5, maxWave: 4, speedFactor: 0.7, risk: '高' },
    { code: 6, label: '巨浪', minWave: 4, maxWave: 6, speedFactor: 0.55, risk: '高' },
    { code: 7, label: '狂浪', minWave: 6, maxWave: 9, speedFactor: 0.42, risk: '极高' },
    { code: 8, label: '狂涛', minWave: 9, maxWave: 14, speedFactor: 0.32, risk: '极高' },
    { code: 9, label: '怒涛', minWave: 14, maxWave: null, speedFactor: 0.2, risk: '极高' }
];

export const BEAUFORT_RULES = [
    { code: 0, label: '无风', minKn: 0, maxKn: 1 },
    { code: 1, label: '软风', minKn: 1, maxKn: 3 },
    { code: 2, label: '轻风', minKn: 4, maxKn: 6 },
    { code: 3, label: '微风', minKn: 7, maxKn: 10 },
    { code: 4, label: '和风', minKn: 11, maxKn: 16 },
    { code: 5, label: '清风', minKn: 17, maxKn: 21 },
    { code: 6, label: '强风', minKn: 22, maxKn: 27 },
    { code: 7, label: '疾风', minKn: 28, maxKn: 33 },
    { code: 8, label: '大风', minKn: 34, maxKn: 40 },
    { code: 9, label: '烈风', minKn: 41, maxKn: 47 },
    { code: 10, label: '狂风', minKn: 48, maxKn: 55 },
    { code: 11, label: '暴风', minKn: 56, maxKn: 63 },
    { code: 12, label: '飓风', minKn: 64, maxKn: null }
];

export const DEFAULT_MINING_SCIENCE_FORM = {
    startPoint: {
        lng: '',
        lat: ''
    },
    endPoint: {
        lng: '',
        lat: ''
    },
    vessel: {
        name: '采矿船',
        loadState: '满载',
        customLoadPercent: 100,
        lightshipTon: 26000,
        deadweightTonnage: 50000,
        grossTonnage: 65000,
        designLoadPercent: 85,
        designSpeedKn: 12,
        economySpeedKn: 10,
        returnSpeedKn: 10,
        minSafeSpeedKn: 3
    },
    environment: {
        seaState: 3,
        waveHeight: 1,
        windSpeedMs: 8,
        currentSpeedMs: 0.5,
        currentDirection: '逆流'
    },
    operation: {
        waterDepth: 5200,
        deployBaseHours: 6,
        deployHoursPer1000m: 5.8,
        recoverBaseHours: 8,
        recoverHoursPer1000m: 3.1,
        safetyBufferHours: 8
    },
    tonnageRules: [
        { seaState: 1, minDeadweightTonnage: 5000, minGrossTonnage: 8000, conclusion: '可作业' },
        { seaState: 2, minDeadweightTonnage: 12000, minGrossTonnage: 16000, conclusion: '可作业' },
        { seaState: 3, minDeadweightTonnage: 25000, minGrossTonnage: 35000, conclusion: '谨慎作业' },
        { seaState: 4, minDeadweightTonnage: 50000, minGrossTonnage: 65000, conclusion: '建议等待' },
        { seaState: 5, minDeadweightTonnage: 80000, minGrossTonnage: 100000, conclusion: '不建议作业' },
        { seaState: 6, minDeadweightTonnage: 120000, minGrossTonnage: 150000, conclusion: '停止作业' }
    ]
};

const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toRadians = (degree) => Number(degree) * Math.PI / 180;

export const formatNumber = (value, digits = 1) => {
    const numberValue = toNumberOrNull(value);
    return numberValue === null ? '--' : numberValue.toFixed(digits);
};

export const formatCoordinate = (value, positiveLabel) => {
    const numberValue = toNumberOrNull(value);
    if (numberValue === null) return '--';
    const negativeLabel = positiveLabel === 'E' ? 'W' : 'S';
    return `${Math.abs(numberValue).toFixed(4)}°${numberValue >= 0 ? positiveLabel : negativeLabel}`;
};

export const calculateDistanceNm = (firstPoint, secondPoint) => {
    const firstLng = toNumberOrNull(firstPoint?.lng);
    const firstLat = toNumberOrNull(firstPoint?.lat);
    const secondLng = toNumberOrNull(secondPoint?.lng);
    const secondLat = toNumberOrNull(secondPoint?.lat);

    if ([firstLng, firstLat, secondLng, secondLat].some((value) => value === null)) {
        return null;
    }

    const lat1 = toRadians(firstLat);
    const lat2 = toRadians(secondLat);
    const dLat = toRadians(secondLat - firstLat);
    const dLng = toRadians(secondLng - firstLng);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((EARTH_RADIUS_NM * c).toFixed(2));
};

export const deriveSeaStateFromWaveHeight = (waveHeight) => {
    const height = toNumberOrNull(waveHeight);
    if (height === null) {
        return SEA_STATE_RULES.find((item) => item.code === 3);
    }

    return SEA_STATE_RULES.find((item) => (
        item.maxWave === null
            ? height >= item.minWave
            : height <= item.maxWave
    )) || SEA_STATE_RULES[SEA_STATE_RULES.length - 1];
};

export const deriveBeaufortFromWindSpeed = (windSpeedMs) => {
    const speed = toNumberOrNull(windSpeedMs);
    if (speed === null) {
        return BEAUFORT_RULES[0];
    }

    const speedKn = speed * MS_TO_KNOT;
    return BEAUFORT_RULES.find((item) => (
        item.maxKn === null
            ? speedKn >= item.minKn
            : speedKn <= item.maxKn
    )) || BEAUFORT_RULES[BEAUFORT_RULES.length - 1];
};

const getLoadPercent = (vessel = {}) => {
    if (vessel.loadState === '空载') return 0;
    if (vessel.loadState === '半载') return 50;
    if (vessel.loadState === '满载') return 100;
    return clamp(Number(vessel.customLoadPercent || 0), 0, 120);
};

const getWindSpeedFactor = (beaufortCode) => {
    if (beaufortCode >= 10) return 0.62;
    if (beaufortCode >= 8) return 0.74;
    if (beaufortCode >= 6) return 0.86;
    if (beaufortCode >= 4) return 0.94;
    return 1;
};

const getCurrentAdjustmentKn = (environment = {}) => {
    const currentSpeed = toNumberOrNull(environment.currentSpeedMs) || 0;
    const speedKn = currentSpeed * MS_TO_KNOT;
    const directionFactor = {
        顺流: 0.55,
        横流: -0.12,
        逆流: -0.65
    }[environment.currentDirection] ?? 0;

    return speedKn * directionFactor;
};

export const estimateVesselSpeed = (form = {}) => {
    const vessel = form.vessel || {};
    const environment = form.environment || {};
    const loadPercent = getLoadPercent(vessel);
    const lightship = Math.max(1, Number(vessel.lightshipTon || 1));
    const deadweight = Math.max(0, Number(vessel.deadweightTonnage || 0));
    const currentDisplacement = lightship + deadweight * loadPercent / 100;
    const designLoadPercent = clamp(Number(vessel.designLoadPercent || 85), 1, 120);
    const designDisplacement = lightship + deadweight * designLoadPercent / 100;
    const displacementFactor = clamp((designDisplacement / currentDisplacement) ** (2 / 9), 0.82, 1.08);
    const seaStateRule = SEA_STATE_RULES.find((item) => item.code === Number(environment.seaState))
        || deriveSeaStateFromWaveHeight(environment.waveHeight);
    const beaufort = deriveBeaufortFromWindSpeed(environment.windSpeedMs);
    const seaStateFactor = seaStateRule.speedFactor;
    const windFactor = getWindSpeedFactor(beaufort.code);
    const currentAdjustment = getCurrentAdjustmentKn(environment);
    const economySpeed = Number(vessel.economySpeedKn || vessel.designSpeedKn || 0);
    const rawSpeed = economySpeed * displacementFactor * seaStateFactor * windFactor + currentAdjustment;
    const minSpeed = Number(vessel.minSafeSpeedKn || 0);
    const estimatedSpeed = clamp(rawSpeed, minSpeed, Number(vessel.designSpeedKn || 0) * 1.08 || 16);

    return {
        estimatedSpeed,
        loadPercent,
        currentDisplacement,
        displacementFactor,
        seaStateFactor,
        windFactor,
        currentAdjustment,
        seaStateRule,
        beaufort
    };
};

export const estimateOperationHours = (operation = {}) => {
    const depth = Math.max(0, Number(operation.waterDepth || 0));
    const depthUnit = depth / 1000;
    const deployHours = Number(operation.deployBaseHours || 0)
        + depthUnit * Number(operation.deployHoursPer1000m || 0);
    const recoverHours = Number(operation.recoverBaseHours || 0)
        + depthUnit * Number(operation.recoverHoursPer1000m || 0);

    return {
        deployHours,
        recoverHours,
        safetyBufferHours: Number(operation.safetyBufferHours || 0)
    };
};

export const evaluateTonnageSafety = (form = {}) => {
    const seaState = Number(form.environment?.seaState || 0);
    const rules = Array.isArray(form.tonnageRules) ? form.tonnageRules : [];
    const matchedRule = rules
        .filter((item) => Number(item.seaState) <= seaState)
        .sort((first, second) => Number(second.seaState) - Number(first.seaState))[0]
        || rules.find((item) => Number(item.seaState) === seaState)
        || null;
    const vessel = form.vessel || {};
    const deadweight = Number(vessel.deadweightTonnage || 0);
    const gross = Number(vessel.grossTonnage || 0);

    if (!matchedRule) {
        return {
            status: '数据不足',
            matchedRule: null,
            reasons: ['当前海况缺少吨位阈值']
        };
    }

    const deadweightOk = deadweight >= Number(matchedRule.minDeadweightTonnage || 0);
    const grossOk = gross >= Number(matchedRule.minGrossTonnage || 0);
    const status = deadweightOk && grossOk
        ? matchedRule.conclusion
        : '吨位不足';

    return {
        status,
        matchedRule,
        reasons: [
            deadweightOk ? '载重吨满足' : '载重吨不足',
            grossOk ? '总吨满足' : '总吨不足'
        ]
    };
};

const formatTagNumber = (value, digits = 0) => {
    const numberValue = toNumberOrNull(value);
    return numberValue === null ? '--' : numberValue.toFixed(digits);
};

const buildAssessmentConclusion = ({ hasRoute, seaStateRule, tonnage }) => {
    if (!hasRoute) {
        return '等待选点';
    }

    if (Number(seaStateRule?.code || 0) >= 6) {
        return '停止作业';
    }

    if (tonnage.status === '吨位不足') {
        return '吨位不足';
    }

    return tonnage.status || '数据不足';
};

const buildAssessmentDataTags = ({ hasRoute, voyageDistanceNm, seaStateRule, vessel, tonnage }) => {
    if (!hasRoute) {
        return ['等待地图选点'];
    }

    return [
        `${seaStateRule?.code ?? '--'}级海况`,
        tonnage.status || '数据不足',
        `载重吨${formatTagNumber(vessel.deadweightTonnage)}`,
        `航线${formatTagNumber(voyageDistanceNm)}海里`
    ];
};

export const buildMiningScienceAssessment = (form = {}) => {
    const speed = estimateVesselSpeed(form);
    const operation = estimateOperationHours(form.operation);
    const startPoint = form.startPoint || {};
    const endPoint = form.endPoint || {};
    const voyageDistanceNm = calculateDistanceNm(startPoint, endPoint);
    const vessel = form.vessel || {};
    const returnBaseSpeed = Number(vessel.returnSpeedKn || speed.estimatedSpeed || 0);
    const maxSpeed = Number(vessel.designSpeedKn || 0) * 1.08 || 16;
    speed.returnEstimatedSpeed = clamp(
        returnBaseSpeed * speed.displacementFactor * speed.seaStateFactor * speed.windFactor + speed.currentAdjustment,
        Number(vessel.minSafeSpeedKn || 0),
        maxSpeed
    );
    const voyageHours = voyageDistanceNm === null ? null : voyageDistanceNm / speed.estimatedSpeed;
    const returnHours = voyageDistanceNm === null
        ? null
        : voyageDistanceNm / Math.max(speed.returnEstimatedSpeed, 1);
    const outboundTotalHours = voyageHours === null
        ? null
        : voyageHours + operation.deployHours;
    const retreatTotalHours = returnHours === null
        ? null
        : returnHours + operation.recoverHours;
    const tonnage = evaluateTonnageSafety(form);
    const seaStateRule = SEA_STATE_RULES.find((item) => item.code === Number(form.environment?.seaState))
        || speed.seaStateRule;
    const hasRoute = voyageDistanceNm !== null;
    const conclusion = buildAssessmentConclusion({
        hasRoute,
        seaStateRule,
        tonnage
    });

    return {
        conclusion,
        speed,
        operation,
        tonnage,
        seaStateRule,
        distances: {
            voyageDistanceNm
        },
        timing: {
            voyageHours,
            returnHours,
            outboundTotalHours,
            retreatTotalHours
        },
        dataTags: buildAssessmentDataTags({
            hasRoute,
            voyageDistanceNm,
            seaStateRule,
            vessel,
            tonnage
        })
    };
};
