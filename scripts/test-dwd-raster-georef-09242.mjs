import {readFile} from 'node:fs/promises';
const [radar,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
function parseLines(name){
  const block=radar.match(new RegExp(`const ${name}:DwdRasterLine\\[\\]=\\[([\\s\\S]*?)\\];`))?.[1]||'';
  const lines=[...block.matchAll(/\{value:([-\d.]+),intercept:([-\d.]+),slope:([-\d.]+)\}/g)].map(match=>({value:Number(match[1]),intercept:Number(match[2]),slope:Number(match[3])}));
  if(lines.length<4)failures.push(`${name}: Rasterlinien nicht auslesbar.`);
  return lines;
}
const lonLines=parseLines('DWD_RASTER_LONGITUDE_LINES'),latLines=parseLines('DWD_RASTER_LATITUDE_LINES');
const values=(lines)=>lines.map(line=>line.value).join(',');
if(values(lonLines)!=='6,8,10,12')failures.push(`Längengrad-Raster unerwartet: ${values(lonLines)}`);
if(values(latLines)!=='49,50,51,52')failures.push(`Breitengrad-Raster unerwartet: ${values(latLines)}`);
function bracket(lines,value){if(value<=lines[0].value)return[lines[0],lines[1]];const last=lines.length-1;if(value>=lines[last].value)return[lines[last-1],lines[last]];for(let index=0;index<last;index++)if(value>=lines[index].value&&value<=lines[index+1].value)return[lines[index],lines[index+1]];return[lines[0],lines[1]]}
const lineCoordinate=(line,cross)=>line.intercept+line.slope*cross;
function coordinate(lines,value,cross){const[a,b]=bracket(lines,value),first=lineCoordinate(a,cross),second=lineCoordinate(b,cross),t=(value-a.value)/(b.value-a.value);return first+(second-first)*t}
function valueFromCoordinate(lines,point,cross){let pair=null,distance=Infinity;for(let index=0;index<lines.length-1;index++){const a=lines[index],b=lines[index+1],first=lineCoordinate(a,cross),second=lineCoordinate(b,cross),min=Math.min(first,second),max=Math.max(first,second);if(point>=min&&point<=max){const t=(point-first)/(second-first);return a.value+(b.value-a.value)*t}const nextDistance=point<min?min-point:point-max;if(nextDistance<distance){distance=nextDistance;pair=[a,b]}}const [a,b]=pair||[lines[0],lines[1]],first=lineCoordinate(a,cross),second=lineCoordinate(b,cross),t=(point-first)/(second-first);return a.value+(b.value-a.value)*t}
function project(longitude,latitude){let y=coordinate(latLines,latitude,.5),x=coordinate(lonLines,longitude,y);for(let i=0;i<5;i++){y=coordinate(latLines,latitude,x);x=coordinate(lonLines,longitude,y)}return{x,y}}
function inverse(x,y){return{longitude:valueFromCoordinate(lonLines,x,y),latitude:valueFromCoordinate(latLines,y,x)}}
const wiesbaden=project(8.24932,50.08258),frankfurt=project(8.68213,50.11092),koblenz=project(7.58899,50.35357);
if(!(wiesbaden.x>.385&&wiesbaden.x<.398&&wiesbaden.y>.558&&wiesbaden.y<.575))failures.push(`Wiesbaden liegt nicht im kalibrierten DWD-Gradnetzfenster: ${wiesbaden.x.toFixed(5)}/${wiesbaden.y.toFixed(5)}`);
if(!(wiesbaden.x>koblenz.x&&wiesbaden.x<frankfurt.x&&wiesbaden.y>koblenz.y))failures.push('Wiesbaden muss rastergeografisch östlich/südlich von Koblenz und westlich von Frankfurt liegen.');
for(const [name,lon,lat] of [['Wiesbaden',8.24932,50.08258],['Frankfurt',8.68213,50.11092],['Koblenz',7.58899,50.35357],['Hannover',9.73322,52.37052]]){const p=project(lon,lat),back=inverse(p.x,p.y);if(Math.abs(back.longitude-lon)>.02||Math.abs(back.latitude-lat)>.02)failures.push(`${name}: Vorwärts-/Rücktransformation weicht ab (${back.longitude.toFixed(3)}/${back.latitude.toFixed(3)}).`)}
if(!radar.includes('weißen Stadt-Pluszeichen sind kartographische Beschriftungsanker'))failures.push('Schutzvertrag gegen Stadtanker-Georeferenzierung fehlt.');
if(!baseline.includes('scripts/test-dwd-raster-georef-09242.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Gradnetz-Georeferenzierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`DWD-Gradnetz-Georeferenzierung geprüft: Wiesbaden ${wiesbaden.x.toFixed(5)}/${wiesbaden.y.toFixed(5)}.`);
