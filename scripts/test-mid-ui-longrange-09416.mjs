import {readFile} from 'node:fs/promises';
const [app,moduleSettings,symbols,overlay,panel,seasonal,longRange,styles,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DashboardModuleSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/precipitationTypeSymbols.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[],need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ["type FavoriteStripMode='auto'|'always'|'hidden'","favoriteStripMode==='always'","favoriteStripMode!=='hidden'","<strong>Dauerhaft</strong>","<strong>Aus</strong>",'className="module-shell-toggle" onClick={toggle}'])need('App',app,token);
for(const legacy of ["Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>12","Date.now()-lastTouchToggle.current<450","touchGesture=useRef"])if(app.includes(legacy))failures.push(`App: veraltete parallele Modul-Touchlogik vorhanden ${legacy}`);
for(const token of ['defaultDashboardModuleSettings','Standard wiederherstellen'])need('Dashboard defaults',moduleSettings,token);
for(const token of ["graupel:{label:'Graupel / Eiskörner'","'snow-grains':{label:'Schneekörner'","hail:{label:'Hagel'",'const hex=','const star=','const drop='])need('Niederschlagssymbole',symbols,token);
for(const token of ['precipitationTypeSymbolSvg(item.phase)','Layer aktiv · aktuell keine festen/gemischten Niederschlagsarten im sichtbaren Ausschnitt'])need('Phasenoverlay',overlay,token);
need('Radarstatus',panel,'Phasendaten nicht erreichbar');
for(const token of ['temperatureAnomalyQ25','temperatureAnomalyQ75','precipitationAnomalyQ25','precipitationAnomalyQ75'])need('Seasonal quantiles',seasonal,token);
for(const token of ['low:quantile(centers,.1)','q25:quantile(centers,.25)','q75:quantile(centers,.75)','high:quantile(centers,.9)','innerCount=Math.max(1,Math.ceil(normalised.length/2))','anomaly-plume outer','anomaly-plume inner'])need('LongRange plume',longRange,token);
for(const token of ['.radar-phase-symbol>span,.radar-phase-symbol-shape{display:block;width:19px;height:15px','.long-range-chart .anomaly-plume.outer{opacity:.62','.long-range-chart .anomaly-plume.inner{opacity:.78','.module-shell-toggle{touch-action:manipulation'])need('Styles',styles,token);
if(!baseline.includes('scripts/test-mid-ui-longrange-09416.mjs'))failures.push('Baseline: neuer Regressionstest fehlt');
if(failures.length){console.error('MID v0.9.40.16 UI/Langfrist-Vertrag fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID UI/Langfrist: Favoritenleiste, Defaults, Touch, meteorologische Symbole, Status und P10/P90+P25/P75 geschützt.');
