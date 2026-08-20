import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [flight,cross,radar,weatherType,worker,pkgText,baselineText]=await Promise.all([
 'src/FlightMeteorologyPanel.tsx','src/CrossSectionPanel.tsx','src/RadarPanel.tsx','src/weather-src/00-types-models-search.tsfrag','worker-src/10-radar-nowcast.js','package.json','MID_BASELINE.json'
].map(read));
for(const token of ["lazy(()=>import('./CrossSectionPanel'))",'Cross Section · Streckenbriefing','Gefahren zwischen 2–8 Flugplätzen']) assert.ok(flight.includes(token),`Flugmeteorologie-Vertrag fehlt: ${token}`);
for(const token of ['Streckenbriefing erstellen','Start ·','Landung ·','Flight Level','officialBriefing','Vereisung','Turbulenz / vertikale Windscherung','Konvektion / Gewitter']) assert.ok(cross.includes(token),`Streckenbriefing fehlt: ${token}`);
assert.ok(!cross.includes('<svg'),'Die reaktivierte Cross Section darf keine grafische SVG-Querschnittsdarstellung enthalten.');
assert.ok(!cross.includes('html-to-image'),'PNG-/Grafikexport der alten Cross Section ist noch aktiv.');
for(const token of ['profileLevels=[950,925,900,850,800,700,600,500,400,300]','cloud_cover_${level}hPa','relative_humidity_${level}hPa','steeringCloudCenterHpa','steeringProfileMode:cloudActive?\'cloud-weighted\':\'fallback\'']) assert.ok(worker.includes(token),`Vertikale Schwerpunktströmung fehlt: ${token}`);
for(const token of ['steeringCloudCenterHpa?:number','steeringCloudBaseHpa?:number','steeringCloudTopHpa?:number',"steeringProfileMode?:'cloud-weighted'|'fallback'",'steeringLevels?:number[]']) assert.ok(weatherType.includes(token),`RadarNowcast-Typ fehlt: ${token}`);
for(const token of ["if(steeringValid)return{direction:normalizeBearing(steeringDirection)",'function motionTrackArrowheadIcon(','<Polyline renderer={renderer} pane="mid-motion-vectors" positions={[geometry.trackStart,site] as any}','<Marker pane="mid-motion-labels" position={site} icon={motionTrackArrowheadIcon','geometry.ticks.map(tick=><Fragment','position={tick.position} icon={motionTimeIcon(','name="mid-motion-labels"']) assert.ok(radar.includes(token),`Zeitpfeil-/Pane-Vertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-flight-route-briefing-cloud-steering-09590.mjs';
assert.equal(pkg.scripts?.['test:flight-route-cloud-steering'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Flug-Streckenbriefing und wolkengewichtete vertikale Schwerpunktströmung für den Radar-Zeitpfeil geprüft.');
