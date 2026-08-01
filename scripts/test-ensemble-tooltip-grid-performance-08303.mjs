import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,30,3],atLeast=parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||parts.every((value,index)=>value===minimum[index]);
if(!atLeast)failures.push(`Version liegt vor 0.8.30.3: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of [
 "fixed=compact||(typeof window!=='undefined'&&(window.matchMedia('(pointer: coarse)').matches||window.innerHeight<=620))",
 'activeRef=useRef(false)',
 '[tooltipKey,setTooltipKey]=useState(0)',
 'key={tooltip.tooltipKey}',
 'key={rainTooltip.tooltipKey}',
 'onActive={tooltip.markActive}',
 'onActive={rainTooltip.markActive}',
 "portal={typeof document!=='undefined'?document.body:null}",
 'animationDuration={0}',
 'function useTemperatureAxisCenters',
 ".recharts-xAxis .recharts-cartesian-axis-tick-line",
 'cellX=index===0?bandLeft:(centers[index-1]+centerX)/2',
 'cellRight=index===dayCount-1?bandRight:(centerX+centers[index+1])/2',
 'centerX=centers[index]',
 'function EnsembleTemperatureVerticalGrid',
 '<ReferenceLine key={`temperature-vertical-${row.date}`} x={row.x}',
 '<ReferenceLine key={`temperature-horizontal-${value}`} yAxisId="t" y={value}',
 '<ReferenceLine key={`rain-horizontal-${value}`} yAxisId="mm" y={value}',
 '<ReferenceLine key={`wind-horizontal-${value}`} yAxisId="wind" y={value}'
])if(!panel.includes(token))failures.push(`Ensemble-Quellvertrag fehlt: ${token}`);
for(const obsolete of ['className="ensemble-weather-day-guide"','<CartesianGrid horizontal vertical={false} stroke="#8399ad"'])if(panel.includes(obsolete))failures.push(`Veraltete Rastergeometrie vorhanden: ${obsolete}`);
for(const token of [
 'MID v0.8.30.3 · exakte Tageszentren, sichere Querformat-Tooltips und schnellere Chartinteraktion',
 '@media(orientation:landscape) and (pointer:coarse){',
 'transition:none!important;',
 '.ensemble-major-grid-line.horizontal{',
 '.ensemble-major-grid-line.vertical{',
 '.ensemble-temperature-grid-overlay line{'
])if(!css.includes(token))failures.push(`Ensemble-CSS-Vertrag fehlt: ${token}`);
if(failures.length){
  console.error('MID Tooltip-/Raster-/Performanceprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Querformat-Tooltips, achsgenaue Tageslinien, horizontale Hauptlinien und zustandsarme Klick-Tooltips geprüft.');
