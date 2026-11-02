import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFastToCommonForecastShadow} from './ruc_fast_canonical_bridge_shadow.mjs';
const fullRun='2026-11-02T08:00',run='2026-11-02T10:00';
const fullStart=Date.parse(fullRun+'Z'),start=Date.parse(run+'Z'),iso=(t)=>new Date(t).toISOString();
const names=['temperature_2m','dew_point_2m','relative_humidity_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','cloud_cover','cloud_cover_low','cape','convective_inhibition'];
const primary=()=>({schema:'mid.dwd.ruc.grid.v2',run:fullRun,times:Array.from({length:28},(_,i)=>iso(fullStart+i*3600000).slice(0,16)),eps:{memberCount:20},deterministic:{times:[]},sourceHash:'a'.repeat(64)});
function candidate(){
 const hours=Array.from({length:7},(_,i)=>({validTimeUtc:iso(start+i*3600000),fields:Object.fromEntries(names.map((n,j)=>[n,i===0&&j===0?null:j===1?0:j===7?i*.2:j]))}));
 const rapid=(step,n)=>Array.from({length:n},(_,i)=>({validTimeUtc:iso(start+i*step*60000),
  intervalStartUtc:i===0?null:iso(start+(i-1)*step*60000),intervalEndUtc:i===0?null:iso(start+i*step*60000),
  precipitationMm:i===0?null:i*.01,capeJkg:0,cinJkg:0}));
 return {schema:'mid.ruc.fast-paged-cell-shadow.v1',available:true,modelRunUtc:iso(start),hours,
  rapid5Minutes:rapid(5,73),rapid15Minutes:rapid(15,25),
  productionAuthorized:false,consumerAdoptionVerified:false,epsAvailable:false};
}
test('Fast adapter exactly aligns 7h+73 five-minute+25 fifteen-minute records and keeps original 27h EPS20 untouched',()=>{
 const p=primary(),original=JSON.stringify(p),res=inspectFastToCommonForecastShadow(p,candidate());
 assert.equal(JSON.stringify(p),original);assert.strictEqual(res.primary,p);
 assert.equal(res.full27hEps20Unchanged,true);assert.equal(res.selectedForForecast,false);
 assert.equal(res.fastCandidate.hourly.time.length,7);
 assert.equal(res.fastCandidate.rapid.precip5.time.length,73);
 assert.equal(res.fastCandidate.rapid.convection15.time.length,25);
 assert.equal(res.fastCandidate.mid_ruc.underlyingFullRun,fullRun);
 assert.equal(res.fastCandidate.mid_ruc.epsMemberCount,0);
 assert.equal(res.usedByWebIosWidgetsExports,false);
});
test('NoData null, genuine zero and missing initial accumulation stay distinct',()=>{
 const out=inspectFastToCommonForecastShadow(primary(),candidate()).fastCandidate;
 assert.equal(out.hourly.temperature_2m[0],null);
 assert.equal(out.hourly.dew_point_2m[0],0);
 assert.equal(out.hourly.precipitation[0],null);
 assert.equal(out.rapid.precip5.precipitation[0],null);
 assert.equal(out.rapid.precip5.precipitation[1],.01);
 assert.equal(out.rapid.convection15.precipitation[0],null);
 assert.equal(out.rapid.convection15.cape[0],0);
});
test('reject noncanonical source/unsafe dates and fictitious 20-EPS in fast candidate',()=>{
 for(const invalid of [
  p=>p.eps.memberCount=19,
  p=>p.times[5]=p.times[4],
  p=>p.run='2026-02-30T08:00'
 ]){const p=primary();invalid(p);assert.throws(()=>inspectFastToCommonForecastShadow(p,candidate()));}
 for(const invalid of [
  c=>c.epsAvailable=true,
  c=>c.productionAuthorized=true,
  c=>c.consumerAdoptionVerified=true,
  c=>c.modelRunUtc='2026-11-02T10:30:00.000Z',
  c=>c.rapid5Minutes[1].validTimeUtc=c.rapid5Minutes[0].validTimeUtc,
  c=>c.rapid15Minutes[2].intervalStartUtc=null,
  c=>delete c.hours[1].fields.pressure_msl,
  c=>c.hours[3].fields.temperature_2m=Number.NaN
 ]){const c=candidate();invalid(c);assert.throws(()=>inspectFastToCommonForecastShadow(primary(),c));}
});
test('Fast source cannot exceed 6h newer than full or claim selected for client',()=>{
 const p=primary();p.run='2026-11-02T02:00';p.times=Array.from({length:28},(_,i)=>iso(Date.parse(p.run+'Z')+i*3600000).slice(0,16));
 assert.throws(()=>inspectFastToCommonForecastShadow(p,candidate()),/unrelated/);
});
