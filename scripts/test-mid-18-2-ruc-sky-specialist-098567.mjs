import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fetcher,builder,pack,worker,fusion,weatherTypes,shortTerm,cockpit,audit]=await Promise.all([
 read('tools/ruc/fetch_and_build_ruc.py'),
 read('tools/ruc/build_ruc_bundle.py'),
 read('tools/ruc/ruc_pack.py'),
 read('worker-src/00-core-observations.js'),
 read('src/forecastFusion.ts'),
 read('src/weather-src/00-types-models-search.tsfrag'),
 read('src/ShortTermForecast.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('MID_RUC_SHORTTERM_AUDIT_0.9.85.64.md')
]);

assert.ok(fetcher.includes("SPECIALIST_15M_OPTIONAL=('VIS','CEILING','HZEROCL','SNOWLMT')"),'Native RUC 15-min specialist list missing.');
assert.ok(fetcher.includes("SPECIALIST_HOURLY_OPTIONAL=('VIS','CEILING','HZEROCL','SNOWLMT','CLCM','CLCH','T_G','H_SNOW')"),'Hourly specialist fallback must remain intact.');
assert.ok(fetcher.includes("stage/'specialist-15m'/param")&&fetcher.includes("mode='rapid15'"),'Specialist15 fields are not staged at native 15-min cadence.');
assert.ok(fetcher.includes("FORECAST_REQUIRED")&&fetcher.includes("'CLCT'")&&fetcher.includes("'CLCL'"),'Hourly RUC cloud core missing.');
assert.ok(!fetcher.includes("SPECIALIST_15M_OPTIONAL=('CLCT'"),'CLCT must not be fabricated at 15-min cadence.');

for(const token of ['SPECIALIST_15M_FIELDS','rapid-specialist-15m.bin',"rapid['specialist15']", 'nativeResolutionSeconds'])assert.ok(builder.includes(token)||pack.includes(token),`RUC specialist15 packaging missing: ${token}`);
for(const token of ["FieldSpec('visibility', 'm', 10.0)","FieldSpec('ceiling', 'm', 1.0)","FieldSpec('freezing_level_height', 'm', 1.0)","FieldSpec('snowline_height', 'm', 1.0)"])assert.ok(pack.includes(token),`Specialist15 wire field missing: ${token}`);

for(const token of ['specialist15:false',"['specialist15',meta?.rapid?.specialist15]",'specialist=rapid.specialist15||{}',"visibility:specialistValue('visibility')","ceilingM:specialistValue('ceiling')","freezingLevelM:specialistValue('freezing_level_height')","snowlineM:specialistValue('snowline_height')"])assert.ok(worker.includes(token),`Worker specialist15 integration missing: ${token}`);
for(const token of ['visibility?:number;ceilingM?:number;freezingLevelM?:number;snowlineM?:number','rapidVisibility','rapidCeiling','rapidFreezing','rapidSnowline'])assert.ok(fusion.includes(token),`Forecast fusion specialist15 propagation missing: ${token}`);
assert.ok(weatherTypes.includes('visibility?:number;ceiling?:number;freezingLevel?:number;snowline?:number'),'Minute15 specialist fields missing.');

for(const token of ['quarterVisibility=finite(quarter?.visibility)','quarterCeiling=finite(quarter?.ceiling)','freezingLevel:finite(quarter?.freezingLevel)','snowline:finite(quarter?.snowline)','Ceiling ','Nullgrad- / Schneefallgrenze'])assert.ok(shortTerm.includes(token),`90-min specialist use missing: ${token}`);
assert.ok(shortTerm.includes('if(cover>=6.25)return 1'),'12 % cloud cover must not be labelled completely clear.');
assert.ok(shortTerm.includes('return observedSkyCode(localAdjustment>0&&Number.isFinite(observed)?observed:raw'),'Dry sky codes must be reconciled with cloud/visibility even without a local observation.');

assert.ok(cockpit.includes('maxLayer>total+20'),'Contradictory layer cloud values must be suppressed.');
assert.ok(cockpit.includes('Schichtwerte werden jedoch ausgeblendet, wenn sie der Gesamtbewölkung klar widersprechen'),'Cloud-layer explanation must state contradiction handling.');
assert.ok(cockpit.includes('Zustandskern inkl. Wolken 1 h bis +14 h'),'Visible RUC cadence must keep clouds hourly.');
assert.ok(cockpit.includes('Sicht/Ceiling/Nullgrad-/Schneefallgrenze 15 min bis +6 h'),'Visible RUC cadence must expose native specialist15 data.');
assert.ok(audit.includes('CLCT/CLCL/CLCM/CLCH bleiben stündlich'),'Audit must reject fabricated 15-min cloud cover.');

console.log('MID v0.9.85.67: sky/cloud coherence and native RUC 15-minute specialist chain protected.');
