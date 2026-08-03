import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const panel=read('src/SynopticPanel.tsx'),synoptic=read('src/synoptic.ts'),styles=read('src/styles.css');

for(const token of [
 'Windrichtung vor → nach dem Frontdurchgang','signedDirectionChange','windTurnText','synoptic-wind-transition',
 'Grauer Balken: Böengeschwindigkeit. Blauer Balken: Regenwahrscheinlichkeit.','<em>Böen</em>','<em>Regen</em>',
 "color:'#ffffff',weight:5.4","color:'#102b40',weight:2.35","`${Math.round(level.level)} hPa`"
])assert.ok(panel.includes(token),`Synoptikdarstellung fehlt: ${token}`);
for(const token of [
 'describeSynopticWindChange','Windrichtungsänderung noch nicht belastbar','rechtsdrehend','rückdrehend',
 'auch die Winddrehung wird berücksichtigt','impactSignature:', 'magnitudeDeg'
])assert.ok(synoptic.includes(token),`Windrichtungslogik fehlt: ${token}`);
for(const token of [
 '.synoptic-phase-bars>span.gust>i>b{background:#657d91}',
 '.synoptic-phase-bars>span.rain>i>b{background:#168de2}',
 '.synoptic-map-label.isobar span{',
 'background:rgba(11,38,58,.94)',
 '.synoptic-map-legend i.isobar{',
 '@media(max-width:520px)'
])assert.ok(styles.includes(token),`Kontrast-/Legendenregel fehlt: ${token}`);

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const[file,source,jsx]of[['synoptic.ts',synoptic,false],['SynopticPanel.tsx',panel,true]]){const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,...(jsx?{jsx:ts.JsxEmit.ReactJSX}:{})},fileName:file,reportDiagnostics:true}),errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'))}

const executable=synoptic
 .replace("import type {Day,EnsembleDay,Hour,Location,RadarNowcast,Station,ThunderstormNowcast} from './weather';",'')
 .replace("import {readWeatherTwinSettings,type TwinActivity} from './forecastVerification';","const readWeatherTwinSettings=()=>({activities:{}});")
 .replace("import {fetchWorkerJson} from './workerClient';",'const fetchWorkerJson=async()=>({});');
const output=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'synoptic.ts',reportDiagnostics:true}),errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const temp=path.join(os.tmpdir(),`mid-synoptic-wind-${Date.now()}.mjs`);fs.writeFileSync(temp,output.outputText);
try{
 const module=await import(`${pathToFileURL(temp).href}?v=${Date.now()}`);
 const right=module.describeSynopticWindChange(220,290);assert.equal(right.available,true);assert.equal(Math.round(right.magnitudeDeg),70);assert.equal(right.turn,'rechtsdrehend');assert.match(right.summary,/SW 220° → WNW 290°/);
 const back=module.describeSynopticWindChange(40,330);assert.equal(Math.round(back.shiftDeg),-70);assert.equal(back.turn,'rückdrehend');
 const wrap=module.describeSynopticWindChange(350,10);assert.equal(Math.round(wrap.shiftDeg),20);assert.equal(wrap.turn,'rechtsdrehend');
 const calm=module.describeSynopticWindChange(180,188);assert.equal(calm.turn,'nahezu gleichbleibend');
}finally{fs.rmSync(temp,{force:true})}

console.log('MID-Synoptik v0.9.0.2 geprüft: Windrichtung und Winddrehung werden bewertet, Balken sind eindeutig beschriftet und Isobaren besitzen Hochkontrast-Doppelkonturen.');
