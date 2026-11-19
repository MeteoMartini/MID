import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import vm from 'node:vm';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const chartMath=readFileSync(new URL('../src/chartMath.ts',import.meta.url),'utf8');
const failures=[];
for(const token of ['function EnsembleTemperatureWeatherOverlay','function ensembleTemperatureZones','cellY=zones.weatherY','hazardY=zones.hazardY','function EnsemblePrecipShape','function EnsembleHazardShape'])if(!panel.includes(token))failures.push(`Overlay fehlt: ${token}`);
for(const token of ['.ensemble-temperature-weather-overlay{overflow:visible;pointer-events:none}', '.ensemble-mobile-tooltip-layer{position:fixed;'])if(!css.includes(token))failures.push(`Overlay-/Tooltip-CSS fehlt: ${token}`);

// Actual production coordinate contract: the weather and hazard overlays must never
// overlap the temperature series plot, while day labels stay inside the reserved axis.
const zoneStart=panel.indexOf('type EnsembleChartMargin='),zoneEnd=panel.indexOf('function EnsembleTemperatureVerticalGrid(',zoneStart);
if(zoneStart<0||zoneEnd<=zoneStart)failures.push('Temperature zone helper boundaries missing');
else{
 const {code}=await transform(panel.slice(zoneStart,zoneEnd),{loader:'ts',format:'cjs',target:'es2022'});
 const context={clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),exports:{},module:{exports:{}}};
 vm.createContext(context);
 vm.runInContext(code+';globalThis.calculateZones=ensembleTemperatureZones;',context);
 for(const [name,height,margin,xAxisHeight] of [
  ['mobile 320 px',310,{top:8,right:2,left:0,bottom:8},104],
  ['mobile 430 px',310,{top:8,right:2,left:0,bottom:8},104],
  ['desktop 1440 px',326,{top:12,right:6,left:2,bottom:10},100],
  ['exported SVG/PNG',334,{top:12,right:6,left:2,bottom:10},100]
 ]){
  const rect=context.calculateZones(height,margin,xAxisHeight);
  if(!(rect.plotBottom>rect.plotTop&&rect.hazardY-7>=rect.plotBottom&&rect.hazardY+7<rect.weatherY&&rect.weatherY>rect.plotBottom+8&&rect.weatherY+rect.weatherHeight+6<rect.plotBottom+rect.dayTickMargin&&rect.dayTickMargin+24<xAxisHeight))
   failures.push(name+': plot/hazard/weather/date regions overlap or clip');
 }
}
for(const token of ['tickMargin={zones.dayTickMargin}','height={layout.height+34}','xAxisHeight={layout.xAxisHeight+34}','labelY=clamp(Number(cy)+offset,plotTop+13,plotBottom-8)','plotTop={zones.plotTop} plotBottom={zones.plotBottom}']){
 if(!panel.includes(token))failures.push('Missing bound temperature chart geometry: '+token);
}
if(panel.includes('cellY=Math.max(plotTop+8,plotBottom-cellHeight-7)'))failures.push('Old overlapping temperature weatherband returned');


// The actual shared axis helper must include ensemble extrema, not silently crop
// its extent to the narrower Best-Match curve from the original defect screenshot.
const axisResult=await transform(chartMath,{loader:'ts',format:'cjs',target:'es2022'});
const axisCtx={module:{exports:{}},exports:{}};
vm.createContext(axisCtx);
vm.runInContext(axisResult.code+';globalThis.getTempAxis=niceTemperatureScale;',axisCtx);
const getTempAxis=axisCtx.getTempAxis;
for(const [name,minimum,maximum] of [
 ['wide ensemble versus narrow Best Match',-8,24],
 ['deep winter / freezing crossing',-22,6],
 ['small all-positive range',11,13],
 ['physically valid high heat',26,47],
 ['near-zero decimals',-.7,.8]
]){
 const axis=getTempAxis(minimum-1.5,maximum+1.5,5);
 if(!(axis.min<=minimum&&axis.max>=maximum&&axis.max>axis.min&&axis.ticks.length>=2))
  failures.push(name+': plotted ensemble extrema would be omitted by temperature domain');
 const step=axis.ticks[1]-axis.ticks[0],mantissa=step/10**Math.floor(Math.log10(step));
 if(!axis.ticks.every((value,index)=>index===0||Math.abs(value-axis.ticks[index-1]-step)<1e-6)||![1,2,5,10].some(x=>Math.abs(mantissa-x)<1e-6))
  failures.push(name+': temperature ticks are not uniform round 1/2/5/10-K intervals');
}
if(!panel.includes('row.maxLow,row.maxHigh,row.minLow,row.minHigh,row.bestMax,row.bestMin')||!panel.includes('temperatureScale=niceTemperatureScale('))
 failures.push('Visible ensemble extrema must remain part of the common temperature-axis domain');
if(panel.includes('Math.min(...fallbackValues)-1.5,Math.max(...fallbackValues)+1.5,5),minV='))
 failures.push('Do not silently replace ensemble domain with Best-Match-only limits');
// Existing generated chart geometry must remain optically and numerically coherent.
if(!panel.includes('type="monotone" dataKey="bestMin"')||!panel.includes('type="monotone" dataKey="bestMax"'))
 failures.push('Temperature min/max plotted curves are missing');

if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Achsengebundenes Wetterband, Hazards und unclipped mobile Tooltips geprüft.');
