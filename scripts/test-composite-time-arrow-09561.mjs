import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
assert.ok(radar.includes('label="Zeitpfeil"'),'Der Komposit-Schalter „Zeitpfeil“ fehlt.');
assert.ok(!radar.includes('label="Zugbahn"'),'Der alte Komposit-Schalter „Zugbahn“ ist noch vorhanden.');
assert.ok(!radar.includes('label={`Zeit · '),'Der separate Zeitmodus-Schalter ist noch vorhanden.');
for(const token of [
 'motionAxisMetaIcon(directionLabel)',
 '<Marker position={site} icon={motionTrackArrowheadIcon',
 'const trackCandidates=visible.length>=2?visible:points',
 'trackStart=[trackCandidates.at(-1)!.lat,trackCandidates.at(-1)!.lon] as [number,number]',
 'labelCandidates=visible.filter(point=>point.arrivalMinutes>=45&&(point.arrivalMinutes===45||point.arrivalMinutes%60===0))'
]) assert.ok(radar.includes(token),`Zeitpfeil-Vertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil geprüft: nur ein Schalter, lange sichtbare Pfeilachse, Zielspitze am Standort und reduzierte Zeitlabels entlang der Schwerpunktströmung.');
