import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
assert.ok(radar.includes('label="Zeitpfeil"'),'Der Komposit-Schalter „Zeitpfeil“ fehlt.');
assert.ok(!radar.includes('label="Zugbahn"'),'Der alte Komposit-Schalter „Zugbahn“ ist noch vorhanden.');
assert.ok(!radar.includes('label={`Zeit · '),'Der separate Zeitmodus-Schalter ist noch vorhanden.');
for(const token of [
 '<Marker pane="mid-motion-labels" position={site} icon={motionTrackArrowheadIcon',
 'd="M19 19L9 30M19 19L29 30"',
 'style="transform:rotate(${direction}deg)"',
 'viewportDiagonalKm=Math.max(12,segmentKm(southWest,northEast))',
 'shaftKm=Math.max(6,Math.min(Math.max(18,viewportDiagonalKm*.42),resolved.speed*2))',
 'shaftLeadMinutes=Math.max(30,Math.min(120,roundedQuarterMinutes(shaftKm/resolved.speed*60)))',
 'trackStart=destinationPoint(site,upstreamBearing,resolved.speed*shaftLeadMinutes/60)',
 'tickMinutesRaw=shaftLeadMinutes>=90?[roundedQuarterMinutes(shaftLeadMinutes*.4),roundedQuarterMinutes(shaftLeadMinutes*.75)]:shaftLeadMinutes>=60?[30,60]:[15,Math.max(30,shaftLeadMinutes)]',
 'labelOffsetKm=Math.max(.8,Math.min(4.2,Math.max(1.1,shaftKm*.05)))',
 'labelConnector:[position,labelAnchor]',
 'position={tick.labelAnchor}',
 'referenceMs={Number.isFinite(targetMs)?targetMs:Date.now()}',
 "motionTimeMode:MotionTimeMode=raw.motionTimeMode==='relative'?'relative':'absolute'",
 "motionTimeMode:'absolute'",
 'geometry.ticks.map(tick=>',
 '<Polyline pane="overlayPane" positions={[geometry.trackStart,site] as any} interactive={false}',
 "color:'rgba(21,125,217,.96)'",
 "className:'mid-motion-time-arrow-shaft-halo'",
 "className:'mid-motion-time-arrow-shaft-core'",
 'positions={tick.cross as any}',
 "className:'mid-motion-time-arrow-tick-halo'",
 "className:'mid-motion-time-arrow-tick-core'",
 'positions={tick.labelConnector as any}',
 "className:'mid-motion-time-arrow-label-connector-halo'",
 "className:'mid-motion-time-arrow-label-connector-core'",
 "resolvedMotion.source==='steering'",
 'steeringCloudCenterHpa',
 'steeringProfileMode',
 'pane="mid-motion-labels"',
 `cycleMotionOverlay=()=>{if(!showRadar)setShowRadar(true);if(!showMotionOverlay){setMotionTimeMode('absolute');setShowMotionOverlay(true);return}if(motionTimeMode==='absolute'){setMotionTimeMode('relative');return}setShowMotionOverlay(false);setMotionTimeMode('absolute')}`,
 'Zeitpfeil zyklisch schalten: absolute Zeiten, relative Zeiten, aus'
]) assert.ok(radar.includes(token),`Zeitpfeil-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('motionAxisMetaIcon'),'Der alte schwebende Achsen-Badge darf nicht zurückkehren.');
assert.ok(!radar.includes('weightedAnchorApproachBearing'),'Ein statischer Echo-Schwerpunkt darf die zeitliche Schwerpunktströmung nicht mehr verdrehen.');
assert.ok(!radar.includes('CanvasOverlay'),'Der Zeitpfeil darf nicht mehr als Canvas-Overlay gezeichnet werden, damit Schaft und Tick-/Label-Verbindungen zuverlässig sichtbar bleiben.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil geprüft: sichtbare Pfeillinie, zyklische Umschaltung absolut/relativ/aus und Zeitreferenz auf Basis des aktuell angezeigten Filmzeitpunkts.');
