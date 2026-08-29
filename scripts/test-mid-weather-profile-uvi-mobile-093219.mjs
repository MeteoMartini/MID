import {readFile} from 'node:fs/promises';
const [cockpit,shortTerm,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "import {formatDecimalFixed,formatUvi} from './format';",
 'Wolken gesamt / hoch / mittel / tief + UVI',
 'formatUvi(Number(selectedPoint.uvIndex))',
 "uvIndex:mean('uvIndex')"
]) if(!cockpit.includes(token)) failures.push(`ForecastCockpit fehlt: ${token}`);
for(const token of ['uvIndex?:number;','uvIndex:base.uvIndex']) if(!shortTerm.includes(token)) failures.push(`ShortTermForecast fehlt: ${token}`);
for(const token of [
 '/* MID v0.9.32.19 · flachere 24-h-Leiste auf Handydisplays */',
 '.cockpit-hourly-preview-shell{gap:5px;padding:7px 8px 6px',
 ".cockpit-hourly-chip{grid-template-columns:43px 42px minmax(0,1fr) auto;grid-template-areas:'day day day day' 'time temp main wind' 'rain rain rain rain'",
 '.cockpit-hourly-probability-track{height:3px}',
 '.cockpit-hourly-chip-main .mid-weather-pictogram{width:20px!important;height:20px!important}'
]) if(!styles.includes(token)) failures.push(`Mobile Styles fehlen: ${token}`);
for(const token of ['point.probability','point.precipitation','point.wind','point.gust','point.temperature','point.weatherLabel']) if(!cockpit.includes(token)) failures.push(`Parametervertrag fehlt: ${token}`);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv) failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID UVI-/Mobile-24h-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: UVI in Einzeldaten und flachere mobile 24-h-Leiste ohne Parameterverlust geprüft.');
