import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,settings,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','src/compositeSettings.ts','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8'))),contract=`${radar}\n${settings}`;
for(const token of ['label="Zugspuren"','function resolveEchoApproachTrack(','analysis.motionAnchors??[]','const chosen=candidates[0]','etaStartMinutes','etaEndMinutes','[15,30,45,60,90,120]','<Polygon pane="mid-motion-labels"','<Polyline pane="mid-motion-labels"','function approachEtaIcon(','showMotion=showMotionOverlay&&motionAvailable'])assert.ok(contract.includes(token),`Zugspuren-Vertrag fehlt: ${token}`);
for(const forbidden of ['label="Zeitpfeil"','function motionTrackCompositeIcon(','function PrecipitationMotionTrack'])assert.ok(!radar.includes(forbidden),`Unzuverlässiger Altpfad ist zurückgekehrt: ${forbidden}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-09561.mjs';
assert.equal(pkg.scripts?.['test:composite-time-arrow'],`node ${test}`);assert.ok(baseline.requiredRegressionTests?.includes(test));assert.ok(baseline.regressionTests?.includes(test));
console.log('Komposit-Zugspuren geprüft: objekt-/echogebundene ETA, Unsicherheitskorridor und Zeitknoten ersetzen den pauschalen Zeitpfeil.');
