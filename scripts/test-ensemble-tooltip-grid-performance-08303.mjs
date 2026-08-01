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
 'cellX=plotLeft+(slotIndex/dayCount)*plotWidth',
 'cellRight=plotLeft+((slotIndex+1)/dayCount)*plotWidth',
 'centerX=plotLeft+((slotIndex+.5)/dayCount)*plotWidth',
 'className="ensemble-weather-day-guide"',
 '<CartesianGrid horizontal vertical={false} stroke="#8399ad"',
 '<CartesianGrid horizontal vertical stroke="#8399ad"'
])if(!panel.includes(token))failures.push(`Ensemble-Quellvertrag fehlt: ${token}`);
for(const token of [
 'MID v0.8.30.3 · exakte Tageszentren, sichere Querformat-Tooltips und schnellere Chartinteraktion',
 '.ensemble-weather-day-guide{',
 '@media(orientation:landscape) and (pointer:coarse){',
 '.ensemble-temperature-canvas .recharts-cartesian-grid-horizontal line,',
 'transition:none!important;'
])if(!css.includes(token))failures.push(`Ensemble-CSS-Vertrag fehlt: ${token}`);
if(failures.length){
  console.error('MID v0.8.30.3 Tooltip-/Raster-/Performanceprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Querformat-Tooltips, exakt zentrierte Tageszellen, sichtbare Rasterlinien und zustandsarme Klick-Tooltips geprüft.');
