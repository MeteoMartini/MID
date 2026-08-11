import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const phase=await readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
assert.match(phase,/function cellEchoSummary\(/,'radar/model phase overlay must sample echo coverage per cell');
assert.match(phase,/samplesPerAxis=3/,'phase overlay should sample several radar points inside each model cell');
assert.match(phase,/function radarBackedThermalPhase\(/,'strong radar echoes need a conservative thermal phase recovery path');
assert.match(phase,/wetBulb>=2/,'warm, radar-backed liquid phase recovery missing');
assert.match(phase,/subdivisions=1/,'model grid must not be visually subdivided');
assert.match(phase,/minimumDbz=phase\.phase==='snow'\|\|phase\.phase==='freezing'\?5:7/,'established echo thresholds must remain protected');
assert.match(phase,/phase\.phase==='uncertain'\|\|phase\.confidence==='eingeschränkt'/,'truly uncertain phases must remain transparent');
console.log('ok - precipitation-type echo recovery keeps phase safety while sampling radar echoes more robustly');
