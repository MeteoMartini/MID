import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fetcher,builder,pack,worker,sourceWorker,weather,fusion,shortTerm,pkgRaw,baselineRaw]=await Promise.all([
 read('tools/ruc/fetch_and_build_ruc.py'),
 read('tools/ruc/build_ruc_bundle.py'),
 read('tools/ruc/ruc_pack.py'),
 read('worker.js'),
 read('worker-src/00-core-observations.js'),
 read('src/weather.ts'),
 read('src/forecastFusion.ts'),
 read('src/ShortTermForecast.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-mid-18-2-1-ruc-native-cadence-098573.mjs';

for(const token of ["RAPID_STATE_OPTIONAL_15=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','CLCT','CLCL','CLCM','CLCH','VIS','CEILING','HZEROCL','SNOWLMT','T_G')","stage/'rapid-state'/param","mode='rapid15'"])assert.ok(fetcher.includes(token),`RUC native-state discovery missing: ${token}`);
assert.ok(fetcher.includes("mode='rapid-precip' if param=='TOT_PREC' else 'rapid15'"),'Native precipitation/convection cadence contract regressed.');
assert.ok(pack.includes('RAPID_STATE_15_FIELDS')&&pack.includes("FieldSpec('cloud_cover', '%', 0.1)")&&pack.includes("FieldSpec('ceiling', 'm', 1.0)")&&pack.includes("FieldSpec('wind_direction_10m', '°', 0.1)"),'15-minute state packing contract incomplete.');
for(const token of ["RAPID_STATE_PARAM_MAP","rapid-state-15m.bin","rapid['state15']","rapid_state_specs=tuple","np.hypot(u15,v15)*1.94384449"])assert.ok(builder.includes(token),`Adaptive rapid-state bundle missing: ${token}`);
assert.ok(builder.includes("if rapid_state_specs:")&&builder.includes("spec.name in rapid_state_fields"),'Only actually complete native fields may be published.');
assert.ok(worker.includes("state=rapid.state15||{}")&&worker.includes("nativeStateSeconds:stateIndex===undefined?undefined:900"),'Worker must expose native 15-minute state rows.');
assert.ok(worker.includes("['rapidState15',meta?.rapid?.state15]"),'RUC health must report native state product.');
assert.equal(worker.includes("state=rapid.state15||{}"),sourceWorker.includes("state=rapid.state15||{}"),'Worker bundle/source RUC state path diverged.');
assert.ok(weather.includes('temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;wind?:number;gust?:number;direction?:number;cloud?:number;lowCloud?:number;midCloud?:number;highCloud?:number;visibility?:number;ceiling?:number;'),'Minute15 must be able to carry native state values.');
assert.ok(fusion.includes('nativeStateSeconds?:number')&&fusion.includes('stateWeight=nativeState?')&&fusion.includes('stateCloud=stateWeight?rapidStateBlend')&&fusion.includes('nativeStateSeconds:stateWeight?900:row.nativeStateSeconds'),'Forecast finalization must consume native 15-minute state without pretending absent fields exist.');
assert.ok(shortTerm.includes('stateCloud=finite(quarter?.cloud)??base.cloud')&&shortTerm.includes('stateTemperature=finite(quarter?.temperature)??base.temperature')&&shortTerm.includes('midCloud:stateMidCloud,highCloud:stateHighCloud'),'90-minute cards/Skybar must use finalized 15-minute state when available.');
assert.equal(pkg.version,'0.9.85.73');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} missing in ${key}`);

console.log('MID v0.9.85.73: parameter-native RUC cadence contract (5 min precipitation, adaptive 15 min state/convection, hourly fallback) protected.');
