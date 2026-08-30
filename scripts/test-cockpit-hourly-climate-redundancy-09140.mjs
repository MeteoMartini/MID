import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [app,cockpit,tones,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/temperatureTone.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: redundanter Altstand ${token}`)};

for(const token of [
 "export type DailyTemperatureKind='min'|'max'",
 'export function dailyTemperatureTone(',
 "value-Number(climateMean)",
 "kind==='max'"
])need('Klimaton',tones,token);

for(const token of [
 "import {dailyTemperatureTone} from './temperatureTone'",
 'climate={climate}',
 'hourlyDetail={cockpitDetails?.sevenDay}',
 'className="cockpit-day-hourly-cue"',
 'className="cockpit-day-hourly-accordion"',
 'Stündlicher Tagesverlauf',
 'compactGustLabel(day.gust,unit)',
 "dailyTemperatureTone(day.max,climateDay?.maxMean,'max')",
 "activeHorizon==='fourteen-day'?cockpitDetails?.fourteenDay:undefined"
])need('Cockpit',cockpit,token);
forbid('Cockpit',cockpit,'details:{shortTerm?:ReactNode;sevenDay?:ReactNode;fourteenDay?:ReactNode}');
forbid('Cockpit',cockpit,'Vollständige Analyse öffnen');

for(const token of [
 "presentation?:'full'|'hourly-detail'",
 "const hourlyDetailOnly=presentation==='hourly-detail'",
 "hourlyDetailOnly?'1h':'3h'",
 "presentation=\"hourly-detail\"",
 'cockpit-hourly-forecast:',
 'showSevenDaySummary={false}',
 'compactMode={false}',
 "!hourlyDetailOnly&&<div className=\"forecastrows\"",
 "hourlyDetailOnly||(!inlineAccordionMode&&detailsOpen)",
 "dailyTemperatureTone(d.max,climateDay?.maxMean,'max')"
])need('App',app,token);
forbid('App',app,'sevenDaySummary={cockpitSevenDaySummary} details={{');

for(const token of [
 '.climate-tone{',
 'grid-template-areas:"date icon" "regime regime" "temps temps" "track track" "rain wind" "hourly hourly"',
 '.cockpit-day-hourly-cue{',
 '.cockpit-day-hourly-accordion{',
 '.cockpit-hourly-detail-source{',
 '.cockpit-hourly-detail-source>.hourdetail{margin:0;padding:0;border:0}'
])need('CSS',styles,token);

need('Package',pkg,'test:cockpit-hourly-climate-redundancy');
need('Baseline',baseline,'scripts/test-cockpit-hourly-climate-redundancy-09140.mjs');

for(const [file,source] of [['App.tsx',app],['ForecastCockpit.tsx',cockpit],['temperatureTone.ts',tones]]){
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName:file});
 const errors=(result.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 if(errors.length)failures.push(`${file}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join(' | ')}`);
}

if(failures.length){console.error('Cockpit-Stunden-/Klimafarb-/Redundanzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Klimabezogene Tagesfarben, stündliches Tagesakkordeon und redundanzfreie Cockpit-Ansichten geprüft.');
