import assert from 'node:assert/strict';
import {build} from 'esbuild';

const bundled=await build({
 entryPoints:[new URL('../src/forecastDaySkyBar.ts',import.meta.url).pathname],
 bundle:true,platform:'node',format:'esm',target:'node22',write:false,logLevel:'silent',
});
const moduleUrl='data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64');
const {forecastLocalDaySkyBar}=await import(moduleUrl);

const timezone='Europe/Berlin',location={latitude:52.52,longitude:13.405,elevation:34,timezone};
const zonedParts=epoch=>Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
 timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',
}).formatToParts(new Date(epoch)).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));

for(const {date,hours:expectedHours,duplicateHourCount} of [
 {date:'2026-03-29',hours:23,duplicateHourCount:0},
 {date:'2026-10-25',hours:25,duplicateHourCount:2},
]){
 const start=new Date(date+'T12:00:00Z');
 const samples=[];
 for(let epoch=start.getTime()-48*3600000;epoch<=start.getTime()+72*3600000;epoch+=3600000){
  const parts=zonedParts(epoch),localDate=`${parts.year}-${parts.month}-${parts.day}`;
  const hour={time:`${localDate}T${parts.hour}:${parts.minute}`,epoch,timezone,temperature:10,apparent:10,humidity:60,dewPoint:5,pressure:1013,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,wind:0,gust:0,direction:0,cloud:87.5,lowCloud:60,midCloud:40,highCloud:20,uvIndex:0,visibility:10000,cape:0,isDay:true};
  samples.push(hour);
 }
 const bar=forecastLocalDaySkyBar(samples.reverse(),date,location,`dst-${date}`);
 assert.ok(bar,`${date}: lokale Tagesgrenzen fehlen`);
 assert.equal(bar.durationHours,expectedHours,`${date}: der lokale Tag muss ${expectedHours} reale Stunden umfassen`);
 assert.equal(bar.hours.length,expectedHours,`${date}: alle Stunden des lokalen Tages müssen erhalten bleiben`);
 assert.equal(bar.cells.length,expectedHours,`${date}: Square-Modus muss jede Tagesstunde rendern`);
 assert.equal(bar.xPositions.length,expectedHours,`${date}: jede Tagesstunde braucht eine eigene Zeitposition`);
 assert.ok(bar.xPositions.every((position,index)=>index===0||position>bar.xPositions[index-1]),`${date}: DST-Stunden müssen streng chronologisch und ohne kollidierende X-Positionen liegen`);
 assert.equal(bar.xPositions[0],1.5,`${date}: erste Stunde beginnt am lokalen Tagesrand`);
 assert.ok(bar.xPositions.at(-1)<98.5,`${date}: letzte Stunde bleibt innerhalb des Tagestracks`);
 assert.ok(bar.segments.length>0,`${date}: Bandmodus muss Wettersegmente erzeugen`);
 assert.equal(Math.min(...bar.segments.map(segment=>segment.x1)),1.5,`${date}: Wetterband muss am lokalen Tagesanfang starten`);
 assert.ok(Math.abs(Math.max(...bar.segments.map(segment=>segment.x2))-98.5)<1e-9,`${date}: Wetterband muss bis zum lokalen Tagesende reichen`);
 assert.ok(bar.nightBands.length>=2,`${date}: nächtliche Solarflächen vor Sonnenaufgang und nach Sonnenuntergang fehlen`);
 assert.equal(bar.nightBands[0].startEpoch,bar.startEpoch,`${date}: Nachtfläche muss am lokalen Tagesanfang beginnen`);
 assert.equal(bar.nightBands.at(-1).endEpoch,bar.endEpoch,`${date}: Nachtfläche muss das lokale Tagesende einschließen`);
 assert.ok(bar.nightBands.every(band=>band.width>0&&band.x>=1.5&&band.x+band.width<=98.5+1e-9),`${date}: Nachtflächen müssen exakt innerhalb der vollständigen lokalen Tagesachse liegen`);
 const dayHours=bar.hours.map(hour=>zonedParts(hour.epoch).hour);
 assert.equal(dayHours.filter(hour=>hour==='02').length,duplicateHourCount,`${date}: die doppelte/herausfallende lokale 02-Uhr-Stunde muss korrekt abgebildet werden`);
}

console.log('DST-Skybars geprüft: Europe/Berlin mit 23/25 Stunden, allen Feldern und vollständigen Solar-Nachtflächen.');