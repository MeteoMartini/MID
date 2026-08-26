import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),ts=require('typescript');
const sourcePath=path.join(root,'src','eventAviation.ts');
const source=fs.readFileSync(sourcePath,'utf8');
const workerSource=fs.readFileSync(path.join(root,'worker-src','40-aviation-router.js'),'utf8');

for(const token of [
 'function weatherCodeSuggestsLowCeiling',
 'function isDiagnosedCeilingPlausible',
 'if(value<100)return strongLowCloud&&poorVisibility;',
 'if(value<300)return strongLowCloud&&(poorVisibility||weatherSignal);',
 'if(value<1000)return strongLowCloud||reducedVisibility||weatherSignal;',
 "const vis=valueAt(hourly,'visibility',index),code=valueAt(hourly,'weather_code',index),lowCloud=valueAt(hourly,'cloud_cover_low',index),ceiling=ceilingFor(points,elevation);if(isDiagnosedCeilingPlausible(ceiling,lowCloud,vis,code))ceilings.push(Number(ceiling));"
])assert.ok(source.includes(token),`Plausibilitätslogik für Wolkenuntergrenzen fehlt: ${token}`);
assert.ok(source.includes('resolvedCeilingMinFt=ceilingMinFt,resolvedVisibilityMinM=visibilityMin,resolvedGustMaxKt=gustMax'),'Entfernte METAR-/TAF-Terminalwerte dürfen die lokalen zusammenfassenden Eventwerte nicht überschreiben.');
assert.ok(!source.includes("resolvedCeilingMinFt=hazardValue(items,'ceiling')"),'Amtliche Remote-Hazards dürfen nicht erneut als lokale Wolkenuntergrenze einsickern.');
assert.ok(workerSource.includes('value!==undefined&&value>=100&&value<=60000'),'Fehl-/Sentinelwerte unter 100 ft aus Terminal-Cloud-Layern müssen verworfen werden.');

const stripped=`${source.replace(/^import .*$/gm,'')}\nexport {weatherCodeSuggestsLowCeiling,isDiagnosedCeilingPlausible};`;
const output=ts.transpileModule(stripped,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'eventAviation.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-event-flight-ceiling-'));
try{
 const modulePath=path.join(tempDir,'eventAviation.mjs');
 fs.writeFileSync(modulePath,output.outputText);
 const module=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const {isDiagnosedCeilingPlausible,weatherCodeSuggestsLowCeiling}=module;
 assert.equal(weatherCodeSuggestsLowCeiling(45),true);
 assert.equal(weatherCodeSuggestsLowCeiling(1),false);
 assert.equal(isDiagnosedCeilingPlausible(80,20,10000,1),false,'<100 ft ohne Low-Cloud-/Sichtsupport darf nicht angezeigt werden.');
 assert.equal(isDiagnosedCeilingPlausible(80,82,1500,45),true,'<100 ft bleibt mit deutlichem Low-Cloud- und Nebelsignal zulässig.');
 assert.equal(isDiagnosedCeilingPlausible(500,20,10000,1),false,'Sub-1000-ft-Diagnosen ohne Stützsignal müssen verworfen werden.');
 assert.equal(isDiagnosedCeilingPlausible(500,80,10000,1),true,'Ausgeprägte Low-Cloud-Signale dürfen eine niedrige Untergrenze stützen.');
 assert.equal(isDiagnosedCeilingPlausible(1200,60,9000,1),true,'Moderate Low-Cloud-Signale bleiben für niedrigere, aber plausible Untergrenzen zulässig.');
 assert.equal(isDiagnosedCeilingPlausible(3200,10,10000,1),true,'Hohe Untergrenzen sollen nicht unnötig gefiltert werden.');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const changelog=fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8');
const implementation=fs.readFileSync(path.join(root,'MID_IMPLEMENTATION_0.9.66.14.md'),'utf8');
const test='scripts/test-event-flight-ceiling-plausibility-096615.mjs';
assert.equal(pkg.scripts?.['test:event-flight-ceiling-plausibility'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(changelog.includes('Flug-Event-Plausibilität für Wolkenuntergrenzen'));
for(const token of ['Flug-Event-Plausibilität für Wolkenuntergrenzen','cloud_cover_low','gute Sicht ≥ 10 km','unter 100 ft AGL'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);

console.log('Flug-Event-Plausibilität geprüft: implausible Diagnosen sehr tiefer Wolkenuntergrenzen werden bei guter Sicht gefiltert.');
