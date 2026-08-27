import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

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

assert.ok(!panel.includes(',0,1)'), 'Der Mitteleuropa-Ausblick enthält weiterhin einen vertauschten formatDecimal-Aufruf.');
assert.ok((panel.match(/,1,0\)/g)||[]).length>=10,'Die Extremwetter-Kennwerte sind nicht vollständig auf maximal eine Nachkommastelle korrigiert.');
assert.ok(formatSource.includes('safeMinimum=Math.min(normalizedMinimum,normalizedMaximum)'));
assert.ok(formatSource.includes('safeMaximum=Math.max(normalizedMinimum,normalizedMaximum)'));
assert.ok(changelog.includes('## 0.9.66.1'));
assert.ok(implementation.includes('minimumFractionDigits: 1'));
assert.ok(implementation.includes('meteorologische Fachlogik ändert sich nicht'));

console.log('MID 0.9.66.1: DACH-Dezimalformatierung und zentraler RangeError-Schutz geprüft.');
