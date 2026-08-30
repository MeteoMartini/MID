import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript-strada')

const [radar,shortTerm,styles,worker,weather,operaOverlay,pkg,baseline]=await Promise.all([
 'src/RadarPanel.tsx','src/ShortTermForecast.tsx','src/styles.css','worker/metar-proxy.js','src/weather.ts','src/OperaRasterOverlay.tsx','package.json','MID_BASELINE.json'
].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 "const DWD_WARNING_LAYER='dwd:Warnungen_Gemeinden_vereinigt'",
 "label=\"Warnkarte\"",
 "layers:DWD_WARNING_LAYER",
 "warningOpacity",
 "const DWD_ISOBAR_LAYER='dwd:Icon_reg025_fd_sl_PMSL'",
 "const DWD_ISOHYPSE_LAYER='dwd:Icon_reg025_fd_pl_GH'",
 "DWD-ICON-Isobaren-WMS nicht verfügbar; MID-Konturen werden verwendet.",
 "lightningDisplayBlend=lightningRasterBlend.length?lightningRasterBlend",
 "vectorLightning=visibleLightning.length>0",
 "...(iso?{time:iso}:{})",
 "trackForecastLatitude",
 "trackForecastUncertaintyKm"
])need('Kompositbild',radar,token);
forbid('OPERA',radar,'sampleOperaRaster(raster,lat,lon,3)');
need('OPERA',radar,"if(!raster.width||!raster.height||!raster.values?.length)");
need('OPERA-Rendering',operaOverlay,"coarse||memory<=4||pixelCount>220000?2:1");
for(const token of [
 "trackForecast=forecasts.filter(row=>row.minutes>=10).at(-1)||forecasts.at(-1)",
 "trackForecastLatitude:trackForecast?.latitude",
 "'dwd:Warnungen_Gemeinden_vereinigt'",
 "'dwd:Icon_reg025_fd_sl_PMSL'",
 "'dwd:Icon_reg025_fd_pl_GH'",
 "'elevation'"
])need('Worker',worker,token);
for(const token of ['trackForecastLatitude?:number','trackForecastLongitude?:number','trackForecastUncertaintyKm?:number'])need('Wettervertrag',weather,token);
for(const token of [
 "import {DWD_WIND_THRESHOLDS_KMH} from './dwdWarnings'",
 'export function shortTermWindWarningLevel(',
 'gust={point.gust}',
 'short-term-wind-arrow',
 'wind-warning-level-4'
])need('Kurzfristwind',shortTerm+styles,token);
need('Package-Test',pkg,'test:composite-wms-lightning-k3d-wind');
need('Baseline-Test',baseline,'scripts/test-composite-wms-lightning-k3d-wind-08250.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08250-'));
try{
 let source=shortTerm.replace(/^import .*$/gm,'');
 source=`const React={createElement:(...args)=>({args})};\nconst useMemo=(factory)=>factory();const useState=(value)=>[value,()=>{}];\nconst CloudLightning=()=>null,Droplets=()=>null,Gauge=()=>null,Navigation=()=>null,Thermometer=()=>null,WindIcon=()=>null,WeatherPictogram=()=>null;\nconst significantHourlyThunderRisk=()=>null,precipitationParts=(input)=>({displayCode:input.code,weatherLabel:'',type:'none'}),label=()=>'',wind=()=>'',formatDecimal=()=>'';\nconst DWD_WIND_THRESHOLDS_KMH=[{threshold:50,level:1},{threshold:65,level:2},{threshold:90,level:2},{threshold:105,level:3},{threshold:120,level:3},{threshold:140,level:4}];\n${source}`;
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React},fileName:'ShortTermForecast.tsx'});
 const file=join(dir,'ShortTermForecast.mjs');await writeFile(file,out.outputText);const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const checks=[[26.99,0],[27.01,1],[35.1,2],[57,3],[76,4]];
 for(const[gust,expected]of checks){const actual=mod.shortTermWindWarningLevel(gust);if(actual!==expected)failures.push(`Kurzfristwind dynamisch: ${gust} kt → ${actual}, erwartet ${expected}`)}
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Komposit-/Warnkarten-/Blitz-/K3D-/Kurzfristwind-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('OPERA, Warnkarte, DWD-Modell-WMS, Blitzfallback, K3D-Zuggeometrie und Warnfarben der Kurzfrist-Windpfeile geprüft.');
