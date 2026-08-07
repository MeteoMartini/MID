import {readFile} from 'node:fs/promises';
const [radar,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
function parseCurves(name){
  const block=radar.match(new RegExp(`const ${name}:DwdRasterCurve\\[\\]=\\[([\\s\\S]*?)\\];`))?.[1]||'';
  const curves=[...block.matchAll(/\{value:([-\d.]+),intercept:([-\d.]+),slope:([-\d.]+),curvature:([-\d.]+),reference:([-\d.]+)\}/g)].map(match=>({value:Number(match[1]),intercept:Number(match[2]),slope:Number(match[3]),curvature:Number(match[4]),reference:Number(match[5])}));
  if(curves.length<4)failures.push(`${name}: Rasterkurven nicht auslesbar.`);
  return curves;
}
const lonCurves=parseCurves('DWD_RASTER_LONGITUDE_CURVES'),latCurves=parseCurves('DWD_RASTER_LATITUDE_CURVES');
const values=(lines)=>lines.map(line=>line.value).join(',');
if(values(lonCurves)!=='6,8,10,12')failures.push(`Längengrad-Raster unerwartet: ${values(lonCurves)}`);
if(values(latCurves)!=='49,50,51,52')failures.push(`Breitengrad-Raster unerwartet: ${values(latCurves)}`);
if(!lonCurves.some(line=>Math.abs(line.curvature)>.03))failures.push('Projizierte Meridian-Krümmung fehlt.');
if(!latCurves.every(line=>Math.abs(line.curvature)>.12))failures.push('Projizierte Breitenkreis-Krümmung fehlt.');
function bracket(lines,value){if(value<=lines[0].value)return[lines[0],lines[1]];const last=lines.length-1;if(value>=lines[last].value)return[lines[last-1],lines[last]];for(let index=0;index<last;index++)if(value>=lines[index].value&&value<=lines[index+1].value)return[lines[index],lines[index+1]];return[lines[0],lines[1]]}
const curveCoordinate=(line,cross)=>{const delta=cross-line.reference;return line.intercept+line.slope*cross+line.curvature*delta*delta};
function coordinate(lines,value,cross){const[a,b]=bracket(lines,value),first=curveCoordinate(a,cross),second=curveCoordinate(b,cross),t=(value-a.value)/(b.value-a.value);return first+(second-first)*t}
function valueFromCoordinate(lines,point,cross){let pair=null,distance=Infinity;for(let index=0;index<lines.length-1;index++){const a=lines[index],b=lines[index+1],first=curveCoordinate(a,cross),second=curveCoordinate(b,cross),min=Math.min(first,second),max=Math.max(first,second);if(point>=min&&point<=max){const t=(point-first)/(second-first);return a.value+(b.value-a.value)*t}const nextDistance=point<min?min-point:point-max;if(nextDistance<distance){distance=nextDistance;pair=[a,b]}}const[a,b]=pair||[lines[0],lines[1]],first=curveCoordinate(a,cross),second=curveCoordinate(b,cross),t=(point-first)/(second-first);return a.value+(b.value-a.value)*t}
function project(longitude,latitude){let y=coordinate(latCurves,latitude,.484),x=coordinate(lonCurves,longitude,y);for(let i=0;i<7;i++){y=coordinate(latCurves,latitude,x);x=coordinate(lonCurves,longitude,y)}return{x,y}}
function inverse(x,y){return{longitude:valueFromCoordinate(lonCurves,x,y),latitude:valueFromCoordinate(latCurves,y,x)}}
// Deutschlandweit prüfen, nicht an einem Beispielort kalibrieren.
for(const [name,lon,lat] of [['Hamburg',9.9937,53.5511],['Hannover',9.7320,52.3759],['Berlin',13.4050,52.5200],['Köln',6.9603,50.9375],['Frankfurt',8.6821,50.1109],['München',11.5820,48.1351],['Dresden',13.7373,51.0504]]){const p=project(lon,lat),back=inverse(p.x,p.y);if(Math.abs(back.longitude-lon)>.025||Math.abs(back.latitude-lat)>.025)failures.push(`${name}: Vorwärts-/Rücktransformation weicht ab (${back.longitude.toFixed(3)}/${back.latitude.toFixed(3)}).`)}
// 52°N muss sichtbar gekrümmt sein und darf nicht als Gerade modelliert werden.
const y52west=curveCoordinate(latCurves.find(line=>line.value===52),.30),y52mid=curveCoordinate(latCurves.find(line=>line.value===52),.484),y52east=curveCoordinate(latCurves.find(line=>line.value===52),.70);
if(!(y52mid-y52west>.004&&y52mid-y52east>.004))failures.push(`52°N ist nicht als projizierter Bogen abgebildet (${y52west.toFixed(5)}/${y52mid.toFixed(5)}/${y52east.toFixed(5)}).`);
if(!radar.includes('Ortsnamen oder die')||!radar.includes('NICHT als Georeferenzierungsanker'))failures.push('Schutzvertrag gegen Orts-/Stadtanker-Georeferenzierung fehlt.');
if(!baseline.includes('scripts/test-dwd-raster-georef-09242.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Gradnetz-Georeferenzierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Gradnetz-Georeferenzierung mit gekrümmten Projektionslinien deutschlandweit geprüft.');
