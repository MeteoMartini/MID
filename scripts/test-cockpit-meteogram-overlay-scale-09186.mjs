import {readFile} from 'node:fs/promises';

const [cockpit,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

need('Overlay-Skalierung',cockpit,'const positionPct=(value:number)=>');
need('Overlay-Skalierung',cockpit,'const chartXPositions=chartSourcePoints.map');
need('Vollbreite Graph-Geometrie',cockpit,'chartHorizontalStep=chartSourcePoints.length>1?chartPlotWidth/(chartSourcePoints.length-1):chartPlotWidth');
need('Vollbreite Graph-Geometrie',cockpit,'columnLeft=index?((previousX+x)/2):chartPaddingLeft');
need('Vollbreite Graph-Geometrie',cockpit,'columnRight=index<chartXPositions.length-1?((x+nextX)/2):chartWidth-chartPaddingRight');
need('Zeit-Overlay Prozentposition',cockpit,'style={{left:positionPct(item.x)}}');
need('Kalender-Overlay Prozentposition',cockpit,'style={{left:positionPct(band.centerX)}}');
need('Weather-Overlay auf Graphhöhe',cockpit,'style={{left:positionPct(item.x),top:`${item.weatherY}px`}}');
need('Wind-Overlay Prozentposition',cockpit,'style={{left:positionPct(point.x),color:windSignalColor(point.gust)}}');
need('Hitlayer Prozentposition',cockpit,'style={{left:positionPct(item.columnLeft),width:widthPct(item.columnWidth)}}');
need('3h-Hauptzeitmarken',cockpit,'/^(00|03|06|09|12|15|18|21):/.test(point.timeLabel)');
reject('Pixelbasierte Zeit-Overlay-Position',cockpit,'style={{left:`${item.x}px`}}');
reject('Pixelbasierte Kalender-Overlay-Position',cockpit,'style={{left:`${band.centerX}px`}}');
reject('Pixelbasierte Hitlayer-Position',cockpit,'style={{left:`${item.columnLeft}px`,width:`${item.columnWidth}px`}}');
need('Package-Test',pkg,'test:cockpit-meteogram-overlay-scale');
need('Baseline-Test',baseline,'scripts/test-cockpit-meteogram-overlay-scale-09186.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
  console.error('Meteogramm-Overlay-Skalierung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Responsive Meteogramm-Overlay-Skalierung, Vollbreiten-Geometrie und verdichtete Hauptzeitachse erfolgreich geprüft.');
