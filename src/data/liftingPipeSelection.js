export const PIPE_SELECTION_SCENARIOS = [
    {
        id: 'depth5200-sea3-fixed',
        label: '5200米 · 3级海况',
        depth: 5200,
        seaState: 3,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        topCondition: '顶端固支',
        pipes: [
            { size: '10 3/4', outerDiameter: 273.05, innerDiameter: 232.6, wallThickness: 20.24, weightPerMeter: 111.93, topTension: 6696.126, topMoment: 118.582, combinedStress: 527.613 },
            { size: '11 3/4', outerDiameter: 298.45, innerDiameter: 268.9, wallThickness: 14.78, weightPerMeter: 103.4, topTension: 5916.745, topMoment: 144.478, combinedStress: 605.998 }
        ]
    },
    {
        id: 'depth5200-sea4-fixed',
        label: '5200米 · 4级海况',
        depth: 5200,
        seaState: 4,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        topCondition: '顶端固支',
        pipes: [
            { size: '10 3/4', outerDiameter: 273.05, innerDiameter: 232.6, wallThickness: 20.24, weightPerMeter: 111.93, topTension: 6788.246, topMoment: 341.34, combinedStress: 757.377 },
            { size: '11 3/4', outerDiameter: 298.45, innerDiameter: 268.9, wallThickness: 14.78, weightPerMeter: 103.4, topTension: 5845.64, topMoment: 356.362, combinedStress: 827.729 }
        ]
    },
    {
        id: 'depth5200-sea5-fixed',
        label: '5200米 · 5级海况',
        depth: 5200,
        seaState: 5,
        surfaceCurrent: 0.8,
        bottomCurrent: 0.1,
        topCondition: '顶端固支',
        pipes: [
            { size: '10 3/4', outerDiameter: 273.05, innerDiameter: 232.6, wallThickness: 20.24, weightPerMeter: 111.93, topTension: 6962.692, topMoment: 631.701, combinedStress: 1079.268 },
            { size: '11 3/4', outerDiameter: 298.45, innerDiameter: 268.9, wallThickness: 14.78, weightPerMeter: 103.4, topTension: 6058.98, topMoment: 642.1, combinedStress: 1171.771 }
        ]
    },
    {
        id: 'depth6000-sea5-angle8',
        label: '6000米 · 5级海况',
        depth: 6000,
        seaState: 5,
        surfaceCurrent: 1.2,
        bottomCurrent: 0.2,
        topCondition: '顶端方向节8度',
        pipes: [
            { size: '10 3/4', outerDiameter: 273.05, innerDiameter: 232.6, wallThickness: 20.24, weightPerMeter: 111.93, topTension: 8492.751, topMoment: 54.779, combinedStress: 576.34 },
            { size: '11 3/4', outerDiameter: 298.45, innerDiameter: 268.9, wallThickness: 14.78, weightPerMeter: 103.4, topTension: 7582.911, topMoment: 64.197, combinedStress: 615.096 },
            { size: '13 3/8', outerDiameter: 339.72, innerDiameter: 313.6, wallThickness: 13.06, weightPerMeter: 105.21, topTension: 8262.707, topMoment: 69.502, combinedStress: 647.451 }
        ]
    }
];

export const PIPE_SELECTION_MATERIALS = [
    { key: 'X80', label: 'X80', yieldStrength: 580 },
    { key: 'X110', label: 'X110', yieldStrength: 780 }
];

export const DEFAULT_PIPE_SELECTION_STATE = {
    scenarioId: 'depth5200-sea3-fixed',
    depth: 5200,
    topCondition: '顶端固支',
    siteId: '',
    material: 'X80',
    safetyFactor: 0.9
};

export const PIPE_SELECTION_METRICS = [
    { key: 'outerDiameter', label: '外径', unit: 'mm', digits: 2 },
    { key: 'innerDiameter', label: '内径', unit: 'mm', digits: 1 },
    { key: 'wallThickness', label: '壁厚', unit: 'mm', digits: 2 },
    { key: 'weightPerMeter', label: '米重', unit: 'kg/m', digits: 2 },
    { key: 'topTension', label: '顶端张力', unit: 'kN', digits: 3 },
    { key: 'topMoment', label: '顶端弯矩', unit: 'kN.m', digits: 3 },
    { key: 'combinedStress', label: '综合应力', unit: 'MPa', digits: 3 }
];
