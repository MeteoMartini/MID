import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const [app,thunder,ensemble,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/detailThunderRisk.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "import {DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD,significantHourlyThunderRisk} from './detailThunderRisk';",
 'currentThunderRisk=significantHourlyThunderRisk(currentHour)',
 'className="hour-tooltip-precipitation"',
 'className={`hourly-thunder-risk ${currentThunderRisk.level}`}',
 '⚡ {currentThunderRisk.percent} %',
 'currentThunderRisk.percent} %'
])need('Tagesdetail',app,token);
for(const token of [
 "const directThunder=[95,96,97,99].includes(code)",
 "if(directThunder){const normalizedScore=Math.max(score,6);return{level:'elevated'",
 'const instability=',
 'const moisture=',
 'const trigger=',
 'const stronglyCapped=',
 'function thunderRiskPercent(',
 'percent:thunderRiskPercent(' 
])need('Gewitterrisiko',thunder,token);
for(const token of [
 "precipVisualSize:'small'|'large';",
 "const size=amount>=largeThreshold?'large' as const:'small' as const;",
 "function PrecipitationGlyph({type,size,thunder}",
 "const scale=size==='large'?1.08:.9",
 'precipitationOffset=thunder?-4.4:0',
 'strokeLinejoin="round"',
 'size={row.precipVisualSize}',
 "function EnsemblePrecipShape({cx,cy,row,boxWidth,boxHeight}",
 "row.precipVisualType==='none')return null",
 "<PrecipitationGlyph type={row.precipVisualType}"
])need('Ensemble-Symbolik',ensemble,token);
if(ensemble.includes('precipVisualCount')||ensemble.includes('count:1|2|3'))failures.push('Die alte Mehrfachsymbolik mit ein bis drei Tropfen/Flocken ist noch vorhanden.');
for(const token of ['.hour-tooltip-precipitation em{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}', '.hourly-thunder-risk.high{color:#e66b54}'])need('Kompakt-CSS',styles,token);
need('Package-Test',pkg,'test:detail-thunder-ensemble-precip');
need('Baseline-Test',baseline,'scripts/test-detail-thunder-ensemble-precip-08195.mjs');

const compiled=ts.transpileModule(thunder,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'detailThunderRisk.ts'});
if(compiled.diagnostics?.length)failures.push('detailThunderRisk.ts konnte im Regressionstest nicht transpiliert werden.');
else{
 const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
 const risk=module.significantHourlyThunderRisk;
 const cases=[
  ['WMO-Gewitter',risk({code:95,cape:300,probability:20}), 'elevated'],
  ['WMO-schwer',risk({code:99,cape:200,probability:10}), 'high'],
  ['Mehrindex-hoch',risk({code:80,cape:1800,liftedIndex:-5,convectiveInhibition:30,temperature:24,dewPoint:18,humidity:70,columnWaterVapour:35,probability:65,showers:.5}), 'high'],
  ['Mehrindex-erhöht',risk({code:80,cape:800,liftedIndex:-2.5,convectiveInhibition:60,temperature:20,dewPoint:15,humidity:65,columnWaterVapour:25,probability:50,showers:.1}), 'elevated'],
  ['nicht-signifikant',risk({code:3,cape:900,probability:15,precipitation:0}), null]
 ];
 for(const [label,value,expected] of cases){const actual=value?.level??null;if(actual!==expected)failures.push(`${label}: erwartet ${expected}, erhalten ${actual}`)}
 const percentCases=[
  ['Direktes Gewitter-Prozent',risk({code:95,cape:300,probability:20}), [65,82]],
  ['Mehrindex-hoch-Prozent',risk({code:80,cape:1800,liftedIndex:-5,convectiveInhibition:30,temperature:24,dewPoint:18,humidity:70,columnWaterVapour:35,probability:65,showers:.5}), [72,88]]
 ];
 for(const [label,value,[min,max]] of percentCases){const actual=value?.percent??null;if(actual===null||actual<min||actual>max)failures.push(`${label}: erwarteter Prozentbereich ${min}-${max}, erhalten ${actual}`)}
}

if(failures.length){console.error('Detail-Gewitter/Ensemble-Niederschlag-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tagesdetail-Gewitterrisiko und vereinfachte Ensemble-Niederschlagssymbolik geprüft.');
