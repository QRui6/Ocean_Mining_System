import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,v), removeItem:k=>store.delete(k) };
const {reconcileWarningLifecycle,clearWarningLifecycleHistory} = await import('../src/utils/warning/warningLifecycleService.js');
const now=new Date('2026-11-14T00:00:00Z');
const event={id:'test',status:'ACTIVE',source:'正式预警',validUntil:'2026-11-15T00:00:00Z'};
let result=reconcileWarningLifecycle([event],{formal:true},{now});
assert.equal(result.activeItems.length,1);
result=reconcileWarningLifecycle([],{formal:true},{now});
assert.equal(result.activeItems.length,1);
assert.equal(result.activeItems[0].stale,true);
assert.equal(result.events.length,0);
result=reconcileWarningLifecycle([{...event,validUntil:'2026-11-13T00:00:00Z'}],{formal:true},{now});
assert.equal(result.activeItems.length,1);
assert.equal(result.history[0].status,'ACTIVE');
result=reconcileWarningLifecycle([{...event,status:'RESOLVED'}],{formal:true},{now});
assert.equal(result.activeItems.length,0);
assert.equal(result.history[0].status,'RESOLVED');
clearWarningLifecycleHistory();

const { collectWarningCandidates } = await import('../src/utils/warning/warningCandidateService.js');
const { warningExportText } = await import('../src/utils/forecastReportText.js');
const station = { id: 43, label: '', lng: 156.15, lat: 19.68 };
const target = { id: 'BPHDCPMN1', name: '北京先驱', stations: [station] };
const date = '2026-10-28';
const summary = { baseDate: date, runCycle: 't12', stale: true, timeRange: '15d' };
const hourlyPoints = [
    ['08:00', 3.2], ['11:00', 4.0], ['14:00', 4.7], ['17:00', 3.8],
    ['20:00', 4.3], ['23:00', null]
].map(([time, waveMax]) => ({ date, time: `${date}T${time}:00+08:00`, waveMax }));
const rules = {
    wind: { warning: 20, critical: 25 },
    wave: { warning: 4, critical: 6 },
    ocean_current: { warning: 2 }
};
let detailedCalls = 0;
const fetchProduct = async (_area, _range, _station, options) => {
    if (options?.includeHourly) detailedCalls++;
    return { target, station, report: { summary, points: [{ date, waveMax: 4.7 }] }, hourlyPoints };
};
const scheduled = await collectWarningCandidates([target], rules, fetchProduct, now.getTime());
assert.equal(detailedCalls, 0);
assert.deepEqual(scheduled.items, []);
assert.deepEqual(scheduled.expiredItems, []);
const display = await collectWarningCandidates([target], rules, fetchProduct, now.getTime(), { includeExpired: true });
assert.deepEqual(display.items, []);
assert.equal(display.expiredItems.length, 2);
const [first, second] = display.expiredItems;
assert.equal(first.status, 'EXPIRED');
assert.equal(first.stale, true);
assert.equal(first.validFrom, `${date}T11:00:00+08:00`);
assert.equal(first.validUntil, `${date}T14:00:00+08:00`);
assert.equal(first.analysis.recoveredAt, `${date}T17:00:00+08:00`);
assert.equal(second.analysis.recoveredAt, '');
assert.equal(first.initialTimeUnverified, true);
assert.match(warningExportText(first), /浪高峰值：4.7 m；阈值：4 m/);
assert.match(warningExportText(first), /状态：已过期/);
assert.notEqual(first.id, second.id);
console.log('Warning lifecycle checks passed');
