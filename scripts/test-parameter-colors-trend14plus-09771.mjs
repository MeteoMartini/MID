import fs from 'node:fs';
import path from 'node:path';

const css=fs.readFileSync(path.join(process.cwd(),'src','styles.css'),'utf8');
const source=fs.readFileSync(path.join(process.cwd(),'src','SubseasonalTrendPanel.tsx'),'utf8');

const checks=[
  ['central Tmax colour exists',css.includes('--param-temperature-max:#')],
  ['central Tmin colour exists',css.includes('--param-temperature-min:#')],
  ['central precipitation colour exists',css.includes('--param-precipitation:#')],
  ['central pressure colour exists',css.includes('--param-pressure:#')],
  ['central wind colour exists',css.includes('--param-wind:#')],
  ['central cloud colour exists',css.includes('--param-cloud:#')],
  ['central climate Tmax colour exists',css.includes('--param-temperature-max-climate:#')],
  ['central climate Tmin colour exists',css.includes('--param-temperature-min-climate:#')],
  ['trend temperature palette wired',css.includes('.subseasonal-trend.metric-temperature{--trend-color:var(--param-temperature-max)}')],
  ['trend precipitation palette wired',css.includes('.subseasonal-trend.metric-precipitation{--trend-color:var(--param-precipitation)}')],
  ['trend pressure palette wired',css.includes('.subseasonal-trend.metric-pressure{--trend-color:var(--param-pressure)}')],
  ['trend cloud palette wired',css.includes('.subseasonal-trend.metric-cloud{--trend-color:var(--param-cloud)}')],
  ['trend wind palette wired',css.includes('.subseasonal-trend.metric-wind{--trend-color:var(--param-wind)}')],
  ['no subseasonal gust selector remains',!source.includes('wind_gusts_10m_mean')&&!source.includes('Böen')],
  ['tooltip hit style present',css.includes('.subseasonal-chart .subseasonal-point-hit{position:absolute')],
  ['tooltip card is readable',css.includes('min-width:220px;max-width:min(340px,82vw)')&&css.includes('.subseasonal-tooltip-series{display:grid!important')],
  ['outer spread key uses lighter fill',css.includes('.outer-spread i{background:color-mix(in srgb,var(--trend-color) 10%,transparent)}')],
  ['inner spread key uses stronger fill',css.includes('.inner-spread i{background:color-mix(in srgb,var(--trend-color) 28%,transparent)')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Parameter colour + Trend 14d+ regression failed:');
  failed.forEach(([label])=>console.error(` - ${label}`));
  process.exit(1);
}
console.log('Parameter colour + Trend 14d+ regression passed with',checks.length,'checks.');
