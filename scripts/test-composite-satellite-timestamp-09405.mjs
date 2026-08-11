import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const panel=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
assert.match(panel,/satelliteLatestSeconds=satelliteLatestIso\?Math\.floor\(Date\.parse\(satelliteLatestIso\)\/1000\):referenceSeconds/,'untimed satellite snapshot must use actual latest satellite timestamp');
assert.match(panel,/frame:\{time:satelliteLatestSeconds,iso:satelliteLatestIso\|\|''\}/,'untimed satellite blend frame must carry the true snapshot time and ISO stamp');
assert.match(panel,/satelliteSnapshotLabel=satelliteLatestIso\?formatInZone\(Date\.parse\(satelliteLatestIso\),timezone,\{hour:'2-digit',minute:'2-digit'\}\):'kein Stand'/,'satellite snapshot label missing');
assert.match(panel,/satelliteUntimed\?\(satelliteLatestIso\?`DWD Snapshot · \$\{satelliteSnapshotLabel\}`:'DWD Snapshot'\):satelliteLatestIso\?satelliteSnapshotLabel:'aktuell'/,'legend/button detail must show actual DWD snapshot time');
assert.doesNotMatch(panel,/Zeit nicht ausgewiesen/,'old placeholder text must be removed');
console.log('ok - satellite legend/button uses real product timestamp');
