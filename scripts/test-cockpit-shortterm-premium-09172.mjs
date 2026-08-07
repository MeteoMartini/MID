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
  'timelinePoints=hourlyPoints.slice(0,Math.min(24,hourlyPoints.length))',
  'className="cockpit-short-insight-grid premium"',
  'className="cockpit-meteogram-pro"',
  '24-h-Meteogramm',
  'Temperaturmittel mit ECMWF-Farbverlauf',
  'Stündlich · vollständig sichtbar',
  'className="cockpit-hourly-preview-shell"',
  'Kompakte 24-h-Zeitachse',
  '<small>Wärmster Zeitpunkt</small>',
  '<small>Niederschlagsspitze</small>'
])need('Kurzfrist-Premium-Cockpit',cockpit,token);

for(const token of [
  '.cockpit-meteogram-pro{',
  ':root[data-theme=light] .cockpit-meteogram-pro{',
  '@media(max-width:760px){'
])need('CSS',styles,token);

needPattern('CSS',styles,/\.cockpit-meteogram-pro__stage\s*\{[^}]*width:100%[^}]*max-width:100%[^}]*overflow:(?:visible|clip)[^}]*\}/s);
needPattern('CSS',styles,/\.cockpit-meteogram-pro__canvas\s*\{[^}]*position:relative[^}]*width:100%[^}]*min-width:0[^}]*max-width:100%[^}]*\}/s);

reject('Altes konfliktanfälliges Diagramm-Markup',cockpit,'className="cockpit-short-diagram-shell"');
need('Einzeldatenfeld',cockpit,'className="cockpit-meteogram-pro__datafield"');
reject('Horizontales Meteogramm-Scrollen',styles,'.cockpit-meteogram-pro__stage{width:100%;max-width:100%;overflow-x:auto;');
reject('1h/3h-Umschalter',cockpit,'aria-label="Auflösung der Kurzfristvorhersage"');
reject('Entfernter Kurzfristkompass',cockpit,'Kurzfristkompass');
reject('Entfernter Trendhelfer',cockpit,'shortTermTrendLabel(previewPoints)');
need('Package-Test',pkg,'test:cockpit-shortterm-premium');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-premium-09172.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(failures.length){console.error('Kurzfrist-Premium-Layout fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Eigenständiges, vollständig sichtbares 24-h-Kurzfrist-Meteogramm mit Einzeldatenfeld geprüft.');
