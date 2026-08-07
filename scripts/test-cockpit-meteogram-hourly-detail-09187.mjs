import {readFile} from 'node:fs/promises';

const [cockpit,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
  'function shortTermPrecipitationParts(',
  'function shortTermVisibilityLabel(visibility:number)',
  'function shortTermEstimatedPrecipitationDuration(',
  'function shortTermThunderRiskLabel(',
  'function shortTermPrecipitationDetail(',
  'function shortTermWindDetail(',
  'chartWeatherPoints=chartPoints,chartWindPoints=chartPoints',
  'size={40}',
  'Math.round(selectedPoint.temperature)',
  'Math.round(selectedPoint.apparent)',
  'Niederschlag</dt><dd>{shortTermPrecipitationDetail(selectedPoint)}</dd>',
  'Gewitterrisiko',
  'Wind</dt><dd>{shortTermWindDetail(selectedPoint,unit)}</dd>',
  'shortTermVisibilityLabel(selectedPoint.visibility)',
  'style={{left:positionPct(item.x),top:`${item.weatherY}px`}}',
  "className={index%2?'offset':''}",
  'style={{left:positionPct(point.x),color:windSignalColor(point.gust)}}'
 ])need('ForecastCockpit.tsx',cockpit,token);

reject('Separate Niederschlagsform-Zeile',cockpit,'Niederschlagsform</dt>');
reject('Separate Niederschlagsdauer-Zeile',cockpit,'Niederschlagsdauer</dt>');
reject('Separate Böen-Zeile',cockpit,'Böen</dt>');
need('package.json',pkg,'test:cockpit-meteogram-hourly-detail');
need('MID_BASELINE.json',baseline,'scripts/test-cockpit-meteogram-hourly-detail-09187.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
  console.error('Stündliches 24-h-Meteogramm / Einzeldaten-Upgrade fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Stündliche Piktogramm-/Windfieder-Dichte sowie zusammengeführte Einzeldaten erfolgreich geprüft.');
