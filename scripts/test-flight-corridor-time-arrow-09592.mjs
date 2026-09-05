import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [panel,radar,worker,pkgText,baselineText]=await Promise.all(['src/CrossSectionPanel.tsx','src/RadarPanel.tsx','worker-src/30-push-events.js','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of ['Analysekorridor','corridor_km','Breiter Korridor reduziert falsche Ortsgenauigkeit','Raum ${region.label}','größeren Raum'])assert.ok(panel.includes(token),`Flug-Korridorvertrag fehlt: ${token}`);
for(const token of ['flightCorridorQueryPoints','corridorHalfWidthKm:corridorKm/2','flightRouteRegions','BIGDATA_REVERSE','Korridorroute'])assert.ok(worker.includes(token),`Worker-Korridorvertrag fehlt: ${token}`);
for(const token of ['function resolveEchoApproachTrack(','cross=Math.abs(distance*Math.sin','item.cross<=item.width','corridor:[leftStart,leftEnd,rightEnd,rightStart]','<Polygon pane="mid-motion-labels"','<Polyline pane="mid-motion-labels"'])assert.ok(radar.includes(token),`Echo-Korridorvertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-flight-corridor-time-arrow-09592.mjs';assert.equal(pkg.scripts?.['test:flight-corridor-time-arrow'],`node ${test}`);assert.ok(baseline.requiredRegressionTests?.includes(test));assert.ok(baseline.regressionTests?.includes(test));
console.log('Flug- und Kompositkorridore geprüft: regionale Hazardräume und echogebundene Annäherung mit Unsicherheitskorridor.');
