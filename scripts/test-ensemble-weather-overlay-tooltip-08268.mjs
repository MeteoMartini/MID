import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import vm from 'node:vm';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
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

if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Achsengebundenes Wetterband, Hazards und unclipped mobile Tooltips geprüft.');
