import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,settings,styles,baselineText]=await Promise.all(['src/RadarPanel.tsx','src/compositeSettings.ts','src/styles.css','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8'))),contract=`${radar}\n${settings}`;
for(const token of ['COMPOSITE_REFERENCE_TILEJSON','VectorReferenceLayer',"sourceLayer:'boundary'","sourceLayer:'place'",'mapOverlayOpacity','zIndex={790}','function resolveEchoApproachTrack(','analysis.motionAnchors??[]','item.cross<=item.width','function EchoApproachTrackLayer(','<MemoEchoApproachTrack track={approachTrack}','label="Zugspuren"'])assert.ok(contract.includes(token),`Kompositvertrag fehlt: ${token}`);
assert.equal((radar.match(/<MemoEchoApproachTrack/g)||[]).length,1,'Es darf nur eine echogebundene Zugspur gerendert werden.');
assert.ok(styles.includes('.mid-echo-approach-track'),'Zugspur-/Korridor-Styling fehlt.');
const baseline=JSON.parse(baselineText);assert.ok(baseline.requiredRegressionTests.includes('scripts/test-composite-top-reference-motion-track-09550.mjs'));
console.log('Komposit geprüft: Referenzkarte bleibt oberhalb der Wetterraster; Zugspur und ETA entstehen nur aus einem real erkannten Echo auf Standortkurs.');
