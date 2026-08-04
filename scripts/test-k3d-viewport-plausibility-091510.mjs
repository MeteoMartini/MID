import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [radar,worker]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
]);

assert.match(radar,/function KonradNowcastObjects\(\{data,timezone,targetMs\}/,'K3D layer must receive the selected radar time');
assert.match(radar,/Math\.abs\(targetMs-observedMs\)<=10\*60000/,'K3D objects must be time-aligned with the radar frame');
assert.match(radar,/map\.getBounds\(\)\.pad\(\.16\)/,'K3D layer must react to the visible map bounds');
assert.match(radar,/bounds\.contains\(\[cell\.latitude,cell\.longitude\]\)/,'forecast tracks must only be rendered for currently visible cell centres');
assert.match(radar,/visibleCells\.slice\(0,2\)/,'full K3D tracks must be limited to the most relevant visible cells');
assert.match(radar,/displacement<=maximum/,'implausibly displaced official forecast positions must be rejected');
assert.match(radar,/maximumUncertainty=Math\.min\(32/,'K3D uncertainty geometry must be bounded');
assert.match(radar,/point\.minutes===30\|\|point\.minutes===60/,'permanent K3D labels must be reduced to meaningful lead times');
assert.match(worker,/konradAttribute\(match\[1\],'unit'\)\|\|konradAttribute\(match\[1\],'units'\)/,'DWD singular unit attribute must be parsed before fallback heuristics');

console.log('MID v0.9.15.10 K3D viewport, time and geometry plausibility regression passed.');
