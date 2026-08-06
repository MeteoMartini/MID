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
  "points=useMemo(()=>selectShortTermPoints(adjusted,'1h')",
  'className="cockpit-short-insight"',
  'aria-label="Kurzfristkompass für die nächsten Stunden"',
  'className="cockpit-hourly-preview"',
  'shortTermTrendLabel(previewPoints)',
  'shortTermCompactWeatherLabel(point.weatherLabel)',
  'className="cockpit-brief compact-fourteen"'
])need('Cockpit-Shortterm-Insight',cockpit,token);

reject('Redundanter 14-Tage-Streuungstext',cockpit,'<strong>{uncertaintySummary(series,scenarios)}</strong>');

for(const token of [
  '.cockpit-short-insight{',
  '.cockpit-short-insight-grid{',
  '.cockpit-hourly-preview{',
  '.cockpit-hourly-chip{',
  '.cockpit-brief.compact-fourteen{'
])need('CSS',styles,token);

need('Package-Test',pkg,'test:cockpit-shortterm-insight');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-insight-09171.mjs');
need('Version',pkg,'"version": "0.9.18.3"');
need('Version',baseline,'"releaseVersion": "0.9.18.3"');

if(failures.length){
  console.error('Kurzfrist-Insight-Cockpit fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Grafische Kurzfrist-Insight-Zone und kompakter 14-Tage-Cockpitkopf erfolgreich geprüft.');
