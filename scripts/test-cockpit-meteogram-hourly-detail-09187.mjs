import {readFile} from 'node:fs/promises';

const [cockpit,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'function shortTermPrecipitationParts(',
  'function shortTermVisibilityLabel(visibility:number)',
  'function shortTermEstimatedPrecipitationDuration(',
  'function shortTermThunderRiskLabel(',
  'chartWeatherPoints=chartPoints,chartWindPoints=chartPoints',
  'size={40}',
  'Math.round(selectedPoint.temperature)',
  'Math.round(selectedPoint.apparent)',
  'Niederschlagsform',
  'Niederschlagsdauer',
  'Gewitterrisiko',
  'shortTermVisibilityLabel(selectedPoint.visibility)',
  'style={{left:positionPct(item.x),top:`${chartTop-31+(index%2)*18}px`}}',
  "className={index%2?'offset':''}",
  'style={{left:positionPct(point.x),color:windSignalColor(point.gust)}}'
])need('ForecastCockpit.tsx',cockpit,token);

need('package.json',pkg,'test:cockpit-meteogram-hourly-detail');
need('MID_BASELINE.json',baseline,'scripts/test-cockpit-meteogram-hourly-detail-09187.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
  console.error('Stündliches 24-h-Meteogramm / Einzeldaten-Upgrade fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Stündliche Piktogramm-/Windfieder-Dichte und erweiterte Einzeldaten erfolgreich geprüft.');
