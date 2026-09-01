import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(path.join(process.cwd(),'src','SubseasonalTrendPanel.tsx'),'utf8');

const checks=[
  ['trend panel title',source.includes('Witterungstrend · Tag 15–46')],
  ['week blocks start at day 15',source.includes('for(let start=14;start<time.length;start+=7)')],
  ['ecmwf seasonal endpoint',source.includes("const SEASONAL_ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal'")],
  ['gefs ensemble endpoint',source.includes("const ENSEMBLE_ENDPOINT='https://ensemble-api.open-meteo.com/v1/ensemble'")],
  ['wind unit forced to knots for consistency',source.includes("wind_speed_unit:'kn'")],
  ['tmax metric requested',source.includes("api:'temperature_2m_max'")],
  ['tmin metric requested',source.includes("api:'temperature_2m_min'")],
  ['gust metric requested when available',source.includes("api:'wind_gusts_10m_mean'")],
  ['climate alignment uses weekly time axis',source.includes('function findClimateWeekIndex(weeklyTimes:string[],week:TrendWeek,fallbackIndex:number)')],
  ['climate lookup avoids hard-coded last-week mismatch',source.includes('const exactStart=weeklyTimes.indexOf(week.startDate);')],
  ['equal-weight multi-model resampling retained',source.includes('contributors.flatMap(samples=>resample(samples))')],
  ['point tooltip hit areas present',source.includes('className={`subseasonal-point-hit ${activeIndex===point.index?\'active\':\'\'}`}')],
  ['point tooltip content present',source.includes('className="subseasonal-point-tooltip"')],
  ['ec46-only tail-period note present',source.includes('Ab Tag 36 steht derzeit nur EC46 zur Verfügung')],
  ['comparison list label reflects metric',source.includes('<h4>{def.label} je Wochenblock</h4>')]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Trend 14d+ regression failed:');
  failed.forEach(([label])=>console.error(` - ${label}`));
  process.exit(1);
}

console.log('Trend 14d+ regression passed with',checks.length,'checks.');
