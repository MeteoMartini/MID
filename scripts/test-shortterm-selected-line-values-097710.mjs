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
 ['selected line values use readable theme-adaptive pill component',source.includes('function ProfileSelectedValuePill')&&css.includes('.selected-time-value-pill rect{fill:var(--mg-tooltip)')&&css.includes('var(--mg-tooltip-border)')],
 ['selected line cloud values present',source.includes('className="cloud"')&&source.includes('Wolken ${Math.round')],
 ['selected line temperature values present',source.includes('className="temperature"')&&source.includes('gef.')&&source.includes('Td ${Math.round')],
 ['selected line precipitation values present',source.includes('className="precipitation"')&&source.includes('probabilityDisplayValue')],
 ['selected line wind values present',source.includes('className="wind"')&&source.includes('Wind ${wind(selectedVisualPoint.point.wind,unit)}')],
 ['selected line pressure values present',source.includes('className="pressure"')&&source.includes('formatDecimalFixed(selectedVisualPoint.point.pressure,1)')],
 ['selected values use parameter colors',css.includes('.selected-time-value-pill.temperature{color:var(--text)}')&&css.includes('.selected-time-value-pill.precipitation{color:var(--param-precipitation)}')&&css.includes('.selected-time-value-pill.wind{color:var(--param-wind)}')&&css.includes('.selected-time-value-pill.pressure{color:var(--param-pressure)}')&&css.includes('.selected-time-value-pill.cloud{color:var(--param-cloud)}')],
 ['temperature curve no longer has one visible dot per hour',!source.includes('{chartPoints.map(item=><circle key={`temp-point-')&&source.includes('className="temperature-point active"')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Short-term selected-line regression failed:\n- '+failed.map(([label])=>label).join('\n- '));process.exit(1)}
console.log('MID v0.9.77.12: selected blue-line values, readable parameter pills and reduced temperature points protected.');
