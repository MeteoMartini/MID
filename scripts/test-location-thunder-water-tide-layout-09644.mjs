import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url),require=createRequire(import.meta.url),ts=require('typescript-strada');
const [riskSource,water,app,mountain,sourceStyles,builtStyles,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('src/detailThunderRisk.ts',root),'utf8'),
 readFile(new URL('src/WaterSportsPanel.tsx',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/mountainSports.ts',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.4.md',root),'utf8')
]);

const compile=source=>{const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'contract.ts'});assert.equal(output.diagnostics?.length??0,0,'TypeScript-Vertragslogik lässt sich nicht transpilierten.');return output.outputText};
const dir=await mkdtemp(join(tmpdir(),'mid-09644-'));
try{
 const riskFile=join(dir,'risk.mjs');await writeFile(riskFile,compile(riskSource));
 const risk=await import(`${pathToFileURL(riskFile).href}?v=${Date.now()}`);
 assert.equal(risk.significantPeriodThunderRisk([{code:1,cape:2600,temperature:31,dewPoint:5,humidity:22,showers:0,precipitation:0,probability:5}],6),null,'CAPE allein darf kein Orts-Gewitterrisiko erzeugen.');
 const combined={code:80,cape:1200,liftedIndex:-4,convectiveInhibition:20,columnWaterVapour:35,temperature:25,dewPoint:19,humidity:78,showers:.5,precipitation:.6,probability:65,time:'2026-08-21T15:00',epoch:1787324400000};
 assert.ok(risk.significantPeriodThunderRisk([combined],6),'Kombinierte Instabilitäts-, Feuchte- und Auslösesignale müssen ein Risiko ergeben.');
 const period=risk.significantPeriodThunderRisk([combined,{...combined,code:97,time:'2026-08-21T16:00',epoch:1787328000000}],6);
 assert.equal(period.peakIndex,1,'Die Periodenlogik muss das stärkste unterstützte Stundensignal auswählen.');
 assert.equal(period.directThunder,true,'Direkter WMO-Gewittercode muss im Periodenergebnis erhalten bleiben.');

 const start=water.indexOf('type TideEvent='),end=water.indexOf('function tideAnalysis(');
 assert.ok(start>=0&&end>start,'Tidenhub-Hilfslogik ist nicht isolierbar.');
 const tideFile=join(dir,'tide.mjs');await writeFile(tideFile,compile(`type MarineForecast={hourly:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};\n${water.slice(start,end)}\nexport {completeTideRange};`));
 const {completeTideRange}=await import(`${pathToFileURL(tideFile).href}?v=${Date.now()}`);
 const pair=completeTideRange([{kind:'high',time:'2026-08-21T10:00',level:.42},{kind:'low',time:'2026-08-21T16:10',level:-.36}]);
 assert.equal(Number(pair?.range.toFixed(2)),.78,'Tidenhub muss die vollständige absolute Hoch-/Niedrigwasserdifferenz sein.');
 assert.equal(completeTideRange([{kind:'high',time:'a',level:.3},{kind:'high',time:'b',level:.2}]),undefined,'Zwei gleichartige Wendepunkte sind kein vollständiger Tidenhub.');
 assert.equal(completeTideRange([{kind:'low',time:'a',level:-.2}]),undefined,'Ein einzelner Wendepunkt ist kein vollständiger Tidenhub.');
}finally{await rm(dir,{recursive:true,force:true})}

for(const token of [
 'const locationThunderRisk=useMemo(',
 'thunderRisk={locationThunderRisk}',
 "label:'Niederschlag'",
 'thunderRiskInline=thunderRisk&&thunderRisk.percent>=30',
 'Schauer-/Gewittersignal',
 'metric-inline-pill',
 'function mountainHourlyThunderRisk(',
 'function mountainRapidThunderRisk(',
 'function mountainCombinedThunderPercent(',
 'score-=mountainConvectivePenalty(convectiveRisk)',
 "risks.push(ruc?'Gewitter-/Konvektionssignal · Höhenmodell + ICON-D2-RUC':'Gewitter-/Konvektionssignal aus Mehrparameteranalyse')",
 '<MountainZoneAnalysis data={data} days={days} rapidMinutes15={rapidMinutes15}/>'
])assert.ok(app.includes(token),`App-Vertrag fehlt: ${token}`);
assert.equal((app.match(/thunderRisk=\{locationThunderRisk\}/g)||[]).length,2,'Aktuell und Wassersport müssen exakt dasselbe 6-h-Risiko erhalten.');
assert.ok(!app.includes("label:'Gewitterrisiko'"),'Die eigenständige aktuelle Kachel „Gewitterrisiko“ muss entfernt bleiben.');
assert.ok(app.includes('WeatherPictogram code={Number.isFinite(currentWeatherCode)?currentWeatherCode:61}'),'Die Niederschlagskachel muss das appweite Weather Icon System 2.0 verwenden.');
assert.ok(!app.includes("risks.push('Gewitterrisiko')"),'CAPE-only-Bergsignal darf nicht als Gewitterrisiko bezeichnet werden.');
assert.ok(!app.includes("risks.push('erhöhte konvektive Instabilität')"),'Die Höhenzonenanalyse darf CAPE nicht mehr als eigenständige Gefahrenaussage verwenden.');

for(const token of [
 'thunderRisk:PeriodThunderRisk|null',
 'const currentHour=hours[currentIndex(hours)]??hours[0],effectiveThunderPercent=Math.max(thunderRisk?.percent??0,rapidThunderRisk?.percent??0)',
 'function completeTideRange(',
 "label=\"Gewitterrisiko\"",
 'Tidenhub · vollständige Tide',
 'Wasserstand aktuell',
 'function TideSparkline(',
 'water-wave-group',
 'water-flow-group',
 'water-weather-group',
 'rapidThunderRisk?:RapidThunderRisk|null',
 "detail={rapidThunderRisk?'kanonische Ortsanalyse + ICON-D2-RUC Mehrparameter · nächste 6 h'"
])assert.ok(water.includes(token),`Wassersport-Vertrag fehlt: ${token}`);
assert.ok(!water.includes('hour.cape>=800')&&!water.includes('point.cape>=800'),'Wassersport enthält noch einen CAPE-Sonderweg.');
assert.ok(!water.includes('Spanne 24 h'),'Ein angebrochener 24-h-Ausschnitt darf nicht mehr als Tidenhub erscheinen.');

for(const token of ["thunderVariables=['lifted_index','convective_inhibition','total_column_integrated_water_vapour']",'...thunderVariables'])assert.ok(mountain.includes(token),`Höhen-Gewitterparameter fehlen: ${token}`);
const marker='/* MID v0.9.64.4 · gruppierte Wassersport-Übersicht, einheitliches Gewitterrisiko und vollständiger Tidenhub. */';
for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const section=styles.slice(styles.lastIndexOf(marker));assert.ok(section.startsWith(marker),`${name}: v0.9.64.4-Layoutregeln fehlen.`);
 for(const token of ['.water-panel-toolbar','.water-metric-group>div','.water-tide-card','.water-tide-sparkline','@media(max-width:700px)','grid-template-columns:repeat(2,minmax(0,1fr))'])assert.ok(section.includes(token),`${name}: responsive Gruppierung fehlt: ${token}`);
 assert.ok(section.includes('min-width:0')&&section.includes('overflow:hidden'),'Kompaktlayout schützt nicht vor abgeschnittenem horizontalem Inhalt.');
}

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-location-thunder-water-tide-layout-09644.mjs';
assert.ok(pkg.version.localeCompare('0.9.64.4',undefined,{numeric:true,sensitivity:'base'})>=0,'Korrektur benötigt mindestens Wartungsrelease v0.9.64.4.');
assert.equal(pkg.scripts?.['test:location-thunder-water-tide-layout'],`node ${test}`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Neue Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.4.md'),'Implementierungsvertrag fehlt in requiredFiles.');
for(const token of ['Gewitterrisiko','6 Stunden','CAPE allein','Wassersport','Tidenhub','Hoch-/Niedrigwasserpaar','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);

console.log(`${pkg.version}: einheitliches Orts-Gewitterrisiko, gruppierte Wassersport-Übersicht und vollständiger Tidenhub geschützt.`);
