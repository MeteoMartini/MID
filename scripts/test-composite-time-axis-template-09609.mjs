import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,styles,pkgText,baselineText,worker]=await Promise.all(['src/RadarPanel.tsx','src/styles.css','package.json','MID_BASELINE.json','worker/metar-proxy.js'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
 'function motionTrackCompositeIcon(',
 'const MOTION_AXIS_NICE_STEPS=[2,5,10,15,20,30,45,60] as const;',
 'function fittedMotionStep(rawMinutes:number,pxPerMinute:number,availablePx:number)',
 'tickMinutes=Array.from({length:tickCount},(_,index)=>stepMinutes*(index+1))',
 'upstreamBearing=(resolved.direction+180)%360',
 'trackStart=destinationPoint(site,upstreamBearing,trackKm)',
 "const confidence=analysis.motionConfidence||'low',icon=motionTrackCompositeIcon(map,site,geometry,referenceMs,timezone,mode,confidence)",
 'return <Marker pane="mid-motion-labels" position={site} icon={icon}',
 '<Pane name="mid-motion-labels" style={{zIndex:870',
 '<Marker pane="mid-motion-labels" position={site} icon={icon}',
 'label=motionTimeLabel(',
 "if(steeringValid)return{direction:normalizeBearing(steeringDirection)",
 `cycleMotionOverlay=()=>{if(!showRadar)setShowRadar(true);if(!showMotionOverlay){setMotionTimeMode('absolute');setShowMotionOverlay(true);return}if(motionTimeMode==='absolute'){setMotionTimeMode('relative');return}setShowMotionOverlay(false);setMotionTimeMode('absolute')}`,
 'actualLocation?locationHeadingIcon(deviceHeading.heading):selectedPlaceIcon()'
]) assert.ok(radar.includes(token),`Zeitachsen-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('position={site} icon={motionTimeIcon'),'Direkt am Standort/Favoritenort darf keine separate Zeitmarke liegen.');
assert.ok(radar.includes('iconAnchor:[-minX,-minY]'),'Zeitpfeil muss als dynamisch projiziertes SVG exakt am Ort verankert sein.');
for(const token of ['.mid-motion-track-composite-div-icon{','.mid-motion-track-composite-svg{']) assert.ok(styles.includes(token),`Zeitachsen-Styling fehlt: ${token}`);
for(const token of ['function steeringMotionFromContext(','cloudSignal*.72+humiditySignal*.28','motionSource:cloudActive?\'cloud-weighted-vertical-steering\'','steeringCloudCenterHpa']) assert.ok(worker.includes(token),`Vertikalprofil-Schwerpunktströmung fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-axis-template-09609.mjs';
assert.equal(pkg.scripts?.['test:composite-time-axis-template'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitachse geprüft: geographische Pfeilachse über der Referenzkarte, Labels nur an Ticks, kein Label am Ort und primäre wolkengewichtete Vertikalprofil-Steuerung.');
