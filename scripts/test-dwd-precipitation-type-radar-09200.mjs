import {readFile} from 'node:fs/promises';

const [component,app,cockpit,shortTerm,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
 "DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",
 "DWD_DIRECT_IMAGE='https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png'",
 "buildWorkerUrl(base,'dwd-precipitation-type-image'",
 'export function dwdPrecipitationTypeCoverage',
 'Niederschlagsarten-Radar',
 'export function dwdPrecipitationTypeImagePosition',
 'IMAGE_BOUNDS.north-latitude',
 'PRECIPITATION_TYPE_LEGEND',
 'großer Hagel',
 'kein Niederschlag',
 'Legende der Niederschlagsarten anzeigen',
 'transform:`translate(-${position.x.toFixed(6)}%, -${position.y.toFixed(6)}%)`',
 "fetchWorkerJson<RadarMeta>('dwd-precipitation-type-meta'",
 "fetchWorkerJson<RadarPointInfo>('dwd-precipitation-type-info'",
 'Radar / Niederschlagsart',
 'Satellit / Wolken',
 'Standortmarker ausblenden'
])need('Radar-Komponente',component,token);
reject('Radar-Verortung',component,'mercatorLatitude');

for(const token of [
 'showDwdPrecipitationTypeRadar:boolean','showDwdPrecipitationTypeRadar:true','parsed?.showDwdPrecipitationTypeRadar!==false','DWD Niederschlagsarten-Radar','showDwdPrecipitationTypeRadar={forecastDisplaySettings.showDwdPrecipitationTypeRadar}'
])need('App-Einstellung',app,token);
need('Cockpit-Ansicht',cockpit,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
need('Klassische Ansicht',shortTerm,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
for(const token of ["async function dwdPrecipitationTypeImageResponse()","async function dwdPrecipitationTypeMeta()","async function dwdPrecipitationTypeInfo(request)","if(mode==='dwd-precipitation-type-image')return dwdPrecipitationTypeImageResponse();","mode==='dwd-precipitation-type-meta'","mode==='dwd-precipitation-type-info'","'dwd-precipitation-type-info'"])need('Worker',worker,token);
for(const token of ['.dwd-precip-type-radar__viewport','.dwd-precip-type-radar__legend{','.dwd-precip-type-radar__point-info','.dwd-precip-type-radar__timestamps','backdrop-filter:blur(10px)'])need('Radar-CSS',styles,token);
need('Package-Test',pkg,'test:dwd-precipitation-type-radar');
need('Baseline-Test',baseline,'scripts/test-dwd-precipitation-type-radar-09200.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(failures.length){console.error('DWD-Niederschlagsarten-Radar fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Niederschlagsarten-Radar inkl. linearer Verortung, Zeitständen, transparenter Markierung und Klickanalyse erfolgreich geprüft.');
