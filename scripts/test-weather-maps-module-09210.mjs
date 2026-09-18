import {readFile} from 'node:fs/promises';

const files=Object.fromEntries(await Promise.all([
 ['app','../src/App.tsx'],
 ['modules','../src/dashboardModules.ts'],
 ['panel','../src/WeatherMapsPanel.tsx'],
 ['data','../src/WeatherMapsData.ts'],
 ['styles','../src/styles.css'],
 ['c14styles','../src/midC14MapWorkspace.css'],
 ['worker','../worker/metar-proxy.js'],
 ['index','../index.html'],
 ['pkg','../package.json'],
 ['baseline','../MID_BASELINE.json']
].map(async([key,path])=>[key,await readFile(new URL(path,import.meta.url),'utf8')])));

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

need('Splashscreen',files.index,'id="mid-boot-logo"');
need('Splashscreen Theme-Asset',files.index,'./mid-logo-light-horizontal.png');
need('Splashscreen Bildformat',files.index,'width="512" height="200"');
need('Splashscreen Theme',files.index,':root[data-theme=dark] #mid-boot-shell');
need('Splashscreen prominent',files.index,'width:min(86vw,520px)');
need('App Lazy Import',files.app,"lazy(()=>import('./WeatherMapsPanel'))");
need('App Modul',files.app,"case'weather-maps'");
need('Dashboard Definition',files.modules,"{id:'weather-maps',label:'Wetterkarten'");
need('Advanced only',files.modules,'advancedOnly:true');
need('Optional default',files.modules,"id==='weather-maps'?false:true");

for(const token of ['DWD ICON-D2','icon-d2-pressure-thetae','icon-d2-pressure-sigwx','icon-d2-pressure-precip','DWD ICON-EU','DWD ICON Global','DWD ICON-EPS','DWD AICON','DWD NowCastMIX','Geopotential / Höhenkarte','Vertikalbewegung / Omega','Signifikantes Wetter','Blitz-Kurzzeitvorhersage · 0 bis +2 h','Icon_reg025_fd_sl_TOTPREC24H','Icon-eps_reg025_fd_sl_VMAX10M12H','Aicon_reg025_fd_sl_UV10M'])need('Kartendaten',files.data,token);
reject('Keine Satellitenmodellquelle',files.data,'meteosat');
reject('Keine Satellitenkategorie',files.data,"'satellite'");

for(const token of [
 'Modell</span>',
 'className="weather-maps-primary-controls"',
 'Druckfläche',
 'Kartenbasis',
 'Deckkraft',
 'WmsTileLayer',
 'WeatherMapGridOverlay',
 'className="weather-maps-map-status"',
 'className="weather-maps-controls"',
 'className="weather-maps-timeline"',
 'leadTimeLabel(selectedTime,referenceTime)',
 'className="weather-maps-meta-details"',
 '<b>INIT</b>',
 '<b>Gültig</b>',
 'formatMapTime(selectedTime,timezone)'
])need('Kartenoberfläche',files.panel,token);
reject('Keine zweite dauerhafte Zeitschrittauswahl',files.panel,'<label><span>Zeitschritt</span>');
reject('Keine alte separate Gültigkeitsbox',files.panel,'className="weather-maps-validity"');

need('Responsive CSS',files.styles,'.weather-maps-panel');
for(const token of ['.weather-maps-panel.c14-map-workspace','.c14-map-workspace .weather-maps-controls','.weather-maps-meta-details','grid-template-columns:repeat(4,minmax(0,1fr))'])need('C14 Karten-CSS',files.c14styles,token);

need('Worker Allowlist',files.worker,'WEATHER_MAP_LAYER_CONFIG');
need('Worker WMS',files.worker,"mode==='weather-map-wms'");
need('Worker Metadaten',files.worker,"mode==='weather-map-metadata'");
need('Workspace-Layer-Abgleich',files.worker,'wmsLayerNameMatches');
need('Worker ICON-D2 Raster',files.worker,"mode==='weather-map-grid'");
need('Worker D2 Modellfallback',files.worker,"modelCandidates=['dwd_icon_d2','icon_d2']");

const packageVersion=JSON.parse(files.pkg).version;
const baselineVersion=JSON.parse(files.baseline).releaseVersion;
const workerVersion=files.worker.match(/const WORKER_VERSION='([^']+)';/)?.[1]??'';
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(packageVersion!==workerVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, worker ${workerVersion}`);
need('Baseline Test',files.baseline,'scripts/test-weather-maps-module-09210.mjs');

if(failures.length){
 console.error('Splashscreen-/Wetterkartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Wetterkartenmodul mit ICON-D2-Kombinationskarten, gemeinsamer C14-Zeitachse und einklappbaren INIT-/Gültig-Details erfolgreich geprüft.');
