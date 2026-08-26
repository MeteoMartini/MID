import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','sunshineDuration.ts'),'utf8');
const require=createRequire(import.meta.url),ts=require('typescript');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'sunshineDuration.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-sunshine-coherence-'));
try{
 const modulePath=path.join(tempDir,'sunshineDuration.mjs');fs.writeFileSync(modulePath,output.outputText);
 const sunshine=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const screenshotCase=sunshine.reconcileSunshineDuration({valueSeconds:3600,intervalSeconds:3600,isDay:true,weatherCode:61,precipitation:.1,rain:.1,showers:0,precipitationProbability:66,cloudCover:80,lowCloudCover:80});
 assert.equal(screenshotCase.valueSeconds,600,'stratiformer Regen mit dichter tiefer Bewölkung darf keine volle Sonnenstunde behalten');
 assert.equal(screenshotCase.reason,'stratiform-precipitation');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:3600,isDay:false,weatherCode:0}),0,'Nacht muss Sonnenschein auf 0 begrenzen');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:3600,intervalSeconds:3600,daylightSeconds:1800,isDay:false,weatherCode:0}),1800,'ein Stundenintervall am Sonnenuntergang muss seinen tatsächlichen Tageslichtanteil behalten');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:3600,intervalSeconds:3600,daylightSeconds:0,isDay:true,weatherCode:0}),0,'explizit fehlende Tageslichtüberdeckung muss Vorrang vor einem punktuellen Tagstatus haben');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:null,isDay:true,weatherCode:0}),null,'fehlende Sonnenscheindauer bleibt fehlend');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:3600,isDay:true,weatherCode:1,precipitation:0,precipitationProbability:66,cloudCover:20}),3600,'Wahrscheinlichkeit allein darf Sonnenscheindauer nicht in eine Dauer umdeuten');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:3600,isDay:true,weatherCode:80,precipitation:.1,rain:0,showers:.1,precipitationProbability:66,cloudCover:80,lowCloudCover:80}),3600,'Schauer müssen Sonnenregen fachlich zulassen');
 assert.equal(sunshine.coherentSunshineDurationSeconds({valueSeconds:900,intervalSeconds:900,isDay:true,weatherCode:61,precipitation:.1,rain:.1,showers:0,precipitationProbability:66,cloudCover:80,lowCloudCover:80}),150,'15-Minuten-Werte müssen denselben relativen Konsistenzvertrag verwenden');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const cockpit=fs.readFileSync(path.join(root,'src','ForecastCockpit.tsx'),'utf8');
assert.ok(!cockpit.includes('shortTermEstimatedPrecipitationDuration'),'Niederschlagswahrscheinlichkeit wird weiterhin in fiktive Minuten umgerechnet');
assert.ok(!/intervalMinutes\s*\*\s*clamp\(point\.probability/.test(cockpit),'PoP-zu-Dauer-Formel ist weiterhin vorhanden');
assert.ok(cockpit.includes('Der Prozentwert beim Niederschlag ist die Eintrittswahrscheinlichkeit im Bezugsintervall, keine Regendauer'),'fachliche Erläuterung im Stundenprofil fehlt');
assert.ok(cockpit.includes('sunshineValues.reduce((total,value)=>total+Math.max(0,value),0)'),'3-h-Sonnenschein wird nicht summiert');
assert.ok(cockpit.includes('sunshineMinutesLabel(selectedPoint.sunshineDuration,shortTermIntervalMinutes(selectedPoint))'),'3-h-Anzeige ist weiterhin auf 60 Minuten begrenzt');
assert.ok(!cockpit.includes('sunshineDuration:Number(hour.sunshineDuration)||0'),'fehlende Stundenwerte werden weiterhin als 0 min ausgegeben');

const mapping=fs.readFileSync(path.join(root,'src','weather-src','20-mapping-day-character.tsfrag'),'utf8');
const fusion=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
const shortTerm=fs.readFileSync(path.join(root,'src','ShortTermForecast.tsx'),'utf8');
const worker=fs.readFileSync(path.join(root,'worker-src','00-core-observations.js'),'utf8');
for(const [name,text,needles] of [
 ['Mapping',mapping,['coherentSunshineDurationSeconds','reconcileSunshineDuration','mapMinutely15','recentSunshineDuration']],
 ['Forecast-Finalisierung',fusion,['coherentSunshineDurationSeconds','reconcileForecastHourPrecipitation','finalizeForecastMinute15']],
 ['Kurzfristpfad',shortTerm,['coherentSunshineDurationSeconds','intervalSeconds:intervalMinutes*60']],
 ['Native Widget',worker,['coherentWidgetSunshineSeconds','sunshineDurationSeconds=coherentWidgetSunshineSeconds']]
])for(const needle of needles)assert.ok(text.includes(needle),`${name}: appweiter Konsistenzpfad fehlt: ${needle}`);

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const test='scripts/test-sunshine-precipitation-coherence-096613.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(a.length,b.length);index++){const x=a[index]??0,y=b[index]??0;if(x!==y)return x>y}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.66.13'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:sunshine-precipitation-coherence'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.13.md'));

console.log('MID 0.9.66.13: PoP wird nicht als Regendauer ausgegeben; Sonnenscheindauer ist von 15 min bis Tag, Event und Widget zeitlich kohärent.');
