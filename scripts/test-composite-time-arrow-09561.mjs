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
 'shaftKm=Math.max(22,Math.min(190,viewportDiagonalKm*.54))',
 'trackStart=destinationPoint(site,upstreamBearing,shaftKm)',
 'tickFractions=shaftKm>=70?[.43,.78]:[.38,.72]',
 'geometry.ticks.map(tick=>',
 'drawLine(left,right',
 "resolvedMotion.source==='steering'" ,
 'steeringCloudCenterHpa',
 'steeringProfileMode',
 'mid-motion-time-arrow-shaft',
 'CanvasOverlay',
 'pane="mid-motion-labels"'
]) assert.ok(radar.includes(token),`Zeitpfeil-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('motionAxisMetaIcon'),'Der alte schwebende Achsen-Badge darf nicht zurückkehren.');
assert.ok(!radar.includes('weightedAnchorApproachBearing'),'Ein statischer Echo-Schwerpunkt darf die zeitliche Schwerpunktströmung nicht mehr verdrehen.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil geprüft: nur ein Schalter, lange sichtbare Pfeilachse, Zielspitze am Standort und reduzierte Zeitlabels entlang der wolkengewichteten vertikalen Schwerpunktströmung.');
