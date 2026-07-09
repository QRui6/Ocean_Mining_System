export const MATERIAL_STRENGTHS = {
    X80: 580,
    X110: 780
};

export const PIPE_SIZE_OPTIONS = [
    {
        pipeSize: '10 3/4',
        outerDiameter: 273.05,
        innerDiameter: 232.6,
        wallThickness: 20.24,
        unitWeight: 111.93
    },
    {
        pipeSize: '11 3/4',
        outerDiameter: 298.45,
        innerDiameter: 268.9,
        wallThickness: 14.78,
        unitWeight: 103.4
    },
    {
        pipeSize: '13 3/8',
        outerDiameter: 339.72,
        innerDiameter: 313.6,
        wallThickness: 13.06,
        unitWeight: 105.21
    }
];

export const DEFAULT_PIPELINE_CONFIGS = [
    {
        id: 1,
        projectName: '深海采矿试验项目',
        miningArea: 'CC区',
        waterDepth: 5200,
        pipeSize: '10 3/4',
        material: 'X80',
        yieldStrength: 580,
        safetyFactor: 0.9,
        topConstraint: '固定',
        operationType: '布放',
        deployDurationHours: 36,
        recoverDurationHours: 24,
        evacuationBufferHours: 12,
        enabled: true
    }
];

const createThreshold = ({
    id,
    waterDepth,
    seaState,
    surfaceCurrent,
    bottomCurrent,
    pipeSize,
    topConstraint,
    topTension,
    topBendingMoment,
    topEquivalentStress,
    remark
}) => {
    const pipe = PIPE_SIZE_OPTIONS.find((item) => item.pipeSize === pipeSize) || PIPE_SIZE_OPTIONS[0];
    const material = 'X80';
    const yieldStrength = MATERIAL_STRENGTHS[material];
    const safetyFactor = 0.9;
    const allowableStress = Number((yieldStrength * safetyFactor).toFixed(3));
    const riskLevel = topEquivalentStress <= allowableStress * 0.85
        ? '绿色'
        : topEquivalentStress <= allowableStress
            ? '黄色'
            : topEquivalentStress <= yieldStrength
                ? '橙色'
                : '红色';
    const adviceMap = {
        绿色: '可正常作业',
        黄色: '谨慎作业，加强监测',
        橙色: '暂停新一轮布放，准备回收方案',
        红色: '停止作业，启动回收或撤离预案'
    };

    return {
        id,
        waterDepth,
        seaState,
        surfaceCurrent,
        bottomCurrent,
        pipeSize,
        outerDiameter: pipe.outerDiameter,
        innerDiameter: pipe.innerDiameter,
        wallThickness: pipe.wallThickness,
        unitWeight: pipe.unitWeight,
        topConstraint,
        topTension,
        topBendingMoment,
        topEquivalentStress,
        material,
        yieldStrength,
        safetyFactor,
        allowableStress,
        riskLevel,
        operationAdvice: adviceMap[riskLevel],
        remark
    };
};

export const PIPELINE_THRESHOLD_DATA = [
    createThreshold({
        id: 1,
        waterDepth: 5200,
        seaState: 3,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '10 3/4',
        topConstraint: '固定',
        topTension: 6696.126,
        topBendingMoment: 118.582,
        topEquivalentStress: 527.613,
        remark: '5200米3级海况顶端固定工况'
    }),
    createThreshold({
        id: 2,
        waterDepth: 5200,
        seaState: 3,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '11 3/4',
        topConstraint: '固定',
        topTension: 5916.745,
        topBendingMoment: 144.478,
        topEquivalentStress: 605.998,
        remark: '5200米3级海况顶端固定工况'
    }),
    createThreshold({
        id: 3,
        waterDepth: 5200,
        seaState: 4,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '10 3/4',
        topConstraint: '固定',
        topTension: 6788.246,
        topBendingMoment: 341.34,
        topEquivalentStress: 757.377,
        remark: '5200米4级海况顶端固定工况'
    }),
    createThreshold({
        id: 4,
        waterDepth: 5200,
        seaState: 4,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '11 3/4',
        topConstraint: '固定',
        topTension: 5845.64,
        topBendingMoment: 356.362,
        topEquivalentStress: 827.729,
        remark: '5200米4级海况顶端固定工况'
    }),
    createThreshold({
        id: 5,
        waterDepth: 5200,
        seaState: 5,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '10 3/4',
        topConstraint: '固定',
        topTension: 6962.692,
        topBendingMoment: 631.701,
        topEquivalentStress: 1079.268,
        remark: '5200米5级海况顶端固定工况'
    }),
    createThreshold({
        id: 6,
        waterDepth: 5200,
        seaState: 5,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        pipeSize: '11 3/4',
        topConstraint: '固定',
        topTension: 6058.98,
        topBendingMoment: 642.1,
        topEquivalentStress: 1171.771,
        remark: '5200米5级海况顶端固定工况'
    }),
    createThreshold({
        id: 7,
        waterDepth: 6000,
        seaState: 5,
        surfaceCurrent: 1.2,
        bottomCurrent: 0.2,
        pipeSize: '10 3/4',
        topConstraint: '方向节释放8°',
        topTension: 8492.751,
        topBendingMoment: 54.779,
        topEquivalentStress: 576.34,
        remark: '6000米5级海况方向节释放8度工况'
    }),
    createThreshold({
        id: 8,
        waterDepth: 6000,
        seaState: 5,
        surfaceCurrent: 1.2,
        bottomCurrent: 0.2,
        pipeSize: '11 3/4',
        topConstraint: '方向节释放8°',
        topTension: 7582.911,
        topBendingMoment: 64.197,
        topEquivalentStress: 615.096,
        remark: '6000米5级海况方向节释放8度工况'
    }),
    createThreshold({
        id: 9,
        waterDepth: 6000,
        seaState: 5,
        surfaceCurrent: 1.2,
        bottomCurrent: 0.2,
        pipeSize: '13 3/8',
        topConstraint: '方向节释放8°',
        topTension: 8262.707,
        topBendingMoment: 69.502,
        topEquivalentStress: 647.451,
        remark: '6000米5级海况方向节释放8度工况'
    })
];
