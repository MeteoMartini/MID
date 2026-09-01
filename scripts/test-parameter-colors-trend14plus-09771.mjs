import fs from 'node:fs';
import path from 'node:path';

const css=fs.readFileSync(path.join(process.cwd(),'src','styles.css'),'utf8');

const checks=[
  ['trend color default uses Tmax palette',css.includes('.subseasonal-trend{--trend-color:var(--param-temperature-max)}')],
  ['tmax palette wired',css.includes('.subseasonal-trend.metric-temperature-max{--trend-color:var(--param-temperature-max)}')],
  ['tmin palette wired',css.includes('.subseasonal-trend.metric-temperature-min{--trend-color:var(--param-temperature-min)}')],
  ['gust palette wired',css.includes('.subseasonal-trend.metric-gust{--trend-color:var(--param-gust)}')],
  ['metric selector has tmax accent',css.includes('.subseasonal-metric-selector button.metric-temperature-max{--metric-color:var(--param-temperature-max)}')],
  ['metric selector has tmin accent',css.includes('.subseasonal-metric-selector button.metric-temperature-min{--metric-color:var(--param-temperature-min)}')],
  ['metric selector has gust accent',css.includes('.subseasonal-metric-selector button.metric-gust{--metric-color:var(--param-gust)}')],
  ['tooltip hit style present',css.includes('.subseasonal-chart .subseasonal-point-hit{position:absolute')],
  ['tooltip card style present',css.includes('.subseasonal-chart .subseasonal-point-tooltip{position:absolute')],
  ['legend uses trend color',css.includes('.subseasonal-chart-legend i{display:inline-block;width:24px;height:0;border-top:2px solid var(--trend-color)}')]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Parameter colour + tooltip regression failed:');
  failed.forEach(([label])=>console.error(` - ${label}`));
  process.exit(1);
}

console.log('Parameter colour + tooltip regression passed with',checks.length,'checks.');
