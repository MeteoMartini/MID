import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of ['function destinationPoint(','cross=Math.abs(distance*Math.sin','leftStart=destinationPoint','rightEnd=destinationPoint','<Polygon pane="mid-motion-labels" positions={track.corridor as any}','<Polyline pane="mid-motion-labels" positions={[track.origin,track.end]}','[15,30,45,60,90,120]'])assert.ok(radar.includes(token),`Geographischer Zugspurvertrag fehlt: ${token}`);
for(const forbidden of ['const MOTION_AXIS_LEAD_MINUTES=60;','motionViewportEdgeDistance(','motionTrackGraphicIcon'])assert.ok(!radar.includes(forbidden),`Zugspur darf nicht auf eine viewportabhängige Altgeometrie zurückfallen: ${forbidden}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-zoom-scale-09610.mjs';assert.equal(pkg.scripts?.['test:composite-time-arrow-zoom-scale'],`node ${test}`);assert.ok(baseline.requiredRegressionTests?.includes(test));assert.ok(baseline.regressionTests?.includes(test));
console.log('Komposit-Zugspur skalenfest geprüft: Geokoordinaten für Pfad und Korridor, feste meteorologische Prognosezeiten statt viewportabhängiger Pfeillänge.');
