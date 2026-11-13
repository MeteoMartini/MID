import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const code=transpileModule(read('src/currentMoistureConsistency.ts'),{
 compilerOptions:{module:ModuleKind.ESNext,target:ScriptTarget.ES2022}
}).outputText;
const {reconcileCurrentMoisture,dwdDewPointFromHumidity,dwdHumidityFromDewPoint}=
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const station={temperatureOrigin:'station',humidityOrigin:'station',dewPointOrigin:'station'};
const screenshot=reconcileCurrentMoisture({...station,temperature:-1,dewPoint:1,relativeHumidity:95});
assert.equal(screenshot.source,'calculated');
assert.equal(screenshot.reason,'reported-conflict');
assert.ok(screenshot.dewPoint>-1.8&&screenshot.dewPoint<-1.6);
assert.equal(Math.round(screenshot.dewPoint),-2);
assert.ok(screenshot.expectedHumidityFromReported>100);
const good=reconcileCurrentMoisture({...station,temperature:-1,dewPoint:-1.7,relativeHumidity:95});
assert.equal(good.source,'reported');
assert.ok(Math.abs(good.dewPoint+1.7)<1e-9);
const mixed=reconcileCurrentMoisture({...station,temperature:2,relativeHumidity:97,dewPoint:1,dewPointOrigin:'model'});
assert.equal(mixed.source,'calculated');assert.equal(mixed.reason,'source-mix');
assert.equal(reconcileCurrentMoisture({...station,temperature:0,relativeHumidity:100,dewPoint:0}).dewPoint,0);
assert.equal(dwdDewPointFromHumidity(-1,100),-1);
assert.equal(dwdDewPointFromHumidity(-1,0),undefined);
const split=reconcileCurrentMoisture({...station,temperature:-1,relativeHumidity:95,dewPoint:1,temperatureEpochMs:0,humidityEpochMs:31*60*1000});
assert.equal(split.dewPoint,undefined);
assert.equal(split.reason,'time-mismatch');
for(const value of [null,undefined,NaN,'',101,-1]){
 assert.equal(reconcileCurrentMoisture({...station,temperature:-1,relativeHumidity:value,dewPoint:1}).dewPoint,undefined);
}
for(let temperature=-40;temperature<=40;temperature+=2){
 for(const humidity of [1,5,30,50,70,85,95,99.9,100]){
  const dewPoint=dwdDewPointFromHumidity(temperature,humidity);
  assert.ok(Number.isFinite(dewPoint)&&dewPoint<=temperature+1e-9);
  assert.ok(Math.round(dewPoint)<=Math.round(temperature));
  assert.ok(Math.abs(dwdHumidityFromDewPoint(temperature,dewPoint)-humidity)<1e-6);
 }
}
const app=read('src/App.tsx'),anchor=read('src/forecastLocalAnchor.ts');
assert.match(app,/reconcileCurrentMoisture\(\{/);
assert.match(anchor,/reconcileCurrentMoisture\(\{/);
assert.match(app,/moistureDewLabel/);
assert.match(app,/moisture\.source==='calculated'/);
assert.match(app,/sourceFor\(\['temperature','dewPoint','humidity'\]/);
assert.match(anchor,/observed\.dewPoint=Boolean\(observed\.dewPoint&&moisture\.source==='reported'\)/);
assert.ok(!app.includes('<b>{Math.round(dew)} °C</b>'),'Unsafe direct dew-point rendering must not return');
console.log('MID current dew point: original Rheidt screenshot, DWD cold inversion, full physics matrix, provenance/time/NoData and UI/anchor consistency passed.');
