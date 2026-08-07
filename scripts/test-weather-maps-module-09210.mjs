import {readFile} from 'node:fs/promises';

const files=Object.fromEntries(await Promise.all([
 ['app','../src/App.tsx'],['modules','../src/dashboardModules.ts'],['panel','../src/WeatherMapsPanel.tsx'],['data','../src/WeatherMapsData.ts'],['styles','../src/styles.css'],['worker','../worker/metar-proxy.js'],['index','../index.html'],['pkg','../package.json'],['baseline','../MID_BASELINE.json']
].map(async([key,path])=>[key,await readFile(new URL(path,import.meta.url),'utf8')])));
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('Splashscreen',files.index,'id="mid-boot-logo"');
need('Splashscreen',files.index,'width="156" height="156"');
need('Splashscreen',files.index,'width:min(42vw,156px)');
need('App Lazy Import',files.app,"lazy(()=>import('./WeatherMapsPanel'))");
need('App Modul',files.app,"case'weather-maps'");
need('App Modul',files.app,'title="Wetterkarten"');
need('Dashboard ID',files.modules,"|'weather-maps'");
need('Dashboard Definition',files.modules,"{id:'weather-maps',label:'Wetterkarten'");
need('Advanced only',files.modules,'advancedOnly:true');
need('Optional default',files.modules,"id==='weather-maps'?false:true");
for(const token of ['DWD ICON-EU','DWD ICON Global','DWD ICON-EPS','DWD NowCastMIX','DWD Meteosat','Geopotential / Höhenkarte','Signifikantes Wetter · Analyse'])need('Kartendaten',files.data,token);
for(const token of ['Modell / Quelle','Zeitschritte','Druckfläche','Kartenbasis','Deckkraft','WMSTileLayer'])need('Kartenoberfläche',files.panel,token);
need('Responsive CSS',files.styles,'.weather-maps-panel');
need('Responsive CSS',files.styles,'@media(max-width:620px)');
need('Worker Allowlist',files.worker,'WEATHER_MAP_LAYER_CONFIG');
need('Worker WMS',files.worker,"mode==='weather-map-wms'");
need('Worker Metadaten',files.worker,"mode==='weather-map-metadata'");
const packageVersion=JSON.parse(files.pkg).version;
const baselineVersion=JSON.parse(files.baseline).releaseVersion;
const workerVersion=files.worker.match(/const WORKER_VERSION='([^']+)';/)?.[1]??'';
const versionParts=value=>String(value).split('.').map(part=>Number.parseInt(part,10)||0);
const versionAtLeast=(value,minimum)=>{const left=versionParts(value),right=versionParts(minimum);for(let index=0;index<Math.max(left.length,right.length);index+=1){const a=left[index]??0,b=right[index]??0;if(a>b)return true;if(a<b)return false}return true};
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(packageVersion!==workerVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, worker ${workerVersion}`);
if(!versionAtLeast(packageVersion,'0.9.21.0'))failures.push(`Wetterkartenmodul erwartet mindestens MID v0.9.21.0, gefunden: v${packageVersion}`);
need('Baseline Test',files.baseline,'scripts/test-weather-maps-module-09210.mjs');

if(failures.length){console.error('Splashscreen-/Wetterkartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Großer MID-Splashscreen und optionales erweitertes Wetterkartenmodul erfolgreich geprüft.');
