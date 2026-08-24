import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,pkgText,baselineText]=await Promise.all(['src/App.tsx','package.json','MID_BASELINE.json'].map(read));
for(const token of [
 'function hazardSortEpoch(value:string|undefined)',
 'function compareHazardsChronologically(a:AutomaticHazard,b:AutomaticHazard)',
 'const sortedData=[...data].sort(compareHazardsChronologically)',
 'sortedData.reduce((map,item)=>'
])assert.ok(app.includes(token),`Chronologie-Vertrag fehlt: ${token}`);

const functions=app.match(/function hazardSortEpoch\([\s\S]*?\nfunction compareHazardsChronologically\([\s\S]*?\n(?=function Hazards)/)?.[0];
assert.ok(functions,'Chronologische Warnsortierung konnte nicht extrahiert werden.');
const ts=createRequire(import.meta.url)('typescript');
const source=`const AUTOMATIC_HAZARD_LEVEL_RANK={yellow:1,orange:2,red:3,purple:4};\n${functions}\nexport {compareHazardsChronologically};`;
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'warning-chronology.ts'});
const errors=(compiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const mod=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`),sort=mod.compareHazardsChronologically;
const rows=[
 {title:'Stark spät',level:'yellow',validFrom:'2026-08-25T13:00:00Z',validTo:'2026-08-25T20:00:00Z'},
 {title:'Extrem mittags',level:'red',validFrom:'2026-08-25T12:00:00Z',validTo:'2026-08-25T13:00:00Z'},
 {title:'Heute',level:'yellow',validFrom:'2026-08-24T17:00:00Z',validTo:'2026-08-24T23:00:00Z'},
 {title:'Stark morgens',level:'yellow',validFrom:'2026-08-25T09:00:00Z',validTo:'2026-08-25T12:00:00Z'}
].sort(sort);
assert.deepEqual(rows.map(row=>row.title),['Heute','Stark morgens','Extrem mittags','Stark spät'],'Warnkarten müssen tage- und zeitfensterübergreifend strikt chronologisch aufsteigen.');
const tie=[
 {title:'gelb',level:'yellow',validFrom:'2026-08-25T12:00:00Z',validTo:'2026-08-25T13:00:00Z'},
 {title:'rot',level:'red',validFrom:'2026-08-25T12:00:00Z',validTo:'2026-08-25T13:00:00Z'}
].sort(sort);
assert.equal(tie[0].title,'rot','Bei identischem Zeitfenster muss die höhere Warnstufe zuerst stehen.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-warning-chronological-order-09658.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: automatische Warnkarten strikt chronologisch (Tag, Beginn, Ende; Tie-Break Warnstufe) geprüft.`);
