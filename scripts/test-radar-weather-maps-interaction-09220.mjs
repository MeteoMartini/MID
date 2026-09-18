import {readFile} from 'node:fs/promises';

const [radar,maps,data,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of ['dwd-precip-type-radar__point-strip','Wolken + Niederschlagsart','<b>Radar</b>','<b>Sat</b>',"buildWorkerUrl(base,'dwd-precipitation-type-image'",'dwd-precip-type-radar__original-image'])need('DWD-Radarbild',radar,token);
for(const token of ['dwd-precipitation-type-image','dwd-precipitation-type-info','weather-map-grid','dwd-weather-map-wms'])need('Worker',worker,token);
for(const token of ['weather-maps-primary-controls','className="weather-maps-map-status"','className="weather-maps-timeline"','className="weather-maps-meta-details"',"product.category==='significant'"])need('Wetterkarten UI',maps,token);
reject('Keine alte separate Gültigkeitsbox',maps,'className="weather-maps-validity"');
for(const token of ['icon-d2-pressure-thetae','icon-d2-pressure-sigwx','icon-d2-pressure-precip','SIGWX / Wettercode'])need('Wetterkartendaten',data,token);
need('CSS',styles,'.dwd-precip-type-radar__original-viewport{');

const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion,wv=worker.match(/const WORKER_VERSION='([^']+)'/)?.[1];
if(pv!==bv||pv!==wv)failures.push(`Versionsabweichung: ${pv}/${bv}/${wv}`);

if(failures.length){
 console.error('Radar-/Wetterkarten-Upgrade fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Amtliches DWD-Originalprodukt und C14-Wetterkarten-Arbeitsraum mit gemeinsamer Zeitachse geprüft.');
