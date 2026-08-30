import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript-strada')

const files=['src/WeatherPictogram.tsx','src/App.tsx','src/thunderPlaceCache.ts','src/EnsemblePanel.tsx','src/ShortTermForecast.tsx','src/WaterSportsPanel.tsx','src/TravelPlannerPanel.tsx','src/RouteWeatherPanel.tsx','src/iso3166.ts','src/styles.css','package.json','MID_BASELINE.json'];
const values=await Promise.all(files.map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const [pictogram,app,thunderCache,ensemble,shortTerm,water,travel,route,iso,styles,pkg,baseline]=values;
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 "export type WeatherPictogramKind=",
 "if(c===45)return'fog'",
 "if(c===48)return'rime-fog'",
 "if([56,57].includes(c))return'freezing-drizzle'",
 "if([66,67].includes(c))return'freezing-rain'",
 "if([68,69,83,84].includes(c))return'sleet'",
 "if([96,99].includes(c))return'thunder-hail'",
 '<FogLines/>',
 '<FogLines rime/>',
 'viewBox="0 0 68 68"',
 'className={`mid-weather-pictogram'
])need('Piktogrammsystem',pictogram,token);
forbid('Piktogrammsystem',pictogram,'🌫️');
forbid('Piktogrammsystem',pictogram,'background');

for(const [area,text] of [['App',app],['Ensemble',ensemble],['Kurzfrist',shortTerm],['Wasser',water],['Reise',travel],['Route',route]])need(area,text,"from './WeatherPictogram'");
for(const [area,text] of [['App',app],['Ensemble',ensemble],['Kurzfrist',shortTerm],['Wasser',water],['Reise',travel],['Route',route]])forbid(area,text,'{icon(');

for(const token of ["const THUNDER_PLACE_CACHE_KEY='mid:thunder-place-cache:v3'",'export function appendIsoCountry(','return candidate?appendIsoCountry(candidate,location.country_code||location.country)'])need('Gewitter-Ortsnamen · Cache',thunderCache,token);
need('Gewitter-Ortsnamen · App',app,'thunderLocationName=thunderPlaceNames.site||appendIsoCountry(');
need('ISO-Modul',iso,'export function isoAlpha3');
need('ISO-Modul',iso,'"DE":"DEU"');
need('ISO-Modul',iso,'"AT":"AUT"');
need('ISO-Modul',iso,'"NL":"NLD"');
need('Piktogramm-CSS',styles,'.mid-weather-pictogram{display:inline-block;');
need('Package-Test',pkg,'test:weather-pictograms-country-codes');
need('Baseline-Test',baseline,'scripts/test-weather-pictograms-country-codes-08230.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08230-'));
try{
 const compile=async(name,source)=>{const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:name});const path=join(dir,`${name}.mjs`);await writeFile(path,out.outputText);return import(`${pathToFileURL(path).href}?v=${Date.now()}`)};
 const isoModule=await compile('iso3166',iso);
 const cases=[['DE','DEU'],['Deutschland','DEU'],['AT','AUT'],['Niederlande','NLD'],['CH','CHE'],['GBR','GBR']];
 for(const [input,expected] of cases){const actual=isoModule.isoAlpha3(input);if(actual!==expected)failures.push(`ISO-Dynamik: ${input} → ${actual}, erwartet ${expected}`)}
 const kindMatch=pictogram.match(/export function weatherPictogramKind[\s\S]*?\n}\n\nexport function cloudLayerKind/);
 if(!kindMatch)failures.push('Piktogramm-Dynamik: weatherPictogramKind konnte nicht isoliert werden.');
 const source=String(kindMatch?.[0]||'').replace(/\n\nexport function cloudLayerKind$/,'');
 const pictureModule=await compile('WeatherPictogramKinds',source);
 const kinds=new Map([[0,'clear'],[1,'mostly-clear'],[2,'partly-cloudy'],[3,'cloudy'],[45,'fog'],[48,'rime-fog'],[51,'drizzle'],[56,'freezing-drizzle'],[61,'rain'],[66,'freezing-rain'],[68,'sleet'],[71,'snow'],[77,'snow-grains'],[80,'showers'],[85,'snow-showers'],[95,'thunder'],[96,'thunder-hail']]);
 for(const [code,expected] of kinds){const actual=pictureModule.weatherPictogramKind(code);if(actual!==expected)failures.push(`Piktogramm-Dynamik: WMO ${code} → ${actual}, erwartet ${expected}`)}
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Wetterpiktogramm-/ISO-Ländercode-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Transparente Wetterpiktogramme für alle WMO-Gruppen und dreistellige ISO-3166-Ländercodes in Gewitter-Ortsnamen geprüft.');
