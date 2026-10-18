import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
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

// Exercise the actual CLI with its HTTP helper. No real provider or production data is changed.
const temp=await mkdtemp(join(tmpdir(),'mid-api-nodata-'));
try{
 const preload=join(temp,'provider.mjs');
 await writeFile(preload,`
globalThis.fetch=async raw=>{
 const url=new URL(raw),model=url.searchParams.get('models'),mode=process.env.MID_API_FIXTURE;
 const hourly={time:Array.from({length:8},(_,i)=>'2026-10-18T'+String(i).padStart(2,'0')+':00')};
 for(const key of (url.searchParams.get('hourly')||'').split(','))hourly[key]=Array(8).fill(2);
 if(hourly.temperature_2m_max)hourly.temperature_2m_max=Array(8).fill(4);
 if(mode==='required-missing'&&model==='ecmwf_aifs_europe_ensemble')hourly.cloud_cover=Array(8).fill(null);
 if(mode==='optional-missing'&&model==='meteofrance_arpege_europe')hourly.temperature_2m=Array(8).fill(null);
 if(mode==='false-extrema'&&hourly.temperature_2m_min){hourly.temperature_2m_min=[null,2,3];hourly.temperature_2m_max=[7,2,3]}
 return new Response(JSON.stringify({hourly,daily:{moon_phase:[0.5]}}),{status:200,headers:{'Content-Type':'application/json'}});
};
`);
 const run=mode=>spawnSync(process.execPath,['--import',preload,'scripts/check-api-contracts.mjs'],{cwd:process.cwd(),env:{...process.env,MID_API_FIXTURE:mode},encoding:'utf8',timeout:15000});
 const valid=run('valid');assert.equal(valid.status,0,valid.stderr);
 const missing=run('required-missing');assert.equal(missing.status,1,missing.stderr);assert.match(missing.stderr,/Kritische API-Vertragsfehler.*\nECMWF AIFS Europe Ensemble/s);
 const optional=run('optional-missing');assert.equal(optional.status,0,optional.stderr);assert.match(optional.stderr,/Optionale Provider-Degradation.*meteofrance_arpege_europe/s);
 const extrema=run('false-extrema');assert.equal(extrema.status,1,extrema.stderr);assert.match(extrema.stderr,/ECMWF IFS native 3h Min\/Max/);
}finally{await rm(temp,{recursive:true,force:true})}
console.log('MID API NoData: strict series, genuine zero/extremes, partial coverage and actual required/optional CLI paths passed.');
