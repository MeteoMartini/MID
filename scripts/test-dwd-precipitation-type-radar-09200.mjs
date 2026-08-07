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

for(const token of [
 "DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",
 "DWD_DIRECT_IMAGE='https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png'",
 "buildWorkerUrl(base,'dwd-precipitation-type-image'",
 'export function dwdPrecipitationTypeCoverage',
 'Niederschlagsarten-Radar',
 'Nur innerhalb der Deutschland-Abdeckung',
 'export function dwdPrecipitationTypeImagePosition',
 'mercatorLatitude',
 'PRECIPITATION_TYPE_LEGEND',
 'großer Hagel',
 'kein Niederschlag',
 'Legende der Niederschlagsarten anzeigen',
 'transform:`translate(-${position.x.toFixed(6)}%, -${position.y.toFixed(6)}%)`'
])need('Radar-Komponente',component,token);

for(const token of [
 'showDwdPrecipitationTypeRadar:boolean',
 'showDwdPrecipitationTypeRadar:true',
 'parsed?.showDwdPrecipitationTypeRadar!==false',
 'DWD Niederschlagsarten-Radar',
 'showDwdPrecipitationTypeRadar={forecastDisplaySettings.showDwdPrecipitationTypeRadar}'
])need('App-Einstellung',app,token);

need('Cockpit-Ansicht',cockpit,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
need('Klassische Ansicht',shortTerm,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
need('Worker-Funktion',worker,"async function dwdPrecipitationTypeImageResponse()");
need('Worker-Route',worker,"if(mode==='dwd-precipitation-type-image')return dwdPrecipitationTypeImageResponse();");
need('Worker-Health',worker,"'dwd-precipitation-type-image'");
need('Responsive CSS',styles,'.dwd-precip-type-radar__viewport');
need('Responsive CSS mobil',styles,'.dwd-precip-type-radar__image{width:360%}');
need('Radar-Legende',styles,'.dwd-precip-type-radar__legend{');
need('Package-Test',pkg,'test:dwd-precipitation-type-radar');
need('Baseline-Test',baseline,'scripts/test-dwd-precipitation-type-radar-09200.mjs');

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
const numericVersion=packageVersion.split('.').map(value=>Number.parseInt(value,10));
if(numericVersion.length<4||numericVersion.some(value=>!Number.isFinite(value))||numericVersion[0]!==0||numericVersion[1]!==9||(numericVersion[2]===20&&numericVersion[3]<0)||numericVersion[2]<20)failures.push(`DWD-Radar setzt mindestens MID 0.9.20.0 voraus, gefunden ${packageVersion}`);
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
 console.error('DWD-Niederschlagsarten-Radar fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('DWD-Niederschlagsarten-Radar, Einstellungen, Classic/Cockpit-Einbindung und Worker-Proxy erfolgreich geprüft.');
