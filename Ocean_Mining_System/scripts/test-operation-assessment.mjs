import assert from 'node:assert/strict';
import { assessOperationSystem as assess, loadOperationLimits, saveOperationLimits } from '../src/utils/mining/operationAssessment.js';
import { schematicHeight, MOORING_DEPTH, MOORING_TICKS } from '../src/utils/mining/buoySchematic.js';

const rows = [
  { forecastTime: '2026-11-15T00:00:00', waveHeight: 3, currentSpeed: 2 },
  { forecastTime: '2026-11-15T03:00:00', waveHeight: null, currentSpeed: 2 },
  { forecastTime: '2026-11-15T06:00:00', waveHeight: 4, currentSpeed: 2 }
];
const surface = assess('surface', { windSpeed: 15, gust: 18, waveHeight: 3, currentSpeed: 1 }, rows);
assert.equal(surface.level, '超限');
assert.equal(surface.checks.find(check => check.key === 'waveHeight').exceededCount, 2);
assert.equal(surface.checks.find(check => check.key === 'waveHeight').windows.length, 2);
assert.equal(surface.incomplete, true);
const collection = assess('collection', { bottomCurrentSpeed: 1 }, rows);
assert.equal(collection.checks[0].peak, null, 'Surface currents must never stand in for bottom currents');
assert.equal(collection.level, '未完成');
assert.equal(assess('collection', { bottomCurrentSpeed: 0 }, rows).checks[0].status, '阈值无效');
assert.equal(assess('collection', {}, rows).level, '未配置');
const bottomRow = { forecastTime: '2026-11-15T00:00:00', bottomCurrentSpeed: 0 };
assert.equal(assess('collection', { bottomCurrentSpeed: 1 }, [bottomRow]).level, '未超限');
assert.equal(assess('collection', { bottomCurrentSpeed: 1 }, [{ ...bottomRow, bottomCurrentSpeed: null }]).level, '未完成');
const spaced = [0, 3, 12].map(hour => ({ forecastTime: `2026-11-15T${String(hour).padStart(2, '0')}:00:00`, bottomCurrentSpeed: 2 }));
assert.equal(assess('collection', { bottomCurrentSpeed: 1 }, spaced).windows.length, 2, 'Do not bridge missing forecast periods');

const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
const limits = loadOperationLimits({ id: 1, siteCode: 'APEI-01' }, [{ miningAreaId: 'APEI-01', waveHeightThreshold: 2.5 }]);
assert.equal(limits.surface.waveHeight, 2.5);
limits.collection.bottomCurrentSpeed = .7;
saveOperationLimits(1, limits);
assert.equal(loadOperationLimits({ id: 1 }).collection.bottomCurrentSpeed, .7);
assert.equal(loadOperationLimits({ id: 2 }).collection.bottomCurrentSpeed, .2, 'Other mines use the reference, not another mine’s override');
assert.equal(loadOperationLimits({ id: 2 }).surface.gust, 17.2);
store.set('MINING_OPERATION_LIMITS_V1', JSON.stringify({3:{surface:{windSpeed:12,gust:'',waveHeight:2,currentSpeed:.8},collection:{bottomCurrentSpeed:''}}}));
const migrated = loadOperationLimits({id:3});
assert.deepEqual(migrated.surface,{windSpeed:12,gust:17.2,waveHeight:2,currentSpeed:.8}, 'Fill old unconfigured fields and preserve custom limits');
assert.equal(migrated.collection.bottomCurrentSpeed,.2);
migrated.collection.bottomCurrentSpeed = '';
saveOperationLimits(3,migrated);
assert.equal(loadOperationLimits({id:3}).collection.bottomCurrentSpeed,'', 'An explicitly cleared new setting stays unconfigured');
assert.equal(assess('collection',{bottomCurrentSpeed:.2},[{...bottomRow,bottomCurrentSpeed:.199}]).level,'未超限');
assert.equal(assess('collection',{bottomCurrentSpeed:.2},[{...bottomRow,bottomCurrentSpeed:.2}]).level,'超限');
store.set('MINING_OPERATION_LIMITS_V1', '{bad json');
assert.equal(loadOperationLimits({ id: 1 }).surface.waveHeight, 3);

assert.equal(schematicHeight(1), 1);
assert.equal(schematicHeight(-1000), -1);
assert.equal(schematicHeight(-2000), -2);
assert.equal(schematicHeight(-MOORING_DEPTH), -3.5);
assert.ok(MOORING_TICKS.includes(-3500));
console.log('Operation assessment, independent mine settings and 3500 m scale checks passed.');
