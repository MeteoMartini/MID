import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada'),read=path=>fs.readFileSync(path,'utf8');
const thunderSource=read('src/thunderstorm.ts'),fusion=read('src/forecastFusion.ts'),app=read('src/App.tsx'),workerSource=read('worker-src/00-core-observations.js'),contract=read('MID_DWD_RUC_PIPELINE_CONTRACT.md'),audit=read('MID_RUC_PARAMETER_AUDIT_0.9.73.11.md'),consistency=read('MID_FORECAST_CONSISTENCY_CONTRACT.md'),pkg=JSON.parse(read('package.json')),baseline=JSON.parse(read('MID_BASELINE.json'));
const test='scripts/test-thunder-numerical-ruc-097635.mjs';

const compile=(source,fileName)=>{const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);if(errors.length)throw new Error(errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));const module={exports:{}};new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));return module.exports};
const rapid=compile(fusion,'forecastFusion.ts'),thunder=compile(thunderSource,'thunderstorm.ts');

const strongSample={time:'2026-08-31T20:15',epoch:Date.now()+30*60000,precipitation:1.4,peakRateMmh:31,cape:1500,capeMu:1900,convectiveInhibition:35,cinMu:20,dbzCmax:53,lpiMax:380,uhMax:145,echoTopM:11200,updraftMax:16};
const strong=rapid.rapidThunderRisk(strongSample);
assert.ok(strong&&['likely','high'].includes(strong.level),`Stark gestützte Rapid-Konvektion erzeugt kein Gewitterrisiko: ${JSON.stringify(strong)}`);
assert.ok(strong.percent>=60,'Stark gestützte Rapid-Konvektion bleibt unter der Wahrscheinlichkeitsstufe.');
assert.equal(rapid.rapidThunderForecastCode(82,strong),95,'Mehrparameter-Rapid-Diagnose erzeugt keinen prognostischen WMO-95-Code.');
assert.equal(rapid.rapidThunderForecastCode(95,null),95,'Bestehender numerischer Gewittercode wird ohne Rapid unzulässig herabgestuft.');
const loneLpi=rapid.rapidThunderRisk({epoch:Date.now()+15*60000,lpiMax:1200,cape:0,capeMu:0,convectiveInhibition:20,precipitation:0,peakRateMmh:0,dbzCmax:10});
assert.equal(loneLpi,null,'Ein einzelnes LPI-Signal darf ohne Instabilität und Trigger kein synthetisches Gewitter erzeugen.');

const cell={id:'K3D-SHOWER',latitude:50.8,longitude:7.1,currentDistanceKm:12,siteBearingDeg:270,relevanceDistanceKm:10,forecastDistanceKm:8,forecastEffectiveDistanceKm:7,forecastUncertaintyKm:3,forecastTime:'2026-08-31T20:40:00Z',forecastLatitude:50.81,forecastLongitude:7.2,motionDirectionDeg:90,arrivalMinutes:25,isApproaching:true,severity:2,severityPrecise:2.2,trend:1,hailFlag:0,heavyRainFlag:1,gustFlag:1,lightningRate:0,areaHail:0,areaLargeHail:0,speedKmh:38,vilKgM2:45,maxReflectivityDbz:62,echoTopKm:9};
const nowcast={available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-08-31T20:00:00Z',ageMinutes:5,cellsFound:1,nearbyCells:[cell],nearest:cell,summary:'Starke Radarzelle'};
const rapidContext={level:strong.level,percent:strong.percent,signals:strong.signals,peakTime:strong.peakTime,peakEpoch:strong.peakEpoch,diagnostics:strong.diagnostics};
const observed=thunder.combineThunderstormInformation(nowcast,[],null,null,'Niederkassel',{rapidRisk:rapidContext});
assert.equal(observed?.phenomenon,'strong-shower','Blitzlose aktuelle KONRAD3D-Zelle wurde fälschlich als beobachtetes Gewitter umbenannt.');
assert.equal(observed?.sectionLabel,'Schauerinformation');
assert.ok(observed?.quickFacts?.some(item=>item.label==='Numerische Prognose'&&/Gewitter/.test(item.value)),'Unabhängige numerische Gewitterprognose fehlt bei blitzloser aktueller Schauerzelle.');
const forecastOnly=thunder.combineThunderstormInformation(null,[],null,null,'Niederkassel',{rapidRisk:rapidContext});
assert.equal(forecastOnly?.phenomenon,'thunderstorm','Rapid-Mehrparameterdiagnose darf ohne aktuelle Zelle kein prognostisches Gewitter erzeugen.');
assert.equal(forecastOnly?.sectionLabel,'Gewitterinformation');
const modelOnly=thunder.combineThunderstormInformation(null,[{epoch:Date.now()+30*60000,time:new Date(Date.now()+30*60000).toISOString(),code:95,cape:800}],null,null,'Niederkassel');
assert.equal(modelOnly?.phenomenon,'thunderstorm','Numerischer Gewitterforecast ohne Rapid-Daten wird nicht mehr erkannt.');

for(const token of ["export function rapidThunderRisk(sample:RapidThunderSample)","code=rapidThunderForecastCode(code,rapidThunder)"])assert.ok(fusion.includes(token),`15-min-Rapid-Gewitterintegration fehlt: ${token}`);
for(const token of ['significantRapidThunderRisk','modelRisk:thunderModelRisk3h','rapidRisk:thunderRapidRisk'])assert.ok(app.includes(token),`Appweite Gewitterfusion fehlt: ${token}`);
assert.ok(workerSource.includes('rapidForecastWeatherCode')&&!workerSource.includes('safeRapidThunderCode'),'Worker besitzt weiterhin einen Blitz-Gate für numerische Gewittercodes.');
assert.match(contract,/Aktuelle beobachtete Zellklassifikation/);
assert.match(contract,/Numerische Gewitterprognose/);
assert.match(contract,/kein aktueller Blitz.*niemals.*numerisch kein Gewitter möglich/i);
assert.match(audit,/prognostisches.*Gewittersignal/);
assert.match(consistency,/Beobachtete Zelle und numerische Gewitterprognose sind getrennte Aussagen/);
assert.match(consistency,/kein Gate für die numerische Prognose/);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue P0-Gewitterregression fehlt in requiredRegressionTests.');
assert.ok(baseline.regressionTests?.includes(test),'Neue P0-Gewitterregression fehlt im Regressionskatalog.');
console.log('P0-Gewittersemantik geprüft: Blitz klassifiziert Beobachtung; kanonische NWP/RUC-Mehrparameterdiagnostik darf unabhängig Gewitter prognostizieren.');
