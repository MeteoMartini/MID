import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const source=readFileSync(new URL('../src/forecastVerification.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('forecastVerification.ts',source,ts.ScriptTarget.Latest,true);
const fn=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='isIndependentTwinReference');
assert.ok(fn,'Messreferenzgate fehlt');
const js=ts.transpileModule(fn.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const valid=new Function(js+'\nreturn isIndependentTwinReference;')();
const sample={kind:'measured',coverageHours:20,quality:.85,sources:[{kind:'measured'}]};
assert.equal(valid(sample),true);
assert.equal(valid({...sample,kind:'private-sensor',sources:[{kind:'private-sensor'}]}),true);
for(const kind of ['model-fallback','reanalysis','analysed'])assert.equal(valid({...sample,kind}),false,kind);
for(const bad of [{coverageHours:6},{coverageHours:undefined},{quality:.3},{sources:[{kind:'measured'},{kind:'model-fallback'}]}])assert.equal(valid({...sample,...bad}),false);
assert.ok(source.includes('&&isIndependentTwinReference(row)).map(row=>[row.date,row])'));
assert.ok(source.includes("regime:capture.predictedRegime??'wechselhaft'"),'Kein rückwirkendes Regime-Leakage');
// The health report delegates the exact same independent reference gate to a pure
// archive helper. Guard that wiring and exercise it with the actual extracted predicate.
assert.ok(source.includes('twinArchiveEvidence(store.references,dateAtEpoch(now,zone),isIndependentTwinReference)'),'Unabhängiges Referenzgate muss auch die Anzeige und Archivfrische steuern');
const healthSource=readFileSync(new URL('../src/twinHealthPresentation.ts',import.meta.url),'utf8');
const healthJs=ts.transpileModule(healthSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const {twinArchiveEvidence}=new Function('exports',healthJs+'\nreturn exports;')({});
const dated=(date,kind='measured',label='DWD',extra={})=>({...sample,date,kind,sources:[{kind,label}],...extra});
const today='2026-11-26';
const archive=twinArchiveEvidence([
 dated('2026-11-20'),dated('2026-11-20'),dated('2026-11-25','reanalysis','ERA5'),
 dated('2026-11-24','model-fallback','Best Match'),dated('2026-11-23','measured','Kurz',{coverageHours:6}),
 dated('2026-11-22','measured','Gemischt',{sources:[{kind:'measured',label:'DWD'},{kind:'reanalysis',label:'ERA5'}]}),
 dated(today),dated('2026-11-27'),dated('2026-02-30')
],today,valid);
assert.deepEqual(archive,{independentDays:1,latestDate:'2026-11-20',sources:['DWD']},'Nur abgeschlossene eindeutige unabhängig qualifizierte Messreferenzen; Fallback aktualisiert Archiv nicht');
assert.deepEqual(twinArchiveEvidence([dated('2026-11-25','reanalysis','ERA5')],today,valid),{independentDays:0,latestDate:undefined,sources:[]},'Reanalyse allein ist keine unabhängige Archiv-Evidenz');
assert.ok(source.includes('observationTimelineComplete(row.rows)'),'Lückenfreie Messdeckung gilt auch für Niederschlag');
const continuousDeclaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='observationTimelineComplete');
const coverageDeclaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='observationCoverageHours');
assert.ok(continuousDeclaration&&coverageDeclaration,'Lückenfreie Messzeitprüfung fehlt');
const joined=ts.transpileModule(coverageDeclaration.getText(ast)+'\n'+continuousDeclaration.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const complete=new Function(joined+'\nreturn observationTimelineComplete;')();
const records=Array.from({length:20},(_,i)=>({timestamp:new Date(Date.UTC(2026,9,1,i)).toISOString()}));
assert.equal(complete(records),true,'20 echte stündliche Messungen sind zeitlich plausibel');
assert.equal(complete(records.filter((_,i)=>i<=6||i>=14)),false,'Siebenstündige Messlücke darf nicht als Tagesdeckung gelten');
assert.equal(complete(records.slice(0,8)),false,'Nur acht Stunden sind keine Tagesreferenz');
assert.equal(complete(records.slice(0,11)),false,'Nur elf Messungen sind zu wenig');
console.log('P1 Prognosegüte: unabhängige Messwerte, Deckung und Ausgabe-Regime geprüft.');
