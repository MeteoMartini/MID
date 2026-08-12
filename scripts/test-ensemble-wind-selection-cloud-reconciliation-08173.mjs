import {readFile} from 'node:fs/promises';

const [panel,weather,app]=await Promise.all([
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "const ENSEMBLE_WIND_MODE_KEY='mid:ensemble:wind-mode'",
  'function storedEnsembleWindMode():WindChartMode',
  "localStorage.getItem(ENSEMBLE_WIND_MODE_KEY)==='gust'?'gust':'wind'",
  'useState<WindChartMode>(storedEnsembleWindMode)',
  'localStorage.setItem(ENSEMBLE_WIND_MODE_KEY,windMode)',
  '},[windMode]);'
])need('Persistente Wind-/Böenauswahl',panel,token);

for(const token of [
  "export type CloudObservation='cavok'|'clear'|'layers'",
  'cloudObservation?:CloudObservation',
  'cloudAnalysisMethod?:string',
  'function metarCloudObservation(row:any):CloudObservation|undefined',
  "if(/\\bCAVOK\\b/.test(raw))return'cavok'",
  'cloudObservation:metarCloudObservation(r)',
  'function reconcileHyperlocalCloudCover(',
  "station.cloudObservation==='cavok'",
  'nearestClear<=45000',
  'clearWeight>=Math.max(.08,cloudyWeight*1.25)',
  "Aktuelle METAR-Sichtmeldung (CAVOK) berücksichtigt",
  'cloudReconciliation=reconcileHyperlocalCloudCover(ranked,cloudCover.value,direct?.cloudCover,target.cloudCover)',
  'cloudCover:cloudReconciliation.value',
  'cloudAnalysisMethod:cloudReconciliation.method'
])need('Hyperlokale Wolkenkorrektur',weather,token);

for(const token of [
  'cloudSource=advancedMode&&fresh&&st?.cloudAnalysisMethod?',
  'detail:`${cloudBaseDetail}${cloudOktasText(cloud).split(\' · \')[1]} · ${cloudSource}`'
])need('Transparente Bewölkungsquelle',app,token);

if(panel.includes("[windMode,setWindMode]=useState<WindChartMode>('wind')"))failures.push('Die Wind-/Böenauswahl startet weiterhin bei jedem Öffnen starr mit Wind.');
if(weather.includes("cloudCover:cloudCover.value===undefined?direct?.cloudCover:clampNumber(cloudCover.value,0,100)"))failures.push('Die hyperlokale Bewölkung verwendet weiterhin ausschließlich die Restfeldanalyse ohne METAR-Konsolidierung.');

if(failures.length){console.error('Ensemble-/Hyperlokalprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Auswahl und Hyperlokalanalyse geprüft: Wind/Böen wird gespeichert; explizite aktuelle METAR-Sicht- und Wolkenmeldungen können fehlerhafte Modellbewölkung begrenzen.');
