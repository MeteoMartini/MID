import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [panel,worker]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
assert.match(worker,/async function latestDwdSatelliteProductTime\(\)/,'worker must resolve an actual DWD satellite source timestamp');
assert.match(worker,/dwdPrecipitationTypeSourceIndexes\(\)/,'DWD OpenData satellite index must be used as timestamp source');
assert.match(worker,/dwdSourceIndexEntries\(indexes\.satellite,'satellite'\)/,'satellite data times must be parsed from the DWD source index');
assert.match(worker,/row\.dataTime<=now\+5\*60000&&row\.dataTime>=now-6\*3600000/,'satellite timestamp must be bounded to a plausible live window');
assert.match(worker,/const frameTime=sourceTime/,'actual source timestamp must not be rounded to an artificial 3-hour slot');
assert.doesNotMatch(worker,/Math\.floor\(sourceTime\/\(3\*3600000\)\)/,'3-hour rounding of satellite timestamp must stay removed');
assert.match(worker,/latestTime:new Date\(frameTime\)\.toISOString\(\)/,'actual satellite source time must be exposed as latestTime');
assert.match(panel,/satelliteLatestSeconds=satelliteLatestIso\?Math\.floor\(Date\.parse\(satelliteLatestIso\)\/1000\):referenceSeconds/,'untimed WMS snapshot must carry the source timestamp');
assert.match(panel,/frame:\{time:satelliteLatestSeconds,iso:satelliteLatestIso\|\|''\}/,'satellite blend frame must use that timestamp');
assert.match(panel,/blendStamp\(satelliteBlend,referenceSeconds,timezone,latestSatelliteTime\)/,'legend must derive Stand from the satellite product timestamp');
assert.doesNotMatch(panel,/Zeit nicht ausgewiesen/,'old no-timestamp placeholder must remain removed');
console.log('ok - DWD latest WMS snapshot is labelled from actual DWD satellite source time, without fake 3-hour rounding');
