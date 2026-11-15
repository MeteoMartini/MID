import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {finiteSeries,rangeSeries,distinctExtrema} from './api-contract-series.mjs';

const row=values=>({hourly:{cloud_cover:values}});
for(const missing of [null,undefined,'',' ',false,true,{},[],NaN,Infinity,-Infinity]){
 assert.equal(finiteSeries(row(Array(6).fill(missing)),'cloud_cover'),false);
 assert.equal(rangeSeries(row(Array(6).fill(missing)),'cloud_cover',0,100),false);
 assert.equal(finiteSeries(row([1,2,3,4,5,missing]),'cloud_cover'),false,'Five real values cannot become six via NoData');
}
for(const valid of [0,'0',49,50,100,'75']){
 assert(finiteSeries(row(Array(6).fill(valid)),'cloud_cover'));
 assert(rangeSeries(row(Array(6).fill(valid)),'cloud_cover',0,100));
}
assert(rangeSeries(row([null,0,10,20,30,40,100]),'cloud_cover',0,100),'Partial coverage with six real samples remains valid');
for(const outOfRange of [-1,101,9999])assert.equal(rangeSeries(row([0,1,2,3,4,5,outOfRange]),'cloud_cover',0,100),false);
assert(finiteSeries({hourly:{temperature_2m_min:[-12,0]}},'temperature_2m_min',2),'Do not clamp genuine cold extremes');
assert.equal(distinctExtrema({hourly:{temperature_2m_min:[null,2,3],temperature_2m_max:[7,2,3]}}),false,'Missing-vs-real is not a distinct extrema pair');
assert(distinctExtrema({hourly:{temperature_2m_min:[null,-12,0],temperature_2m_max:[7,-8,0]}}));

// Archived read-only probe: accepted native ICON syntax did not imply visibility data.
// The timestamped observation is evidence, not an eternal model availability assertion.
const probes=JSON.parse(await readFile(new URL('../docs/implementation/MID_C35_OPEN_METEO_API_PROBES_2026-10-18.json',import.meta.url),'utf8'));
for(const probe of probes.results.filter(value=>value.status===200)){
 assert.equal(probe.hourly_units.visibility,'m');
 assert.equal(probe.series.visibility.missing,probe.hourCount);
 assert.equal(finiteSeries({hourly:{visibility:Array(probe.hourCount).fill(null)}},'visibility'),false,'A real all-null visibility response must not certify a 0 m measurement');
}

// Exercise the actual CLI with its HTTP helper. No real provider or production data is changed.
const temp=await mkdtemp(join(tmpdir(),'mid-api-nodata-'));
try{
 const preload=join(temp,'provider.mjs');
 await writeFile(preload,`
globalThis.fetch=async raw=>{
 const url=new URL(raw),model=url.searchParams.get('models'),mode=process.env.MID_API_FIXTURE;
 if(model==='best_match'&&mode==='required-transport')throw new TypeError('fetch failed',{cause:Object.assign(new Error('Private diagnostic cause must not be logged'),{code:'ENOTFOUND'})});
 if(model==='best_match'&&mode==='required-http-503')return new Response(JSON.stringify({reason:'temporary provider failure'}),{status:503,headers:{'Content-Type':'application/json'}});
 if(mode==='rate-limit-origin'&&url.origin==='https://api.open-meteo.com'){
  globalThis.__rateLimitOriginRequests=(globalThis.__rateLimitOriginRequests||0)+1;
  return new Response(JSON.stringify({reason:'rate-limited'}),{status:429,headers:{'Content-Type':'application/json'}});
 }
 const hourly={time:Array.from({length:8},(_,i)=>'2026-10-18T'+String(i).padStart(2,'0')+':00')};
 for(const key of (url.searchParams.get('hourly')||'').split(','))hourly[key]=Array(8).fill(2);
 if(hourly.temperature_2m_max)hourly.temperature_2m_max=Array(8).fill(4);
 if(mode==='required-missing'&&model==='ecmwf_aifs_europe_ensemble')hourly.cloud_cover=Array(8).fill(null);
 if(mode==='optional-missing'&&model==='meteofrance_arpege_europe')hourly.temperature_2m=Array(8).fill(null);
 if(mode==='false-extrema'&&hourly.temperature_2m_min){hourly.temperature_2m_min=[null,2,3];hourly.temperature_2m_max=[7,2,3]}
 return new Response(JSON.stringify({hourly,daily:{moon_phase:mode==='required-bad-schema'&&model==='best_match'?undefined:[0.5]}}),{status:200,headers:{'Content-Type':'application/json'}});
};
process.on('exit',()=>{if(process.env.MID_API_FIXTURE==='rate-limit-origin')
 console.error('OPENMETEO_ORIGIN_CALLS='+Number(globalThis.__rateLimitOriginRequests||0))});
`);
 const run=mode=>spawnSync(process.execPath,['--import',preload,'scripts/check-api-contracts.mjs'],{cwd:process.cwd(),env:{...process.env,MID_API_FIXTURE:mode},encoding:'utf8',timeout:15000});
 const valid=run('valid');assert.equal(valid.status,0,valid.stderr);
 const transport=run('required-transport');
 assert.equal(transport.status,1,transport.stderr);
 assert.match(transport.stderr,/Open-Meteo Best Match \+ Mond: Transportfehler \(DNS\).*Antwortschema nicht überprüfbar/);
 assert.doesNotMatch(transport.stderr,/Private diagnostic cause must not be logged/,'No raw transport error details or nested causes in logs');
 const outage=run('required-http-503');
 assert.equal(outage.status,1,outage.stderr);
 assert.match(outage.stderr,/Open-Meteo Best Match \+ Mond: Provider HTTP 503 \(kein Schemaurteil\)/);
 assert.doesNotMatch(outage.stderr,/Vertrag ungültig \(HTTP 503\)/,'HTTP outage is not falsely classified as schema violation');
 const badSchema=run('required-bad-schema');
 assert.equal(badSchema.status,1,badSchema.stderr);
 assert.match(badSchema.stderr,/Open-Meteo Best Match \+ Mond: Vertrag ungültig \(HTTP 200\)/);
 const missing=run('required-missing');assert.equal(missing.status,1,missing.stderr);assert.match(missing.stderr,/Kritische API-Vertragsfehler.*\nECMWF AIFS Europe Ensemble/s);
 const optional=run('optional-missing');assert.equal(optional.status,0,optional.stderr);assert.match(optional.stderr,/Optionale Provider-Degradation.*meteofrance_arpege_europe/s);
 const extrema=run('false-extrema');assert.equal(extrema.status,1,extrema.stderr);assert.match(extrema.stderr,/ECMWF IFS native 3h Min\/Max/);
 const rateLimited=run('rate-limit-origin');
 assert.equal(rateLimited.status,1,'Provider-429 bleibt ein fehlgeschlagenes Pflichtgate');
 assert.match(rateLimited.stderr,/Open-Meteo Best Match \+ Mond: Provider HTTP 429 \(kein Schemaurteil\) nach 3 Abrufversuchen/);
 assert.match(rateLimited.stderr,/ECMWF IFS native 3h Min\/Max: nicht geprüft wegen bestätigtem HTTP 429 derselben API-Origin/);
 assert.match(rateLimited.stderr,/Météo-France meteofrance_arome_france: nicht geprüft wegen bestätigtem HTTP 429/);
 assert.match(rateLimited.stderr,/Optionale Provider-Degradation \(7\)/);
 assert.match(rateLimited.stderr,/Kritische API-Vertragsfehler \(2\)/);
 assert.match(rateLimited.stderr,/OPENMETEO_ORIGIN_CALLS=3\b/,'Keine redundanten 21 regionalen Folgeabrufe nach Ursprungssperre');
 assert.doesNotMatch(rateLimited.stderr,/Vertrag ungültig \(HTTP 429\)/,'429 ist kein nachgewiesener Schemafehler');
}finally{await rm(temp,{recursive:true,force:true})}
console.log('MID API NoData: strict series, genuine zero/extremes, partial coverage and actual required/optional CLI paths passed.');
