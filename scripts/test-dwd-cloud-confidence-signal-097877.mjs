import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL(`../${relative}`,import.meta.url),'utf8');
const worker=read('worker-src/30-push-events.js');
const display=read('src/confidenceDisplay.tsx');
const styles=read('src/styles-src/30-modern.css');
const radar=read('src/DwdPrecipitationTypeRadar.tsx');

const start=worker.indexOf('function dwdCloudPixelEvidence');
const end=worker.indexOf('async function dwdPrecipitationTypeInfo');
assert.ok(start>=0&&end>start,'DWD-Wolkenklassifikation ist nicht isoliert prüfbar.');
const cloudBlock=worker.slice(start,end);
const {dwdCloudSignal}=new Function(`${cloudBlock};return {dwdCloudSignal};`)();
const block=(rgb,count=81)=>Array.from({length:count},()=>rgb);
assert.equal(dwdCloudSignal(block([142,171,137]),null),'kein eindeutiges Wolkensignal','Grüner Karten-/Landuntergrund darf nicht als Wolke gelten.');
assert.equal(dwdCloudSignal(block([185,205,185]),null),'kein eindeutiges Wolkensignal','Heller grünlicher Untergrund darf nicht als Wolke gelten.');
assert.equal(dwdCloudSignal(block([145,145,142]),null),'kein eindeutiges Wolkensignal','Neutraler, aber dunkler Kartenuntergrund darf nicht als Wolke gelten.');
assert.equal(dwdCloudSignal(block([226,228,230]),null),'helles / dichtes Wolkensignal','Breites helles neutrales Wolkensignal muss erkannt werden.');
assert.equal(dwdCloudSignal(block([188,190,192]),null),'deutliches Wolkensignal','Breites neutrales Wolkensignal muss erkannt werden.');
assert.equal(dwdCloudSignal([...block([150,178,144],69),...block([235,235,235],12)],null),'kein eindeutiges Wolkensignal','Einzelne helle Schrift-/Grenzpixel dürfen keine Wolke erzeugen.');
assert.equal(dwdCloudSignal(block([226,228,230]),{label:'Regen'}),'durch Niederschlagsfarbe überlagert','Niederschlagsfarben müssen die Wolkenpixelanalyse weiterhin sperren.');
for(const token of ['cloudSamples=[]','for(let oy=-4;oy<=4;oy++)for(let ox=-4;ox<=4;ox++)','dwdCloudSignal(cloudSamples,precipitation)','Farbiger Kartenuntergrund und einzelne Beschriftungspixel gelten nicht als Wolkennachweis.'])assert.ok(worker.includes(token),`Robuste DWD-Pixelanalyse fehlt: ${token}`);
assert.ok(radar.includes('· Satellit: ${pointInfo.info.cloudLabel}'),'Bildpunkttext muss die konservative Satellitenauswertung korrekt benennen.');
for(const token of ['Math.ceil(score/20)','[1,2,3,4,5]','confidenceScoreColor(score,assessment.agreement)','SCORE_COLOR_STOPS'])assert.ok(display.includes(token),`Feinere Konfidenzvisualisierung fehlt: ${token}`);
for(const token of ['min-width:1.55em','gap:6px','min-width:54px!important;max-width:64px!important','i:nth-child(5){height:14.5px}'])assert.ok(styles.includes(token),`Konfidenzabstand/-balken fehlt: ${token}`);
console.log('MID v0.9.78.77: konservative DWD-Bildpunktwolken und feinere, geräumigere Konfidenzsignalstufen geprüft.');
