// Bounded read-only provider QA for MID #683, available only on Draft PR #685.
// Do not confuse Open-Meteo forecast rows with true original DWD GRIB2 cells.
// Source-phase precedence itself is covered by deterministic worker tests.
import assert from 'node:assert/strict';

const start=Date.now(),limitMs=30000,deadline=AbortSignal.timeout(limitMs);
const quarter=15*60*1000,rounded=Math.floor((start-15*60*1000)/quarter)*quarter;
const time=d=>new Date(d).toISOString().slice(0,16);
const hourMs=60*60*1000;
const expectedFieldEnd=(intervalMinutes,targetMs)=>intervalMinutes===15?targetMs:Math.floor(targetMs/hourMs)*hourMs+hourMs;
// Hourly precipitation is END-stamped: 17:15 and exactly 17:00 BOTH
// select the 17:00-18:00 accumulation, never the prior 16:00-17:00.
for(const [target,expected] of [
 ['2026-11-07T17:15:00Z','2026-11-07T18:00:00Z'],
 ['2026-11-07T17:00:00Z','2026-11-07T18:00:00Z'],
 ['2026-11-07T17:45:00Z','2026-11-07T18:00:00Z']
])assert.equal(expectedFieldEnd(60,Date.parse(target)),Date.parse(expected),'hourly fallback field must match production end-stamp contract');
assert.equal(expectedFieldEnd(15,Date.parse('2026-11-07T17:15:00Z')),Date.parse('2026-11-07T17:15:00Z'));
const cases=[
 {id:'d2-original-domain',model:'dwd_icon_d2_15min',lat:50.8,lon:7.1,interval:15,kind:'valid'},
 {id:'d2-north-within-envelope-but-nodata',model:'dwd_icon_d2_15min',lat:58.05,lon:7.1,interval:15,kind:'nodata'},
 {id:'eu-west-outside-d2',model:'dwd_icon_eu',lat:50.8,lon:-4.5,interval:60,kind:'valid'},
 {id:'eu-west-outside-eu',model:'dwd_icon_eu',lat:40,lon:-30,interval:60,kind:'nodata'},
 {id:'global-west-outside-eu',model:'dwd_icon',lat:40,lon:-30,interval:60,kind:'valid'}
];
const outcomes=[];
let requests=0;
async function checkOne(t){
 const url=new URL('https://api.open-meteo.com/v1/forecast');
 url.searchParams.set('latitude',String(t.lat));url.searchParams.set('longitude',String(t.lon));
 url.searchParams.set('models',t.model);url.searchParams.set('timezone','GMT');
 url.searchParams.set('cell_selection','nearest');
 url.searchParams.set('precipitation_unit','mm');
 const fifteen=t.interval===15,group=fifteen?'minutely_15':'hourly';
 const hourStart=Math.floor(rounded/hourMs)*hourMs;
 const checkedStamp=expectedFieldEnd(t.interval,rounded);
 const startMs=fifteen?rounded-quarter:hourStart-hourMs;
 const endMs=fifteen?rounded+quarter:hourStart+hourMs;
 url.searchParams.set(group,'precipitation,rain,snowfall,weather_code');
 url.searchParams.set(fifteen?'start_minutely_15':'start_hour',time(startMs));
 url.searchParams.set(fifteen?'end_minutely_15':'end_hour',time(endMs));
 const abort=AbortSignal.any([deadline,AbortSignal.timeout(8000)]);
 requests++;assert.ok(requests<=5,'provider test request limit exceeded');
 let response;
 try{response=await fetch(url,{signal:abort,headers:{Accept:'application/json'}})}
 catch(e){throw Error(t.id+': forecast API network failure '+String(e))}
 let data;try{data=await response.json()}catch{throw Error(t.id+': unparseable provider JSON')}
 if(t.kind==='nodata'){
  assert.equal(response.status,400,t.id+': published model edge changed, independently requalify original-cell mask');
  assert.equal(data?.error,true,t.id+': 400 without provider error');
  assert.match(String(data.reason||''),/no data is available for this location/i,t.id+': unexpected reason for NoData');
  return{id:t.id,source:t.model,status:response.status,cellEvidence:'NoData (never 0)',intervalMinutes:t.interval};
 }
 assert.equal(response.status,200,t.id+': missing expected provider coverage; '+String(data?.reason||''));
 assert.equal(data?.error,undefined,t.id+': source response contains an error');
 const values=data[group],units=data[group+'_units'];
 assert.ok(Array.isArray(values?.time)&&values.time.length>=2,t.id+': missing model validity axis');
 assert.equal(units?.precipitation,'mm',t.id+': unexpected precipitation units');
 assert.equal(units?.rain,'mm',t.id+': unexpected rain units');
 assert.equal(units?.snowfall,'cm',t.id+': snowfall in cm must not be treated as mm');
 const stamps=values.time.map(t=>Date.parse(t+'Z'));
 assert.ok(stamps.every(Number.isFinite),t.id+': invalid validity stamps');
 for(let i=1;i<stamps.length;i++)assert.equal(stamps[i]-stamps[i-1],t.interval*60000,t.id+': invalid native interval');
 assert.ok(stamps.includes(checkedStamp),t.id+': no matching target-field END validity');
 assert.ok(fifteen?Math.abs(checkedStamp-rounded)<=90000:checkedStamp>rounded&&checkedStamp-rounded<=hourMs,
  t.id+': invalid hourly accumulation END timestamp');
 for(const field of ['precipitation','rain','snowfall']){
  assert.equal(values[field]?.length,stamps.length,t.id+': '+field+' axis mismatch');
  for(const value of values[field])assert.ok(value===null||typeof value==='number'&&Number.isFinite(value)&&value>=0,t.id+': invalid '+field+' or Missing falsely set to 0');
 }
 const where=stamps.indexOf(checkedStamp);
 return{id:t.id,source:t.model,status:response.status,cellEvidence:'Open-Meteo provider output, NOT native DWD GRIB',intervalMinutes:t.interval,validTime:values.time[where]+'Z',precipitation:values.precipitation[where],rain:values.rain[where],snowfallCm:values.snowfall[where],weatherCode:values.weather_code?.[where]??null};
}
try{
 // Sequential on purpose: avoid concurrent bursts against public provider.
 for(const t of cases){if(deadline.aborted)throw new Error('global 30s budget exceeded');outcomes.push(await checkOne(t))}
 assert.equal(outcomes.length,5);
 assert.equal(outcomes[0].status,200);
 assert.equal(outcomes[1].status,400);
 assert.equal(outcomes[2].status,200);
 assert.equal(outcomes[3].status,400);
 assert.equal(outcomes[4].status,200);
 console.log('MID PROVIDER FALLBACK REAL API VERIFIED '+JSON.stringify({when:new Date(start).toISOString(),durationMs:Date.now()-start,requests,points:outcomes,scope:'single-point real provider, not 247-cell Cloudflare E2E, not original DWD GRIB'}));
}catch(error){console.error('MID PROVIDER FALLBACK REAL API BLOCKED: '+String(error));process.exitCode=1}
