import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
  "points=useMemo(()=>adjusted.filter(point=>point.source==='hourly'),[adjusted])",
  'className="cockpit-short-insight-grid premium"',
  "cockpit-hourly-preview${hourlyExpanded",
  'shortTermCompactWeatherLabel(point.weatherLabel)',
  'className="cockpit-brief compact-fourteen"',
  '<small>Wärmster Zeitpunkt</small>',
  '<small>Niederschlagsspitze</small>'
])need('Cockpit-Shortterm-Insight',cockpit,token);
reject('Entfernte 1h/3h-Kurzfristaggregation',cockpit,'selectShortTermPoints(');
reject('Kurzfristkompass',cockpit,'Kurzfristkompass');
reject('Trendhelfer',cockpit,'shortTermTrendLabel(previewPoints)');
reject('Redundanter 14-Tage-Streuungstext',cockpit,'<strong>{uncertaintySummary(series,scenarios)}</strong>');

for(const token of [
  '.cockpit-short-insight-grid{',
  '.cockpit-hourly-preview{',
  '.cockpit-hourly-chip{',
  '.cockpit-brief.compact-fourteen{'
])need('CSS',styles,token);

need('Package-Test',pkg,'test:cockpit-shortterm-insight');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-insight-09171.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
  console.error('Kurzfrist-Insight-Cockpit fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Kurzfrist-Cockpit ohne separaten Kompass, mit Spotlights, stündlicher 24-Stunden-Vorschau und ohne 3-h-Auswahl erfolgreich geprüft.');
