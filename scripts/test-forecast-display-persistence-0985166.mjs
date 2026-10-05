import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url);
let transpile;try{const ts=require('typescript-strada');transpile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText}catch{transpile=source=>stripTypeScriptTypes(source)}
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('src/forecastDisplayPersistence.ts');
const values=new Map();
const writes=[];
const context=vm.createContext({Date,Number,JSON,readDurableStorageValue:key=>values.get(key)??null,writeDurableStorageValue:(key,value)=>{values.set(key,value);writes.push([key,value])}});
vm.runInContext(transpile(source.replace(/^import .*;\n/m,'').replace(/export /g,''))+';globalThis.api={readForecastDisplaySettingsRaw,persistForecastDisplaySettings,mergeForecastDisplaySettings,forecastDisplayRevision};',context);
const api=context.api,key='mid:forecastDisplaySettings';
for(const enabled of [true,false,true,false]){
 const settings={ecmwfTemperatureColors:enabled,showSevenDaySummary:false,skybarDisplayMode:'squares'};
 api.persistForecastDisplaySettings(settings);
 assert.equal(JSON.parse(values.get(key)).ecmwfTemperatureColors,enabled,'write is synchronous, before a render/effect');
 assert.equal(JSON.parse(api.readForecastDisplaySettingsRaw()).skybarDisplayMode,'squares');
 assert.equal(JSON.parse(api.readForecastDisplaySettingsRaw()).showSevenDaySummary,false);
}
for(let i=1;i<writes.length;i++)assert.ok(JSON.parse(writes[i][1]).updatedAt>JSON.parse(writes[i-1][1]).updatedAt,'rapid toggles have monotonic semantic revisions');
const local=values.get(key),revision=api.forecastDisplayRevision(local);
assert.equal(api.mergeForecastDisplaySettings(undefined,local),local,'missing older remote setting cannot erase local choice');
assert.equal(api.mergeForecastDisplaySettings('{"ecmwfTemperatureColors":true}',local),local,'legacy unversioned remote cannot undo revised choice');
assert.equal(api.mergeForecastDisplaySettings(JSON.stringify({updatedAt:revision-1,ecmwfTemperatureColors:true}),local),local);
const newer=JSON.stringify({updatedAt:revision+1,ecmwfTemperatureColors:true});
assert.equal(api.mergeForecastDisplaySettings(newer,local),newer,'explicit newer remote choice still syncs');
assert.equal(api.mergeForecastDisplaySettings(newer,null),newer);
assert.equal(api.forecastDisplayRevision('invalid'),0);
const app=read('src/App.tsx');
assert.ok(app.includes('JSON.parse(readForecastDisplaySettingsRaw()'));
assert.ok(app.includes('persistForecastDisplaySettings(next);forecastDisplaySettingsRef.current=next;setForecastDisplaySettingsState(next)'));
assert.ok(!app.includes('localStorage.setItem(FORECAST_DISPLAY_SETTINGS_KEY,JSON.stringify(forecastDisplaySettings))'),'mount/effect cannot overwrite recovered preference');
assert.ok(read('src/deviceSync.ts').includes('mergeForecastDisplaySettings(values[FORECAST_DISPLAY_SETTINGS_KEY],readForecastDisplaySettingsRaw())'));
console.log('Forecast settings: synchronous durable on/off writes, monotonic recovery revision, legacy compatibility and stale/new remote snapshots passed.');
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-c17-settings-restart-browser.mjs'],{cwd:new URL('../',import.meta.url),stdio:'inherit',timeout:360000});
