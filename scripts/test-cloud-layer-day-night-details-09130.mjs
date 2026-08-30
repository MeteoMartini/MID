import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const [weather,pictogram,app,cockpit,shortTerm,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherPictogram.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'midCloud?:number;highCloud?:number',
 "'cloud_cover_mid','cloud_cover_high'",
 'midCloud=n(w.hourly.cloud_cover_mid?.[i],NaN)',
 'highCloud=n(w.hourly.cloud_cover_high?.[i],NaN)',
 'cloud,lowCloud,midCloud,highCloud'
])need('Wolkenfelder',weather,token);

for(const token of [
 "export type CloudLayerKind='none'|'low'|'mid'|'high'|'layered'|'convective'|'unspecified'",
 'export function cloudLayerKind(',
 "return'convective'",
 "return'layered'",
 "return dominant",
 'function StratusCloud(',
 'function MidCloud(',
 'function HighCloud(',
 'function LayeredCloud(',
 'function ConvectiveCloud(',
 'data-cloud-layer={layer}',
 'cloudLayerDescription(layer)'
])need('Professionelle Wetterpiktogramme',pictogram,token);

for(const token of [
 'function WeatherPeriodIcons(',
 'className="weather-period-night"',
 'function windDirectionShort(direction:number)',
 'function detailListPrecipLabel(hour:Hour)',
 "function detailHoursByResolution(hours:Hour[],resolution:'3h'|'1h')",
 "if(resolution==='1h')return hours",
 'Math.floor(clock/3)*3',
 "precipitation:sum('precipitation')",
 "probability:maximum('probability')",
 "setDetailsOpen(current=>isActive?!current:true)",
 "className={`forecast-inline-detail-row ${selectedHour===index?'active':''}`}",
 'className="detail-resolution-switch"',
 'className="forecast-inline-detail"',
 'Mehr anzeigen',
 '>3 h</button>',
 '>1 h</button>',
 "detailResolution==='3h'?'Dreistündliches':'Stündliches'"
])need('Tages-/Nachtansicht und Details',app,token);

for(const token of [
 'className="cockpit-day-weather-pair"',
 'className="cockpit-day-night-icon"',
 'midCloud={dayVisual.midCloud}',
 'highCloud={nightVisual.highCloud}'
])need('Cockpit-Tag/Nacht',cockpit,token);

for(const token of [
 'midCloud?:number;',
 'highCloud?:number;',
 'midCloud={point.midCloud}',
 'highCloud={point.highCloud}'
])need('Kurzfrist-Piktogramme',shortTerm,token);

for(const token of [
 '.weather-period-icons{',
 '.weather-period-night{',
 '.detail-resolution-switch{',
 '.forecast-inline-detail{',
 '.forecast-inline-detail-row{',
 '.cockpit-day-weather-pair{',
 '.cockpit-day-night-icon{',
 '@media(max-width:480px)'
])need('Responsive Piktogramm-CSS',styles,token);

need('Package-Test',pkg,'test:cloud-layer-day-night-details');
need('Baseline-Test',baseline,'scripts/test-cloud-layer-day-night-details-09130.mjs');

for(const [source,fileName] of [[pictogram,'WeatherPictogram.tsx'],[app,'App.tsx'],[cockpit,'ForecastCockpit.tsx'],[shortTerm,'ShortTermForecast.tsx']]){
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true,fileName});
 const errors=(result.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 if(errors.length)failures.push(`${fileName}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join(' | ')}`);
}

if(failures.length){console.error('Wolkenschicht-/Tag-Nacht-/Tagesdetail-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wolkenschichtfähige Piktogramme, Tag-/Nacht-Paare und 3-h-/1-h-Tagesdetails geprüft.');
