import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
  'const MOTION_AXIS_NICE_STEPS=[2,5,10,15,20,30,45,60] as const;',
  'function fittedMotionStep(rawMinutes:number,pxPerMinute:number,availablePx:number)',
  'size=map.getSize()',
  'dpr=Math.max(1,Math.min(3,Number(globalThis.devicePixelRatio)||1))',
  'edgePx=motionViewportEdgeDistance(sitePx,unit,size.x,size.y,margin)',
  'availablePx=Math.max(110,edgePx*.86)',
  'targetTicks=Math.max(2,Math.min(5,Math.round(availablePx/targetTickPx)))',
  'rawStepMinutes=availablePx/targetTicks/pxPerMinute',
  'stepMinutes=fittedMotionStep(rawStepMinutes,pxPerMinute,availablePx)',
  'tickMinutes=Array.from({length:tickCount},(_,index)=>stepMinutes*(index+1))',
  'trackKm=Math.max(.5,resolved.speed*leadMinutes/60)',
  'screenLengthPx=Math.max(1,Math.hypot(sitePx.x-startPx.x,sitePx.y-startPx.y))',
  'motionTrackGraphicIcon(geometry.screenLengthPx,geometry.screenAngleDeg,confidence,geometry.tickMinutes,geometry.leadMinutes)',
  'useMapEvents({moveend:()=>setViewRevision(value=>value+1),zoomend:()=>setViewRevision(value=>value+1),resize:()=>setViewRevision(value=>value+1)})'
]) assert.ok(radar.includes(token),`Dynamischer Zoom-/Skalenvertrag fehlt: ${token}`);
for(const forbidden of [
  'const MOTION_AXIS_LEAD_MINUTES=60;',
  'const MOTION_AXIS_TICK_MINUTES=[15,30,45,60] as const;',
  'Math.min(1800,Math.round(lengthPx))'
]) assert.ok(!radar.includes(forbidden),`Zeitpfeil darf nicht auf starre Skala zurückfallen: ${forbidden}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-zoom-scale-09610.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow-zoom-scale'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil-Zoomskalierung geprüft: runde dynamische Zeitschritte aus Geschwindigkeit, sichtbarer Kartenstrecke, Zoom und Displaydichte.');
