import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {percentile,summarizePhases} from './lib/mapBaselineStatistics.mjs';

assert.equal(percentile([],0.95),null);
assert.equal(percentile([16,18,20,NaN,28],.95),28);
assert.equal(percentile([-1,Infinity],.95),null);
assert.throws(()=>percentile([1],1.2),RangeError);
const report=summarizePhases([
  {frameDurationsMs:[16,17,18],longTasksMs:[56,201],lcpMs:900},
  {frameDurationsMs:[16,21,27],longTasksMs:[89],lcpMs:1100}
]);
assert.equal(report.phases,2);
assert.equal(report.sampleFrames,6);
assert.equal(report.frameP95Ms,27);
assert.equal(report.longTasksOver200Ms,1);
assert.equal(report.maxLongTaskMs,201);
assert.equal(report.lcpLatestMs,1100);
assert.equal(report.baselineKind,'synthetic-vite-fixture-not-field-CWV');

const qa=readFileSync(new URL('./verify-unified-map-browser-0985167.mjs',import.meta.url),'utf8');
for(const token of ['installMapBrowserProbe','snapshotMapBrowserProbe','summarizePhases','MID_MAP_RUNTIME_BASELINE'])
  assert.ok(qa.includes(token),'Map QA browser benchmark not wired: '+token);
console.log('MID .210: deterministic synthetic map-profile statistics and browser wiring verified');
