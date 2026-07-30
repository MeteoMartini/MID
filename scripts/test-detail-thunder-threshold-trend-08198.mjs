import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [app,thunder,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/detailThunderRisk.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 'export const DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD=30;',
 "if(!stronglyCapped&&instability>=1.5&&moisture>=1&&trigger>=1&&score>=2.8)",
 'percent>=DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD'
])need('30-Prozent-Schwelle',thunder,token);
for(const token of [
 "import {DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD,significantHourlyThunderRisk} from './detailThunderRisk';",
 'hourlyThunderRisks=dayHours.map(hour=>significantHourlyThunderRisk(hour))',
 'thunderRiskPercent=Math.max(0,...hourlyThunderRisks.map(risk=>risk.percent))',
 'stormy=thunderRiskPercent>=DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD||thunderDirect',
 "directThunder||maxThunderRisk>=70?'wechselhaft mit Gewittern'",
 "maxThunderRisk>=50?'wechselhaft mit erhöhtem Gewitterrisiko':'wechselhaft mit Gewitterrisiko'"
])need('Trend-Konsistenz',app,token);
if(app.includes('maxCape>=700&&day.probability>=45'))failures.push('Die alte CAPE-/Tageswahrscheinlichkeits-Ersatzregel ist weiterhin aktiv.');
need('Package-Test',pkg,'test:detail-thunder-threshold-trend');
need('Baseline-Test',baseline,'scripts/test-detail-thunder-threshold-trend-08198.mjs');
const compiled=ts.transpileModule(thunder,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'detailThunderRisk.ts'});
if(compiled.diagnostics?.length)failures.push('detailThunderRisk.ts konnte nicht transpiliert werden.');
else{
 const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`),risk=module.significantHourlyThunderRisk;
 const threshold=risk({code:80,cape:500,liftedIndex:-1.5,convectiveInhibition:55,temperature:22,dewPoint:16,humidity:66,columnWaterVapour:24,probability:48,showers:.08,precipitation:.1});
 if(!threshold||threshold.percent<30)failures.push(`Ein plausibles Mehrindexsignal ab 30 % wird nicht ausgegeben: ${threshold?.percent??'null'}`);
 const capeOnly=risk({code:2,cape:1800,liftedIndex:-4,convectiveInhibition:20,temperature:28,dewPoint:15,humidity:50,columnWaterVapour:25,probability:10,showers:0,precipitation:0});
 if(capeOnly)failures.push(`CAPE ohne Feuchte/Auslösung erzeugt weiterhin ein Signal: ${capeOnly.percent} %`);
}
if(failures.length){console.error('Gewitterrisiko-Schwelle/Trend-Konsistenz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gewitterrisiko ab 30 % und konsistente 7-Tage-Trenddiagnose geprüft.');
