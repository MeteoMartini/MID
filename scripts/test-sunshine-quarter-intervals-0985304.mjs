import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const dir=mkdtempSync(join(tmpdir(),'mid-sunshine-304-'));
try{
 await build({stdin:{contents:"export{mapHours,mapMinutely15}from'./src/weather';export{sunshineQuarterValuesForHour}from'./src/sunshineDuration';export{precipitationPresentationHours}from'./src/precipitationIntervals';export{detailSkyBarSegments}from'./src/detailSkyBar';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:join(dir,'test.mjs'),logLevel:'silent'});
 const {mapHours,mapMinutely15,sunshineQuarterValuesForHour,precipitationPresentationHours,detailSkyBarSegments}=await import(pathToFileURL(join(dir,'test.mjs')));
 const make=(times,values,hourTime='2026-06-20T11:00',offset=7200)=>{
  const hourly={time:[hourTime]};for(const [key,value]of Object.entries({temperature_2m:20,dew_point_2m:10,apparent_temperature:20,relative_humidity_2m:50,is_day:1,weather_code:0,cloud_cover:20,cloud_cover_low:0,cloud_cover_mid:0,cloud_cover_high:0,uv_index:2,precipitation_probability:0,precipitation:0,rain:0,showers:0,snowfall:0,wind_speed_10m:5,wind_gusts_10m:8,wind_direction_10m:90,sunshine_duration:1234}))hourly[key]=[value];
  return{latitude:52.52,longitude:13.41,elevation:40,timezone:'Europe/Berlin',utc_offset_seconds:offset,current:{},daily:{time:[]},hourly,minutely_15:{time:times,sunshine_duration:values}};
 };
 const times=['10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45'].map(t=>'2026-06-20T'+t),values=[800,100,200,300,400,900,900,900];
 const weather=make(times,values),before=JSON.stringify(weather);
 assert.equal(mapHours(weather)[0].sunshineDuration,1000,'Hour ending11:00 must use10:15/10:30/10:45/11:00, not future quarters');
 assert.equal(JSON.stringify(weather),before,'Mapping cannot change raw provider data');
 const forward=make(times,values);for(const [key,items]of Object.entries(forward.hourly))forward.hourly[key]=key==='time'?['2026-06-20T10:00','2026-06-20T11:00']:[items[0],items[0]];
 forward.hourly.cloud_cover=[49,49];
 const visible=precipitationPresentationHours(mapHours(forward));assert.equal(visible[0].sunshineDuration,1000,'Visible10:00–11:00 slot receives the raw11:00 sunshine sum');
 assert.equal(detailSkyBarSegments(visible,0,0,100,8).find(s=>s.layer==='base').thicknessLevel,1,'Shared Skybar classifies the correctly aligned source duration');
 for(const invalid of ['missing','duplicate','off-grid','null']){
  const t=times.slice(),v=values.slice();
  if(invalid==='missing'){t.splice(2,1);v.splice(2,1)}
  if(invalid==='duplicate'){t[2]=t[1]}
  if(invalid==='off-grid'){t[2]='2026-06-20T10:31'}
  if(invalid==='null')v[2]=null;
  assert.equal(mapHours(make(t,v))[0].sunshineDuration,1234,invalid+' quarters must retain known hourly fallback');
 }
 const shuffled=[4,2,0,7,1,6,3,5];assert.equal(mapHours(make(shuffled.map(i=>times[i]),shuffled.map(i=>values[i])))[0].sunshineDuration,1000,'Order does not change interval membership');
 const missing=make(times.slice(1,4),values.slice(1,4));missing.hourly.sunshine_duration=[null];assert.equal(mapHours(missing)[0].sunshineDuration,null,'Missing is never invented sunshine');
 const explicit=['2026-06-20T08:15:00Z','2026-06-20T10:30:00+02:00','2026-06-20T08:45:00Z','2026-06-20T11:00:00+02:00','2026-06-20T11:15:00+02:00'];
 assert.equal(mapHours(make(explicit,[100,200,300,400,900],'2026-06-20T11:00:00+02:00'))[0].sunshineDuration,1000,'Absolute instants match even with differing ISO offsets');
 const quarters=mapMinutely15(weather);assert.equal(quarters[1].sunshineDuration,100);assert.equal(quarters[4].sunshineDuration,400,'Native quarter values retain their original end stamps');
 for(const end of ['2026-10-25T02:00:00+01:00','2026-03-29T03:00:00+02:00','2026-06-20T00:00:00Z','2026-06-20T11:00:00+05:45','2026-06-20T11:00:00-03:30']){
  const epoch=Date.parse(end),rows=Array.from({length:6},(_,i)=>({epoch:epoch+(i-4)*900000,value:i}));
  assert.deepEqual(sunshineQuarterValuesForHour(epoch,rows),[1,2,3,4],end+' has exactly four actual preceding intervals');
  assert.deepEqual(sunshineQuarterValuesForHour(epoch,[...rows,rows[2]]),[],end+' duplicate endpoint cannot masquerade as coverage');
 }
 console.log('MID .304: actual mapHours uses complete end-stamped preceding quarters; gaps, duplicates, off-grid, Missing, explicit offsets, shuffled inputs, immutable source and native quarters passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
