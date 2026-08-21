import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(p=>readFile(new URL(p,root),'utf8')));
for(const token of [
 'function motionTrackCompositeIcon(',
 'sitePx=map.latLngToContainerPoint(site)',
 'startPx=map.latLngToContainerPoint(geometry.trackStart)',
 'geometry.ticks.map((tick,index)=>',
 'label=motionTimeLabel(tick.arrivalEpochMs,referenceMs,timezone,mode)',
 '<line x1="${start.x}" y1="${start.y}" x2="0" y2="0"',
 '<polyline points="${left.x},${left.y} 0,0 ${right.x},${right.y}"',
 "iconAnchor:[-minX,-minY]",
 'return <Marker pane="mid-motion-labels" position={site} icon={icon}',
 'useMapEvents({moveend:()=>setViewRevision(value=>value+1),zoomend:()=>setViewRevision(value=>value+1),resize:()=>setViewRevision(value=>value+1)})'
])assert.ok(radar.includes(token),`DOM/SVG-Zeitpfeil-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('<Polyline renderer={renderer} pane="mid-motion-vectors" positions={[geometry.trackStart,site] as any}'),'Zeitpfeilschaft darf nicht wieder als separat verschwindender MapLibre-Layer gerendert werden.');
assert.ok(!radar.includes('position={site} icon={motionTimeIcon'),'Direkt am Zielort darf keine Zeitmarke stehen.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-dom-render-09615.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow-dom-render'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
console.log('DOM/SVG-Zeitpfeil geprüft: Schaft, Ticks, Labels und Zielspitze werden gemeinsam gerendert und bei Zoom neu projiziert.');
