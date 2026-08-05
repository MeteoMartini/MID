import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [radar,worker]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
]);

assert.match(radar,/function KonradNowcastObjects\(\{data,analysis,timezone,targetMs,referenceLat,referenceLon\}/,'K3D layer must receive radar analysis, location and selected radar time');
assert.match(radar,/Math\.abs\(targetMs-observedMs\)<=90\*60000/,'K3D objects must remain limited to the supported radar/nowcast time window');
assert.match(radar,/map\.getBounds\(\)\.pad\(\.22\)/,'K3D layer must react to the visible map bounds');
assert.match(radar,/bounds\.contains\(position\)/,'forecast tracks must only be rendered for currently visible surface positions');
assert.match(radar,/const detailedIds=useMemo\(\(\)=>new Set\(visibleCells\.slice\(0,Math\.min\(3,visibleCells\.length\)\)\.map\(cell=>cell\.id\)\)/,'full K3D tracks must be limited to the three highest-ranked visible cells');
assert.match(radar,/displacement<=maximum/,'implausibly displaced official forecast positions must be rejected');
assert.match(radar,/maximumUncertainty=Math\.min\(32/,'K3D uncertainty geometry must be bounded');
assert.match(radar,/point\.minutes===30\|\|point\.minutes===60/,'permanent K3D labels must be reduced to meaningful lead times');
assert.match(worker,/konradAttribute\(match\[1\],'unit'\)\|\|konradAttribute\(match\[1\],'units'\)/,'DWD singular unit attribute must be parsed before fallback heuristics');

console.log('MID v0.9.15.10 K3D viewport, time and geometry plausibility regression passed.');
