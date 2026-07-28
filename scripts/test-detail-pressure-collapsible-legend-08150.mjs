import {readFile} from 'node:fs/promises';

const [app,styles,weather]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "type DetailLineKey='temperature'|'apparent'|'dewPoint'|'pressure'",
 "pressure:true",
 "const DETAIL_LEGEND_STORAGE_KEY='mid:detailLegendOpen'",
 'initialDetailLegendOpen',
 'detailLegendOpen',
 'setDetailLegendOpen(value=>!value)',
 'aria-controls="mid-detail-legend"',
 'className="pressureline"',
 "toggleDetailLine('pressure')",
 'showPressureSection',
 'pressureScale=niceRange',
 'const yPressure=',
 'const pressurePath=',
 'pressure-grid-',
 'stroke="#c48cff"',
 '<small>Luftdruck</small>',
 'pressureTrendLabel',
 '<small>Bewölkung / UVI</small>'
])need('Tagesdetail-Luftdruck/Legende',app,token);

if(app.includes("if('cancelIdleCallback'in window)"))failures.push('Die fehleranfällige Window-Narrowing-Prüfung für cancelIdleCallback ist noch vorhanden.');
for(const token of ['idleWindow.cancelIdleCallback?.','if(!idleWindow.cancelIdleCallback)window.clearTimeout'])need('Favoriten-Persistenz-Buildfix',app,token);
if(app.includes('<small>Bewölkung</small>')&&app.includes('<small>UVI</small>'))failures.push('Bewölkung und UVI sind weiterhin als getrennte Tagesdetail-Kacheln vorhanden.');

for(const token of [
 '.detail-legend-shell',
 '.detail-legend-toggle',
 '.detaillegend i.pressureline',
 '@media(max-width:760px)',
 '.hour-tooltip-grid.compact>span{padding:6px 7px}'
])need('Responsive Gestaltung',styles,token);

for(const token of [
 "pressure:n(w.hourly.pressure_msl?.[i],NaN)",
 "'pressure_msl'"
])need('Luftdruck-Datenpfad',weather,token);

if(failures.length){console.error('Tagesdetail-Luftdruck/Legenden-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tagesdetail geprüft: Luftdruckverlauf und -kachel, zusammengefasste Bewölkung/UVI-Kachel, persistente einklappbare Legende sowie TypeScript-Buildfix sind vorhanden.');
