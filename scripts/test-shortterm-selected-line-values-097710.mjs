import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const source=fs.readFileSync(path.join(root,'src','ForecastCockpit.tsx'),'utf8');
const css=fs.readFileSync(path.join(root,'src','styles-src','30-modern.css'),'utf8');
const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
const trend=fs.readFileSync(path.join(root,'src','SubseasonalTrendPanel.tsx'),'utf8');
const checks=[
 ['run 817 safeCape no-unused regression removed',!app.includes('safeCape=')],
 ['run 817 obsolete daySpan helper removed',!trend.includes('function daySpan(')],
 ['run 817 climate cache has explicit interface',trend.includes('interface ClimateCache')&&trend.includes('const climateCache=cache;')],
 ['selected blue time line remains',source.includes('className="selected-time-line"')],
 ['selected line cloud values present',source.includes('selected-time-value cloud')&&source.includes('Wolken ${Math.round')],
 ['selected line temperature values present',source.includes('selected-time-value temperature')&&source.includes('gef.')&&source.includes('Td ${Math.round')],
 ['selected line precipitation values present',source.includes('selected-time-value precipitation')&&source.includes('probabilityDisplayValue')],
 ['selected line wind values present',source.includes('selected-time-value wind')&&source.includes('Wind ${wind(selectedVisualPoint.point.wind,unit)}')],
 ['selected line pressure values present',source.includes('selected-time-value pressure')&&source.includes('formatDecimalFixed(selectedVisualPoint.point.pressure,1)')],
 ['selected values use parameter colors',css.includes('.selected-time-value.temperature{fill:var(--param-temperature)}')&&css.includes('.selected-time-value.precipitation{fill:var(--param-precipitation)}')&&css.includes('.selected-time-value.wind{fill:var(--param-wind)}')&&css.includes('.selected-time-value.pressure{fill:var(--param-pressure)}')&&css.includes('.selected-time-value.cloud{fill:var(--param-cloud)}')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Short-term selected-line regression failed:\n- '+failed.map(([label])=>label).join('\n- '));process.exit(1)}
console.log('MID v0.9.77.10: selected blue-line values + run #817 compiler regression protected.');
