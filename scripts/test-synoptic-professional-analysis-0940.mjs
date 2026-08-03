import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=fs.readFileSync(path.join(root,'src/SynopticPanel.tsx'),'utf8'),styles=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
for(const token of [
 "light_nolabels","light_only_labels","MID BODENANALYSE","professional-analysis-map","graticule(bounds","frontZone(primary.line)","dominanter Cluster","Alternative",
 "function windBarbs","function selectStationPlots","stationSeparationKm(existing,station)>=58","pressureCode","Wind aus ${compassDirection(station.windDirection)}","const source=isFiniteNumber(direction)?((direction%360)+360)%360:0","Multiparametrische Feldanalyse","primaryModelId"
])assert.ok(panel.includes(token),`Professionelle Synoptik fehlt: ${token}`);
assert.ok(!panel.includes('(direction+180)%360'),'Synoptik-Windpfeile dürfen nicht erneut um 180 Grad gespiegelt werden.');
for(const token of [
 'top:calc(25px - var(--wind-length))','transform-origin:1px var(--wind-length)','.synoptic-analysis-stamp','.synoptic-field-analysis','.synoptic-map-label.front.alternate'
])assert.ok(styles.includes(token),`Synoptik-CSS fehlt: ${token}`);
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const result=ts.transpileModule(panel,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:'SynopticPanel.tsx',reportDiagnostics:true}),errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
console.log('MID v0.9.4.0: professionelle Bodenanalysekarte, dominante Front, Stationsmodelle, Feldanalyse und eindeutige Windvektoren geprüft.');
