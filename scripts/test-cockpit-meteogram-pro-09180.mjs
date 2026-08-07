import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const needPattern=(label,text,pattern)=>{if(!pattern.test(text))failures.push(`${label}: ${pattern}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
  'function ecmwfTemperatureLineColor(value:number)',
  'chartSourcePoints=points.slice(0,Math.min(points.length,25))',
  'chartWidth=Math.max(1040,chartViewportWidth)',
  'chartViewportRef',
  'ResizeObserver',
  "points=useMemo(()=>selectShortTermPoints(adjusted,'1h')",
  'className="cockpit-meteogram-pro__svg"',
  '<linearGradient id={temperatureGradientId}',
  'className="temperature-line"',
  'className="apparent-line"',
  'className="cockpit-meteogram-pro__legend"',
  'Temperatur (ECMWF)',
  'Stündlich · vollständig sichtbar',
  '<dt><i className="dew"/>Taupunkt</dt><dd>{Math.round(selectedPoint.dewPoint)} °C</dd>',
  '[hourlyExpanded,setHourlyExpanded]=useState(false)',
  "hourlyExpanded?'weniger anzeigen':'mehr anzeigen'"
])need('Meteogramm',cockpit,token);

for(const token of [
  '--mg-shell:#0a1727',
  '--mg-plot:#102238',
  ':root[data-theme=light] .cockpit-meteogram-pro{',
  '--mg-shell:#ffffff',
  '--mg-plot:#f7f8f8',
  '.cockpit-meteogram-pro__svg .plot-bg{fill:var(--mg-plot)',
  '.cockpit-meteogram-pro__legend i.temperature{width:24px;height:4px;border-radius:999px;background:linear-gradient',
  '@media(max-width:760px){',
  '.cockpit-hourly-preview.collapsed>.cockpit-hourly-chip:nth-child(n+7){display:none}',
  '.cockpit-hourly-more{display:inline-flex}'
])need('Theme/Responsive-CSS',styles,token);

needPattern('Theme/Responsive-CSS',styles,/\.cockpit-meteogram-pro__stage\s*\{[^}]*width:100%[^}]*max-width:100%[^}]*overflow:(?:visible|clip)[^}]*\}/s);
needPattern('Theme/Responsive-CSS',styles,/\.cockpit-meteogram-pro__canvas\s*\{[^}]*position:relative[^}]*width:100%[^}]*min-width:0[^}]*max-width:100%[^}]*\}/s);
reject('Alte zweispaltige Diagrammgrid im neuen Markup',cockpit,'className="cockpit-short-diagram-grid"');
reject('Ungenutzter Sichtweiten-Helfer',cockpit,'function shortTermVisibilityText');
reject('Horizontales Meteogramm-Scrollen',styles,'.cockpit-meteogram-pro__stage{width:100%;max-width:100%;overflow-x:auto;');
reject('Feste mobile Mindestbreite',styles,'.cockpit-meteogram-pro__canvas{min-width:720px}');
reject('Tages-/Datums-Textlayer am Plot',cockpit,'className="cockpit-meteogram-pro__overlay day"');
need('Einzeldatenfeld unter dem Diagramm',cockpit,'className="cockpit-meteogram-pro__datafield"');
reject('1h/3h-Umschalter',cockpit,'aria-label="Auflösung der Kurzfristvorhersage"');
reject('Hartcodierte weiße Meteogrammfläche',styles,'.cockpit-meteogram-pro__svg .plot-bg{fill:#fff');
need('Package-Script',pkg,'test:cockpit-meteogram-pro');
need('Baseline-Test',baseline,'scripts/test-cockpit-meteogram-pro-09180.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(failures.length){console.error('Professionelles Meteogramm fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Vollständig sichtbares, fest einstündiges Dark-/Light-Mode-Meteogramm erfolgreich geprüft.');
