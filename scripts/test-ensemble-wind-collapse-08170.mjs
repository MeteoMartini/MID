import {readFile} from 'node:fs/promises';

const [panel,weather,worker,styles,app]=await Promise.all([
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "type EnsembleExportKind='temperature'|'precipitation'|'wind'",
  "type WindChartMode='wind'|'gust'",
  'function EnsembleChartCollapse',
  "storedEnsembleChartOpen('temperature')",
  "storedEnsembleChartOpen('precipitation')",
  "storedEnsembleChartOpen('wind')",
  'function WindTrendChart',
  'function WindLegend',
  'function WindTooltip',
  "onClick={()=>setMode('wind')}",
  "onClick={()=>setMode('gust')}",
  'dataKey={lowKey}',
  'dataKey={bandKey}',
  'dataKey={meanKey}',
  'dataKey={bestKey}',
  '<h3>Wind und Böen</h3>',
  'kind="temperature" open={temperatureOpen}',
  'kind="precipitation" open={rainOpen}',
  'kind="wind" open={windOpen}'
])need('Ensemble-Diagramme',panel,token);

const rainIndex=panel.indexOf('<h3>Niederschlag</h3>'),windIndex=panel.indexOf('<h3>Wind und Böen</h3>');
if(rainIndex<0||windIndex<0||windIndex<rainIndex)failures.push('Das Wind-/Böendiagramm steht nicht unterhalb des Niederschlagsdiagramms.');
if(panel.includes("compact=exporting?false:useCompactEnsembleChart()"))failures.push('Der responsive Windchart ruft einen Hook weiterhin bedingt auf.');

for(const token of [
  'wind?:number;gust?:number;',
  'windMean:number;windLow:number;windHigh:number;windQ25:number;windQ75:number;gustMean:number;gustLow:number;gustHigh:number;gustQ25:number;gustQ75:number;',
  "const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v11:'",
  "windKeys=keys.filter(k=>/^wind_speed_10m",
  "gustKeys=keys.filter(k=>/^wind_gusts_10m",
  'wind=d.w.length?Math.max(...d.w):NaN',
  'gust=d.g.length?Math.max(...d.g):NaN',
  'windLow=windVals.length>=6?weightedQuantile(windVals,.1):NaN',
  'windQ25=windVals.length>=6?weightedQuantile(windVals,.25):NaN',
  'gustHigh=gustVals.length>=6?weightedQuantile(gustVals,.9):NaN',
  'gustQ75=gustVals.length>=6?weightedQuantile(gustVals,.75):NaN',
  "hourly='temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,sunshine_duration'",
  "wind_speed_unit:'kn'"
])need('Ensemble-Winddaten',weather,token);

for(const token of [
  "'wind_speed_10m'",
  "'wind_gusts_10m'",
  "wind_speed_unit:'kn'"
])need('Worker-Ensembleproxy',worker,token);

for(const token of [
  '.ensemble-chart-collapse{',
  '.ensemble-chart-collapse[aria-expanded="false"] svg{transform:rotate(-90deg)}',
  '.chart.wind-trend{',
  '.wind-mode-switch{',
  '.wind-legend{',
  '.ensemble-wind-plot{',
  '@media(max-width:620px){'
])need('Ensemble-Wind-/Einklapp-Styling',styles,token);

for(const token of [
  '.metrics .sun-moon-card{min-height:0}',
  '.metrics .sun-moon-card>strong{display:block;margin-top:6px;font-size:clamp(13px,.95vw,16px);',
  '.sun-moon-time-block b{display:block;color:var(--text);font:inherit;'
])need('Kompakte Sonne-/Mond-Werte',styles,token);
for(const token of ['<small>Aufgang</small>','<small>Untergang</small>'])need('Kompakte Sonne-/Mond-Beschriftung',app,token);

if(failures.length){console.error('Ensemble-Wind-/Einklappprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble geprüft: Wind/Böen mit P10–P90, P25–P75, Best Match und ENS-Mittel; alle drei Diagramme sind einklappbar und die Sonne-/Mond-Werte bleiben kompakt.');
