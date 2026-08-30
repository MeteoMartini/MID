import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const source=fs.readFileSync(path.join(root,'src','officialWarningOrder.ts'),'utf8');
const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'officialWarningOrder.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-official-warning-order-'));
try{
 const modulePath=path.join(tempDir,'officialWarningOrder.mjs');
 fs.writeFileSync(modulePath,output.outputText);
 const mod=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const alerts=[
  {id:'future',headline:'Severe high-temperature warning',level:'orange',source:'CAP',onset:'2026-08-27T13:00:00+02:00',expires:'2026-08-27T18:00:00+02:00'},
  {id:'yellow',headline:'Yellow Warning',level:'yellow',source:'CAP',onset:'2026-08-26T13:00:00+02:00',expires:'2026-08-26T18:00:00+02:00'},
  {id:'moderate',headline:'Moderate high-temperature warning',level:'yellow',source:'CAP',onset:'2026-08-26T13:50:00+02:00',expires:'2026-08-26T18:00:00+02:00'}
 ];
 assert.deepEqual(mod.chronologicalOfficialAlerts(alerts).map(item=>item.id),['yellow','moderate','future'],'Amtliche Warnungen müssen primär nach Beginn und nicht nach Warnstufe/Providerreihenfolge sortiert werden.');
 const sameStart=[
  {...alerts[0],id:'later-end',onset:'2026-08-26T13:00:00+02:00',expires:'2026-08-26T20:00:00+02:00'},
  {...alerts[1],id:'earlier-end',onset:'2026-08-26T13:00:00+02:00',expires:'2026-08-26T18:00:00+02:00'}
 ];
 assert.deepEqual(mod.chronologicalOfficialAlerts(sameStart).map(item=>item.id),['earlier-end','later-end'],'Bei gleichem Beginn entscheidet das frühere Ende.');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

for(const token of [
 "import {chronologicalOfficialAlerts} from './officialWarningOrder';",
 "sortedAlerts=useMemo(()=>chronologicalOfficialAlerts(alerts),[alerts])",
 'sortedAlerts.map(a=>'
])assert.ok(app.includes(token),`Chronologische CAP-Anbindung fehlt: ${token}`);
assert.ok(!app.includes('<div className="official-list">{alerts.map(a=>'),'Unsortierte CAP-Originalreihenfolge darf nicht direkt gerendert werden.');

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const test='scripts/test-official-warning-chronological-order-096616.mjs';
assert.equal(pkg.scripts?.['test:official-warning-chronological-order'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log('Amtliche Wetterwarnungen geprüft: zeitlich aufsteigende Sortierung nach Beginn und Ende ist appseitig verbindlich.');
