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
 "for(const level of[.02,.05,.1,.2,.5,1,2,4,6,10])",
 "function radarAmountScale(maxAmount:number)",
 "function radarAxisLabel(value:number)",
 "rawForecastAmount=timelineSegments.filter(segment=>!segment.nearby&&segment.end>now).reduce",
 "forecastAmount=Number.isFinite(Number(radar.ensemble?.totalMedian))",
 "<small>2-h-Summe</small><strong>{radarAmountLabel(forecastAmount)} mm</strong>",
 "{radarAxisLabel(scale/2)}",
 "<em>mm/5 min</em>",
 "height:radarBarHeight(segment.amount,scale,segment.nearby)"
])if(!app.includes(token))failures.push(`Nowcast-Skala/Summe fehlt: ${token}`);
for(const token of [
 '.radar-heading-marker{overflow:visible!important}',
 '.radar-location-bearing{left:2px!important;top:-5px!important;width:15px!important',
 '.radar-nowcast-title span strong'
])if(!styles.includes(token))failures.push(`Darstellungsfix fehlt: ${token}`);
if(failures.length){console.error('Blickrichtung-/Nowcast-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Blickrichtung und Radar-Nowcast geprüft: Sensorlistener nach Freigabe, sichtbarer Richtungspfeil, 5-Minuten-Mengenachse und dezente +2-h-Summe vorhanden.');
