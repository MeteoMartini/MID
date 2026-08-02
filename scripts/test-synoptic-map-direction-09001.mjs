import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const panel=read('src/SynopticPanel.tsx'),styles=read('src/styles.css'),workerSource=read('worker/metar-proxy.js'),synoptic=read('src/synoptic.ts');

for(const token of ['MapContainer','TileLayer','basemaps.cartocdn.com','synoptic-station-plot','synoptic-front-marker','corridorBearing','→ zur Front','Kartengrundlage'])assert.ok(panel.includes(token),`Verbesserte Synoptikkarte fehlt: ${token}`);
for(const token of ['synoptic-leaflet-map','synoptic-station-marker','synoptic-phase-flow','synoptic-corridor-graphic','@media(max-width:520px)','@media(max-width:360px)'])assert.ok(styles.includes(token),`Responsive Synoptikdarstellung fehlt: ${token}`);
assert.ok(workerSource.includes('approachBearingDeg:'),'Worker muss die Annäherungsrichtung separat ausgeben');
assert.ok(workerSource.includes('motionDirectionDeg:((('),'Worker muss die Bewegungsrichtung getrennt ausgeben');
assert.ok(synoptic.includes('approachBearingDeg?:number'),'Frontendvertrag für Annäherungsrichtung fehlt');
assert.ok(panel.includes('bei Warmfronten ausdrücklich zur Warmfront hin'),'Warmfront-Richtung muss verständlich erklärt werden');

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const result=ts.transpileModule(panel,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:'SynopticPanel.tsx',reportDiagnostics:true}),errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const temp=path.join(os.tmpdir(),`mid-worker-direction-${Date.now()}.mjs`);fs.writeFileSync(temp,workerSource);
try{
 const worker=await import(`${pathToFileURL(temp).href}?v=${Date.now()}`);
 const direct=worker.synopticUpstreamBearing([{approachBearingDeg:285,motionDirectionDeg:105,type:'warm'}]);
 const legacy=worker.synopticUpstreamBearing([{motionDirectionDeg:105,type:'warm'}]);
 assert.ok(Math.abs(direct-285)<.01,`Annäherungsrichtung wurde fälschlich gedreht: ${direct}`);
 assert.ok(Math.abs(legacy-285)<.01,`Legacy-Bewegungsrichtung wurde nicht korrekt zur Front zurückgerechnet: ${legacy}`);
 const opposite=worker.synopticUpstreamBearing([{approachBearingDeg:105,motionDirectionDeg:285,type:'warm'}]);
 assert.ok(Math.abs(opposite-105)<.01,`Warmfrontkorridor zeigt nicht zur Front: ${opposite}`);
}finally{fs.rmSync(temp,{force:true})}

console.log('MID-Synoptik v0.9.0.1 geprüft: echte Kartengrundlage, lesbare Stationsplots, kompakte Grafiken und korrekte Stromaufwärtsrichtung zur Warmfront.');
