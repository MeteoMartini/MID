import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const modern=await readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
assert.match(modern,/MID v0\.9\.84\.70 · Visualisierungs-Audit Block 1/,'Visualisierungs-Audit fehlt');
const contracts=[
 ['Klima-Achse',/\.climate-chart text\{font-size:10\.5px\}/],
 ['Klima-Legende',/\.climate-legend,\.climate-wind-legend span,\.climate-cloud-legend span\{font-size:var\(--mid-text-micro\)!important\}/],
 ['Meteogramm-Achse',/\.meteogram-axis-label,\.meteogram-axis-unit\{font-size:9px!important\}/],
 ['Meteogramm-Tooltip',/\.meteogram-tooltip\{font-size:11px!important/],
 ['Ensemble-Achse',/recharts-cartesian-axis-tick tspan\{font-size:10px!important\}/],
 ['Ensemble-Tooltip',/\.ensemble-pro-tooltip,\.rain-tooltip,\.trend-tooltip\{font-size:11px!important/],
 ['7-Tage-Tag',/\.seven-day-curve-days>button>b\{font-size:11px\}/],
 ['7-Tage-Achse',/\.seven-day-curve-axis-label,\.seven-day-curve-day-label\{font-size:9px\}/],
 ['Langfrist-Skala',/\.long-range-scale\{font-size:10px/],
 ['Subseasonal-Legende',/\.subseasonal-chart-legend\{font-size:10\.5px!important/],
 ['Synoptik-Legende',/\.synoptic-map-legend\{font-size:10px!important/]
];
for(const [name,pattern] of contracts)assert.match(modern,pattern,`${name} wurde nicht lesbar standardisiert`);
const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>readFile(new URL(`../src/styles-src/${name}`,import.meta.url),'utf8')));
assert.equal(styles,modules.join(''),'styles.css ist nicht mit den kanonischen Modulen synchron');
console.log('OK visualization readability 098470');
