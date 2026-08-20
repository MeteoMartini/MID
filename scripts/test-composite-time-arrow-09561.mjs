import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
assert.ok(radar.includes('label="Zeitpfeil"'),'Der Komposit-Schalter „Zeitpfeil“ fehlt.');
assert.ok(!radar.includes('label="Zugbahn"'),'Der alte Komposit-Schalter „Zugbahn“ ist noch vorhanden.');
for(const token of [
 'function motionTrackGraphicIcon(',
 'const MOTION_AXIS_NICE_STEPS=[2,5,10,15,20,30,45,60] as const;','function fittedMotionStep(rawMinutes:number,pxPerMinute:number,availablePx:number)',
 'tickMinutes=Array.from({length:tickCount},(_,index)=>stepMinutes*(index+1));',
 'upstreamBearing=(resolved.direction+180)%360',
 'trackStart=destinationPoint(site,upstreamBearing,trackKm)',
 'screenLengthPx=Math.max(1,Math.hypot(sitePx.x-startPx.x,sitePx.y-startPx.y))',
 'screenAngleDeg=Math.atan2(sitePx.y-startPx.y,sitePx.x-startPx.x)*180/Math.PI',
 '<Marker pane="mid-motion-labels" position={site} icon={motionTrackGraphicIcon',
 'geometry.ticks.map(tick=><Marker',
 'position={tick.position} icon={motionTimeIcon(',
 'arrivalEpochMs:referenceMs+minutes*60000',
 'referenceMs={Number.isFinite(targetMs)?targetMs:Date.now()}',
 "motionTimeMode:MotionTimeMode=raw.motionTimeMode==='relative'?'relative':'absolute'",
 `cycleMotionOverlay=()=>{if(!showRadar)setShowRadar(true);if(!showMotionOverlay){setMotionTimeMode('absolute');setShowMotionOverlay(true);return}if(motionTimeMode==='absolute'){setMotionTimeMode('relative');return}setShowMotionOverlay(false);setMotionTimeMode('absolute')}`,
 "if(steeringValid)return{direction:normalizeBearing(steeringDirection)",
 'steeringCloudCenterHpa',
 'steeringProfileMode'
]) assert.ok(radar.includes(token),`Zeitpfeil-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('position={site} icon={motionTimeIcon'),'Direkt am Ort darf keine Zeitmarke liegen.');
assert.ok(!radar.includes('CanvasOverlay'),'Der Zeitpfeil darf nicht auf den früher unsichtbaren Canvas-Pfad zurückfallen.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil geprüft: zusammenhängendes SVG-Symbol, Zeitlabels nur an dynamischen runden Zeitunterteilungen, absolute/relative/aus-Zyklus und Schwerpunktströmung aus dem Vertikalprofil.');
