import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
  'const trackKm=Math.max(.5,resolved.speed*MOTION_AXIS_LEAD_MINUTES/60);',
  'startPx=map.latLngToContainerPoint(trackStart)',
  'sitePx=map.latLngToContainerPoint(site)',
  'screenLengthPx=Math.max(1,Math.hypot(sitePx.x-startPx.x,sitePx.y-startPx.y))',
  'useMapEvents({moveend:()=>setViewRevision(value=>value+1),zoomend:()=>setViewRevision(value=>value+1),resize:()=>setViewRevision(value=>value+1)})',
  'const length=Math.max(56,Math.min(1800,Math.round(lengthPx)))'
]) assert.ok(radar.includes(token),`Zoomskalierungs-Vertrag fehlt: ${token}`);
for(const forbidden of [
  'desiredLengthPx=Math.max(220',
  'trackKm=Math.max(4,viewportDiagonalKm*desiredLengthPx/viewportDiagonalPx)',
  'Math.max(180,Math.hypot(sitePx.x-startPx.x,sitePx.y-startPx.y))'
]) assert.ok(!radar.includes(forbidden),`Zeitpfeil darf nicht auf feste Bildschirmgröße zurückfallen: ${forbidden}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-zoom-scale-09610.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow-zoom-scale'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil-Zoomskalierung geprüft: feste geographische 60-min-Zugstrecke wird nach jedem Zoom neu in Pixel projiziert; keine feste Bildschirm-Länge.');
