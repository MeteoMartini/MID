import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript-strada';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [formatSource,panel,pkgRaw,baselineRaw,changelog,implementation,workerSource]=await Promise.all([
 read('src/format.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.1.md'),read('worker-src/00-core-observations.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-startup-format-09661.mjs';

const versionParts=String(pkg.version).split('.').map(Number);
assert.ok(versionParts[0]>0||versionParts[1]>9||versionParts[2]>66||versionParts[2]===66&&(versionParts[3]??0)>=1,`Release ${pkg.version} liegt vor dem Startformat-Hotfix 0.9.66.1.`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-startup-format'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Startformat-Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes(test)&&baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.66.1.md'),'Hotfix-Dateien fehlen im Baseline-Vertrag.');
assert.ok(workerSource.includes(`const WORKER_VERSION='${pkg.version}';`),'Gekoppelte Worker-Version ist nicht synchron.');

const compiled=ts.transpileModule(formatSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const formatter=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
assert.equal(formatter.formatDecimal(12.34,1,0),'12,3');
assert.doesNotThrow(()=>formatter.formatDecimal(12.34,0,1),'Ein vertauschter Nachkommastellenbereich darf MID nicht mehr beenden.');
assert.equal(formatter.formatDecimal(12.34,0,1),'12,3','Der defensive Formatter muss den vertauschten Bereich als 0–1 normalisieren.');
assert.equal(formatter.formatDecimal(12.34,99,-4),'12,34','Browserunsichere Nachkommastellen müssen auf 0–20 begrenzt werden.');

assert.ok(!panel.includes(',0,1)'), 'Der DACH-Ausblick enthält weiterhin einen vertauschten formatDecimal-Aufruf.');
assert.ok((panel.match(/,1,0\)/g)||[]).length>=10,'Die Extremwetter-Kennwerte sind nicht vollständig auf maximal eine Nachkommastelle korrigiert.');
assert.ok(formatSource.includes('safeMinimum=Math.min(normalizedMinimum,normalizedMaximum)'));
assert.ok(formatSource.includes('safeMaximum=Math.max(normalizedMinimum,normalizedMaximum)'));
assert.ok(changelog.includes('## 0.9.66.1'));
assert.ok(implementation.includes('minimumFractionDigits: 1'));
assert.ok(implementation.includes('meteorologische Fachlogik ändert sich nicht'));

// Current P0 audit: actual RUC/EPS display evidence may NEVER coerce null to 0.
const evidenceSource=await read('src/extremeEvidenceNumeric.ts');
const evidenceJs=ts.transpileModule(evidenceSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const evidence=await import('data:text/javascript;base64,'+Buffer.from(evidenceJs).toString('base64'));
for(const unavailable of [null,undefined,'',' ',false,true,NaN,Infinity,-Infinity,{},[]]){
 assert.equal(evidence.evidenceNumber(unavailable),null,'Missing/non-numeric evidence must never become observed zero');
 assert.equal(evidence.evidenceText(unavailable,n=>n+' mm'),'nicht verfügbar');
}
for(const actual of [0,'0',' 0 ',12.5])assert.equal(evidence.evidenceNumber(actual),Number(actual),'Actual numeric zero and finite measurement must survive');
assert.equal(evidence.evidenceMagnitude(-1),null,'Negative precipitation/wind magnitude is not a valid zero');
assert.equal(evidence.evidenceText(-4.5,n=>n+' J/kg',{signed:true}),'-4.5 J/kg','Negative signed evidence such as CIN stays possible');
assert.equal(evidence.evidencePositiveHours(null),null,'Missing interval must not convert to a 1/6h default');
assert.equal(evidence.evidenceWindow(null),'Zeitraum nicht verfügbar');
assert.equal(evidence.evidenceRate(null,6,'mm',String),'nicht verfügbar');
assert.equal(evidence.evidenceRate(0,6,'mm',String),'0 mm/6 h','Real 0 mm is valid');
assert.equal(evidence.evidenceRate(4.5,null,'cm',String),'4.5 cm · Zeitraum nicht verfügbar','Do not invent accumulation windows');
assert.deepEqual(evidence.rainEvidenceDisplay({rainMm:null,windowHours:6,rucPrecipitation6hMm:null,rucMax15mMm:null}),{amount:null,windowLabel:'Zeitraum nicht verfügbar'});
assert.deepEqual(evidence.rainEvidenceDisplay({rainMm:0,windowHours:6,rucPrecipitation6hMm:null}),{amount:0,windowLabel:'6 h'});
assert.deepEqual(evidence.rainEvidenceDisplay({rainMm:null,rucMax15mMm:1.5}),{amount:1.5,windowLabel:'15 min'});
assert.deepEqual(evidence.rainEvidenceDisplay({rainMm:4,windowHours:3,rucPrecipitation6hMm:7}),{amount:7,windowLabel:'6 h'});
assert.ok(panel.includes("terrainElevationLabel(value:unknown)"),'Terrain elevation must explicitly preserve Missing rather than render 0 m');
assert.ok(panel.includes("rainEvidenceDisplay(metric)"),'Real precipitation evidence display must use strict value guards');
assert.ok(panel.includes("evidenceRate(metric.snowCm"),'Missing snowfall evidence must not be formatted as 0 cm');
assert.ok(!/Number\(metric\.[A-Za-z0-9_]+\)\|\|0/.test(panel),'Known null-to-zero metric fallback must not return');
assert.ok(panel.includes("RUC-EPS Kurzfrist-Ensemble")&&panel.includes("EPS-Streuung Akkumulation"),'RUC/EPS supporting evidence must remain visible');
console.log('MID design audit: NoData != 0 for all numeric RUC/EPS/extreme evidence display paths verified.');

console.log('MID 0.9.66.1: DACH-Dezimalformatierung und zentraler RangeError-Schutz geprüft.');
