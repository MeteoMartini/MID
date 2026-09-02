import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const source=await readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const eventEngine=await readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8');
const start=source.indexOf('function currentTemperatureBridgeWeight('),end=source.indexOf('\nexport type ForecastHourFinalizationOptions',start);
assert.ok(start>=0&&end>start,'Current-Temperatur-Brückenimplementierung fehlt.');
const block=source.slice(start,end).replace('export function reconcileCurrentTemperatureObservation','function reconcileCurrentTemperatureObservation');
const javascript=stripTypeScriptTypes(block,{mode:'transform'});
const module=await import(`data:text/javascript;base64,${Buffer.from(`const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));\n${javascript}\nexport {reconcileCurrentTemperatureObservation};`).toString('base64')}`);

const base=[
 {time:'2026-09-02T07:00',epoch:Date.parse('2026-09-02T07:00:00Z'),temperature:15.0,apparent:14.7},
 {time:'2026-09-02T08:00',epoch:Date.parse('2026-09-02T08:00:00Z'),temperature:15.6,apparent:15.2},
 {time:'2026-09-02T09:00',epoch:Date.parse('2026-09-02T09:00:00Z'),temperature:17.2,apparent:16.8},
 {time:'2026-09-02T10:00',epoch:Date.parse('2026-09-02T10:00:00Z'),temperature:17.8,apparent:17.4},
 {time:'2026-09-02T11:00',epoch:Date.parse('2026-09-02T11:00:00Z'),temperature:19.0,apparent:18.6},
 {time:'2026-09-02T12:00',epoch:Date.parse('2026-09-02T12:00:00Z'),temperature:20.0,apparent:19.5},
 {time:'2026-09-02T13:00',epoch:Date.parse('2026-09-02T13:00:00Z'),temperature:20.3,apparent:19.8}
];
const observedAt=Date.parse('2026-09-02T09:35:00Z'),observedTemperature=16.8;
const corrected=module.reconcileCurrentTemperatureObservation(base,observedTemperature,observedAt);
assert.notEqual(corrected,base,'Eine relevante Current-Abweichung muss in die Stundenreihe assimiliert werden.');
const correction=observedTemperature-(17.2+(17.8-17.2)*(35/60));
assert.ok(Math.abs(corrected[2].temperature-(17.2+correction))<1e-9,'Die linke Brückenstunde muss die volle Current-Korrektur tragen.');
assert.ok(Math.abs(corrected[3].temperature-(17.8+correction))<1e-9,'Die rechte Brückenstunde muss die volle Current-Korrektur tragen statt als Einzelpunkt-Delle isoliert zu werden.');
const interpolatedAtObservation=corrected[2].temperature+(corrected[3].temperature-corrected[2].temperature)*(35/60);
assert.ok(Math.abs(interpolatedAtObservation-observedTemperature)<1e-9,'Die geglättete Kurve muss am echten Beobachtungszeitpunkt exakt durch den Current-Wert laufen.');
assert.ok(corrected[1].temperature<base[1].temperature&&corrected[1].temperature>base[1].temperature+correction,'Die Vergangenheit muss weich statt sprunghaft an die Beobachtung heranlaufen.');
assert.ok(corrected[4].temperature<base[4].temperature&&corrected[4].temperature>base[4].temperature+correction,'Die Zukunft muss weich aus der Beobachtung zurück in den Modellverlauf laufen.');
assert.equal(corrected[6].temperature,base[6].temperature,'Außerhalb des Brückenfensters darf die Prognose nicht verschoben werden.');
assert.ok(Math.abs((corrected[3].apparent-base[3].apparent)-(corrected[3].temperature-base[3].temperature))<1e-9,'Gefühlte Temperatur muss denselben thermischen Brückenversatz erhalten.');

for(const token of ["currentObservationEpoch=w?localIsoEpoch(String(w.current?.time||''),w.timezone,Number(w.utc_offset_seconds)||0):Number.NaN",'observedAt:finalizationObservedAt'])assert.ok(app.includes(token),`Dashboard muss den echten, standortlokal interpretierten Current-Zeitstempel verwenden: ${token}`);
assert.ok(eventEngine.includes("currentObservedEpoch=localIsoEpoch(String(weather.current?.time||''),weather.timezone,Number(weather.utc_offset_seconds)||0)"),'Eventpfad muss denselben standortlokalen Current-Zeitstempelvertrag verwenden.');
assert.ok(!source.includes('result[bestIndex]={...current,temperature}'),'Der alte Einpunkt-Ersatz darf nicht zurückkehren.');
console.log('Current-Temperatur wird zeitgenau und ohne Einzelstunden-Delle in den kanonischen Forecast überführt.');
