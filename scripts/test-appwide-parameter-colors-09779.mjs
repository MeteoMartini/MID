import fs from 'node:fs';
import path from 'node:path';
const read=(file)=>fs.readFileSync(path.join(process.cwd(),file),'utf8');
const foundation=read('src/styles-src/00-foundation.css');
const features=read('src/styles-src/10-features.css');
const ensembleCss=read('src/styles-src/20-ensemble-composite.css');
const ensemble=read('src/EnsemblePanel.tsx');
const meteogram=read('src/MeteogramPanel.tsx');
const cockpit=read('src/ForecastCockpit.tsx');

const checks=[
  ['central parameter contract includes Tmin/Tmax/rain/pressure/wind/gust/cloud', ['--param-temperature-min:','--param-temperature-max:','--param-precipitation:','--param-pressure:','--param-wind:','--param-gust:','--param-cloud:'].every(token=>foundation.includes(token))],
  ['14d temperature range legend uses central Tmax',foundation.includes('.trend-legend i.area.max{background:color-mix(in srgb,var(--param-temperature-max)')],
  ['14d temperature range legend uses central Tmin',foundation.includes('.trend-legend i.area.min{background:color-mix(in srgb,var(--param-temperature-min)')],
  ['14d best-match temperature lines use central colours',foundation.includes('.trend-legend i.best-max{border-color:var(--param-temperature-max)}')&&foundation.includes('.trend-legend i.best-min{border-color:var(--param-temperature-min)}')],
  ['14d wind/gust legend uses central colours',features.includes('.wind-legend i.line.best.wind{border-color:var(--param-wind)}')&&features.includes('.wind-legend i.line.best.gust{border-color:var(--param-gust)}')&&features.includes('.wind-legend i.line.mean.wind{border-color:var(--param-wind)}')&&features.includes('.wind-legend i.line.mean.gust{border-color:var(--param-gust)}')],
  ['14d temperature chart uses central Tmin/Tmax colours',ensemble.includes('stopColor="var(--param-temperature-max)"')&&ensemble.includes('stopColor="var(--param-temperature-min)"')],
  ['14d climatology uses shared climate colours',ensemble.includes('stroke="var(--param-temperature-max-climate)"')&&ensemble.includes('stroke="var(--param-temperature-min-climate)"')],
  ['14d precipitation chart uses central precipitation colour',ensemble.includes('fill="var(--param-precipitation)"')&&ensemble.includes('stroke="var(--param-precipitation)"')],
  ['meteogram generic precipitation uses central precipitation colour',meteogram.includes("rain:'var(--param-precipitation)'")],
  ['meteogram line contract uses pressure/wind/gust variables',meteogram.includes("'pressure-line':{stroke:'var(--param-pressure)'}")&&meteogram.includes("'wind-line':{stroke:'var(--param-wind)'}")&&meteogram.includes("'gust-line':{stroke:'var(--param-gust)'}")],
  ['cockpit generic precipitation uses central precipitation colour',cockpit.includes("return'var(--param-precipitation)'")],
  ['cockpit day temperatures use central Tmin/Tmax colours',ensembleCss.includes('.cockpit-day-temps b{font-size:16px;color:var(--param-temperature-min)}')&&ensembleCss.includes('.cockpit-day-temps strong{font-size:22px;color:var(--param-temperature-max)}')],
  ['cockpit rain track uses central precipitation colour',ensembleCss.includes('.cockpit-rain-track>b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,color-mix(in srgb,var(--param-precipitation)')],
  ['cockpit wind and gust tracks use central colours',ensembleCss.includes('.cockpit-wind-track>i{background:var(--param-gust)')&&ensembleCss.includes('.cockpit-wind-track>b{background:var(--param-wind)}')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('App-wide parameter colour regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('App-wide parameter colour regression passed with',checks.length,'checks.');
