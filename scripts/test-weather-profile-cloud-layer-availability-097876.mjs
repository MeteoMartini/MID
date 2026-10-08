import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,weatherSource,workerSource]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather-src/00-types-models-search.tsfrag',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8')
]);

for(const source of [weatherSource,workerSource])for(const field of ['cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high'])
 assert.ok(source.includes(field),`Kernforecast muss ${field} weiterhin explizit anfordern.`);

for(const token of [
 "type ShortTermCloudLayers={total?:number;high?:number;mid?:number;low?:number;inconsistent:boolean}",
 "function shortTermCloudPercent(value:unknown)",
 "allLayersPresent=high!==undefined&&mid!==undefined&&low!==undefined",
 "inconsistent=total!==undefined&&total>=5&&allLayersPresent&&Math.max(high,mid,low)<=.5",
 "return inconsistent?{total,inconsistent:true}:{total,high,mid,low,inconsistent:false}",
 "function shortTermCloudLayerTriplet(",
 "if(values.every(value=>value===undefined))return'n. v.'",
 "lowCloud:shortTermCloudPercent(hour.lowCloud)??Number.NaN",
 "midCloud:shortTermCloudPercent(hour.midCloud)",
 "highCloud:shortTermCloudPercent(hour.highCloud)",
 "cloud:cloudMean('cloud')??first.cloud",
 "lowCloud:cloudMean('lowCloud')??Number.NaN",
 "midCloud:cloudMean('midCloud')",
 "highCloud:cloudMean('highCloud')",
 "Gesamtbewölkung und H/M/L-Schichtbewölkung sind getrennte Quellfelder",
 "nicht als 0 % ausgegeben",
 "H/M/L ${shortTermCloudLayerTriplet(profileOverlayVisualPoint.point)}",
 "Gesamt {shortTermCloudLabel(shortTermCloudLayers(selectedPoint).total)} · H/M/L {shortTermCloudLayerTriplet(selectedPoint)}"
])assert.ok(cockpit.includes(token),`Wolkenschicht-Verfügbarkeitsvertrag fehlt: ${token}`);

for(const forbidden of [
 "Math.round(Number(selectedVisualPoint.point.highCloud)||0)",
 "Math.round(Number(selectedVisualPoint.point.midCloud)||0)",
 "Math.round(Number(selectedVisualPoint.point.lowCloud)||0)",
 "Math.round(Number(selectedPoint.highCloud)||0)",
 "Math.round(Number(selectedPoint.midCloud)||0)"
])assert.ok(!cockpit.includes(forbidden),`Fehlende Wolkenschicht darf nicht mehr als 0 % ausgegeben werden: ${forbidden}`);

console.log('24-h-Wolkenprofil: fehlende oder offensichtlich inkonsistente H/M/L-Schichtwerte bleiben unbekannt statt als 0 % zu erscheinen.');
