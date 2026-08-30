import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript-strada');
const [weather,thunder,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/detailThunderRisk.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "'cape','lifted_index','convective_inhibition','total_column_integrated_water_vapour'",
 'liftedIndex?:number',
 'convectiveInhibition?:number',
 'columnWaterVapour?:number',
 'liftedIndex=n(w.hourly.lifted_index?.[i],NaN)',
 'convectiveInhibition=n(w.hourly.convective_inhibition?.[i],NaN)',
 'columnWaterVapour:n(w.hourly.total_column_integrated_water_vapour?.[i],NaN)'
])need('Open-Meteo-Datenvertrag',weather,token);

for(const token of [
 'const capePoints=',
 'const liPoints=',
 'const inhibitionPenalty=',
 'const columnWaterPoints=',
 'const moisture=',
 'const trigger=',
 'const stronglyCapped=',
 'CAPE, Lifted Index, CIN sowie Feuchte- und Schauersignalen'
])need('Mehrindex-Diagnose',thunder,token);

need('Package-Test',pkg,'test:detail-thunder-indices');
need('Baseline-Test',baseline,'scripts/test-detail-thunder-indices-08196.mjs');

const compiled=ts.transpileModule(thunder,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'detailThunderRisk.ts'});
if(compiled.diagnostics?.length)failures.push('detailThunderRisk.ts konnte im Mehrindex-Test nicht transpiliert werden.');
else{
 const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
 const risk=module.significantHourlyThunderRisk;
 const cases=[
  ['WMO direkt',risk({code:95,cape:250,probability:20}), 'elevated'],
  ['WMO gestützt',risk({code:95,cape:1500,liftedIndex:-5,convectiveInhibition:35,temperature:24,dewPoint:18,humidity:72,columnWaterVapour:34,probability:60,showers:.4}), 'high'],
  ['Mehrindex hoch',risk({code:80,cape:1800,liftedIndex:-5,convectiveInhibition:30,temperature:24,dewPoint:18,humidity:70,columnWaterVapour:35,probability:65,showers:.5,precipitation:.8}), 'high'],
  ['Mehrindex erhöht',risk({code:80,cape:800,liftedIndex:-2.5,convectiveInhibition:60,temperature:20,dewPoint:15,humidity:65,columnWaterVapour:25,probability:50,showers:.1,precipitation:.2}), 'elevated'],
  ['starker Deckel',risk({code:3,cape:1900,liftedIndex:-5,convectiveInhibition:260,temperature:25,dewPoint:18,humidity:70,columnWaterVapour:35,probability:50,precipitation:.1}), null],
  ['keine Auslösung',risk({code:2,cape:2200,liftedIndex:-6,convectiveInhibition:20,temperature:28,dewPoint:17,humidity:55,columnWaterVapour:32,probability:10,precipitation:0,showers:0}), null],
  ['konservativer Fallback',risk({code:80,cape:1300,temperature:22,dewPoint:17,humidity:68,probability:55,showers:.3}), 'elevated']
 ];
 for(const [label,value,expected] of cases){const actual=value?.level??null;if(actual!==expected)failures.push(`${label}: erwartet ${expected}, erhalten ${actual}`)}
}

if(failures.length){console.error('Mehrindex-Gewitterdiagnose fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Mehrindex-Gewitterdiagnose geprüft: WMO-Code, CAPE, Lifted Index, CIN, Feuchte, Schauer und Auslösebedingungen werden kombiniert.');
