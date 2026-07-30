import {readFile} from 'node:fs/promises';
const [radar,app,styles]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "requiresPermission&&permission!=='granted'",
 "stamp-lastAbsoluteAt.current<1200",
 "delta*.48",
 "if(actualLocation&&deviceHeading.heading===null)void deviceHeading.request()",
 "style=\"--mid-heading:${angle}deg\""
])if(!radar.includes(token))failures.push(`Blickrichtungsaktualisierung fehlt: ${token}`);
for(const token of [
 "for(const level of[.2,.4,1,2,4,6,10,20,40,60,100])",
 "function radarAxisLabel(value:number)",
 "forecastAmount=timelineSegments.filter(segment=>segment.rate>0&&segment.end>now).reduce",
 "Σ +2 h {radarAmountLabel(forecastAmount)} mm",
 "{radarAxisLabel(scale/2)}"
])if(!app.includes(token))failures.push(`Nowcast-Skala/Summe fehlt: ${token}`);
for(const token of [
 '.radar-heading-marker{overflow:visible!important}',
 '.radar-location-bearing{left:2px!important;top:-5px!important;width:15px!important',
 '.radar-nowcast-title span strong'
])if(!styles.includes(token))failures.push(`Darstellungsfix fehlt: ${token}`);
if(failures.length){console.error('Blickrichtung-/Nowcast-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Blickrichtung und Radar-Nowcast geprüft: Sensorlistener nach Freigabe, sichtbarer Richtungspfeil, glatte Achsenwerte und dezente +2-h-Summe vorhanden.');
