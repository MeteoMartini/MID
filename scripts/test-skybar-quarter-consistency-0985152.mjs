import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const cockpit=readFileSync('src/ForecastCockpit.tsx','utf8'),out=mkdtempSync(join(tmpdir(),'mid-sky152-'));
try{
 await build({stdin:{contents:"export{buildShortTermForecast}from'./src/ShortTermForecast';export{detailSkyBarSegments}from'./src/detailSkyBar';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:join(out,'qa.mjs'),loader:{'.css':'empty'},logLevel:'silent'});
 const {buildShortTermForecast,detailSkyBarSegments}=await import(pathToFileURL(join(out,'qa.mjs')));
 const now=Date.UTC(2026,9,3,13,30),hour={time:new Date(now).toISOString(),epoch:now,temperature:22,apparent:22,humidity:50,dewPoint:11,pressure:1015,wind:3,gust:7,direction:45,cloud:60,lowCloud:20,midCloud:20,highCloud:20,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,isDay:true,sunshineDuration:3600};
 const hours=Array.from({length:27},(_,i)=>({...hour,epoch:now+i*3600000,time:new Date(now+i*3600000).toISOString()}));
 const quarters=Array.from({length:7},(_,i)=>({...hour,epoch:now+i*900000,time:new Date(now+i*900000).toISOString(),cloud:i<2?60:35,sunshineDuration:900}));
 const points=buildShortTermForecast(quarters,hours,'UTC',now,{active:false});
 const fine=points.filter(p=>p.source==='15-min').slice(0,6);
 assert.equal(fine.length,6);
 assert.equal(fine[0].cloud,60);assert.equal(fine[1].cloud,35);
 const ninety=detailSkyBarSegments(fine,0,0,90,8),profile=detailSkyBarSegments(points,0,0,1440,8,points.map(p=>(p.epoch-now)/60000));
 for(const offset of [7.5,22.5,37.5,52.5,67.5,82.5]){
  const visual=segments=>segments.find(s=>s.layer==='base'&&s.x1<=offset&&s.x2>offset);
  const a=visual(ninety),b=visual(profile);assert.ok(a&&b);assert.equal(a.color,b.color);assert.equal(a.thicknessLevel,b.thicknessLevel);
 }
 assert.equal(ninety[0].color,'#aeb3b9');assert.ok(ninety.some(s=>s.color==='#ffc229'));
 const missing=quarters.map(q=>({...q,cloud:null,temperature:null,wind:null,pressure:''}));
 const fallback=buildShortTermForecast(missing,hours,'UTC',now,{active:false});
 assert.equal(fallback[0].cloud,60);assert.equal(fallback[0].temperature,22);assert.equal(fallback[0].wind,3);assert.equal(fallback[0].pressure,1015);
 const zero=buildShortTermForecast(quarters.map(q=>({...q,cloud:0,wind:0})),hours,'UTC',now,{active:false});assert.equal(zero[0].cloud,0);assert.equal(zero[0].wind,0);
 assert.match(cockpit,/profileSkyBarFinePoints=adjusted\.filter/);
 assert.match(cockpit,/detailSkyBarSegments\(profileSkyBarBandPoints,[^\n]*profileSkyBarBandPoints\.map\(point=>profileXForEpoch\(point\.epoch\)\)/);
 assert.match(cockpit,/profileSkyBarHourCells=detailSkyBarHourCells\(profileSkyBarPoints\.slice\(0,24\)\)/);
 console.log('MID152: identical quarter-hour sky colors/thickness in 90m and 24h; missing states fall back, real zero retained; hourly squares preserved.');
}finally{rmSync(out,{recursive:true,force:true})}
