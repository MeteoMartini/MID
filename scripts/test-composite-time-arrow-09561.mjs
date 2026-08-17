import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
assert.ok(radar.includes('label="Zeitpfeil"'),'Der Komposit-Schalter „Zeitpfeil“ fehlt.');
assert.ok(!radar.includes('label="Zugbahn"'),'Der alte Komposit-Schalter „Zugbahn“ ist noch vorhanden.');
assert.ok(!radar.includes('label={`Zeit · '),'Der separate Zeitmodus-Schalter ist noch vorhanden.');
for(const token of [
 "motionAxisIcon('Zeitpfeil',directionLabel)",
 '<Marker position={site} icon={motionTrackArrowheadIcon',
 'const trackStart=[points.at(-1)!.lat,points.at(-1)!.lon] as [number,number]',
 'majorVisible=visible.filter(point=>point.arrivalMinutes%60===0)'
]) assert.ok(radar.includes(token),`Zeitpfeil-Vertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Komposit-Zeitpfeil geprüft: nur ein Schalter, lange Pfeilachse, Zielspitze am Standort und Stundenlabels entlang der Zugrichtung.');
