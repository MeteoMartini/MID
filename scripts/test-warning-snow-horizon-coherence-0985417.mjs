import assert from 'node:assert/strict';
import {build} from 'esbuild';

async function load(contents){
 const result=await build({stdin:{contents,loader:'ts',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const [{hazards},{summarizeDwdWarnings,formatDwdWarningValue},{detailSkyBarSegments,detailSkyBarHourCells}]=await Promise.all([
 load("export{hazards}from'./src/weather';"),
 load("export{summarizeDwdWarnings,formatDwdWarningValue}from'./src/dwdWarnings';"),
 load("export{detailSkyBarSegments,detailSkyBarHourCells}from'./src/detailSkyBar';")
]);
const start=Date.parse('2026-11-03T17:00:00Z'),hour=3600000,originalNow=Date.now;
function sample(at,cm,count=336){
 return Array.from({length:count},(_,i)=>{
  const snow=i>=at&&i<at+4?cm/4:0;
  return{epoch:start+i*hour,time:new Date(start+i*hour).toISOString(),timezone:'Europe/Berlin',
   temperature:snow?0:4,apparent:4,dewPoint:0,humidity:80,cloud:60,wind:1,gust:1,direction:0,
   precipitation:snow/10,rain:0,showers:0,snowfall:snow,code:snow?71:0,visibility:12000};
 });
}
const snowWarnings=rows=>hazards(rows,undefined,53,'kmh').filter(item=>item.kind==='snow');
try{
 Date.now=()=>start;
 const day9=snowWarnings(sample(9*24,.4));
 assert.equal(day9.length,0,'Day-10 snow after the 7d horizon must not appear merely because it lies in the trailing 72h accumulation context');
 const longTrace=snowWarnings(sample(6*24,.4));
 assert.equal(longTrace.length,0,'Long-range 0.4cm event is not a meaningful top-level warning');
 const material=snowWarnings(sample(6*24,4));
 assert.ok(material.length>0,'Material snow inside the first 7d must remain visible');
 assert.ok(material.every(s=>Date.parse(s.validFrom)<start+168*hour),'Actual event start stays inside published warning horizon');
 assert.ok(material.some(s=>(s.precisionLabel??'').includes('Prognosetag 7')),'Day label follows actual event lead, not hardcoded Tag 6–7');
 const beyondSnow=(rows,offset=9*24,cm=25)=>rows.map((row,i)=>{
  const extra=i>=offset&&i<offset+4?cm/4:0;
  return extra?{...row,temperature:0,precipitation:extra/10,snowfall:extra,code:71}:row;
 });
 const traceAtBoundary=beyondSnow(sample(6*24,.2));
 assert.equal(snowWarnings(traceAtBoundary).length,0,'A 0.2cm day-7 trace plus 25cm on day 10 MUST NOT generate a spurious 25cm/72h day-7 warning');
 const visibleOnly=snowWarnings(sample(6*24,4));
 const mixedWithFuture=snowWarnings(beyondSnow(sample(6*24,4)));
 const signature=rows=>rows.map(row=>[row.level,row.title,row.metric,row.displayMetric,row.validFrom,row.validTo,row.precisionLabel]);
 assert.deepEqual(signature(mixedWithFuture),signature(visibleOnly),'Out-of-horizon 25cm must never inflate or change a real 4cm snow event inside the warning horizon');
 // Incomplete rolling windows at the seven-day boundary must not be
 // interpreted as complete 72h accumulations or silently padded with zero.
 const boundaryOnly=snowWarnings(sample(167,0.5));
 assert.ok(boundaryOnly.every(row=>!String(row.metric).includes('/72 h')),'A 72h window extending beyond the display limit cannot qualify a 72h MID warning');
 const near=snowWarnings(sample(24,.4));
 assert.ok(near.length>0,'Near-term physically supported trace snow remains a forecast hint');
 assert.ok(near.every(s=>(s.displayMetric??'').includes('unter 1 cm')),'Sub-1cm model amount must stay below 1cm, not an invented 3cm band');
 assert.ok(near.every(s=>!(s.displayMetric??'').includes('bis zu 3 cm')),'No inflated snow headline');
 const raw=summarizeDwdWarnings(sample(24,.4).slice(0,96),53).find(s=>s.kind==='snow'&&s.value>0&&s.value<1);
 assert.ok(raw,'Underlying 0.1cm DWD-like detection remains available');
 assert.ok(formatDwdWarningValue(raw,'kmh').includes('unter 1 cm'),'Format a genuine trace without rounding to zero');
 assert.equal(snowWarnings(sample(-1,0)).length,0,'True zero remains dry');
 const sky={epoch:start,isDay:true,cloud:45,sunshineDuration:3600,precipitation:0,rain:0,showers:0,snowfall:0,code:0,precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:start+hour};
 const band=detailSkyBarSegments([sky],0,0,100,8).find(s=>s.layer==='base');
 assert.equal(band?.thicknessLevel,1,'45% total cloud => 55% open sky => yellow level 1 despite 100% sunshine');
 assert.equal(detailSkyBarHourCells([sky])[0].base?.thicknessLevel,1,'Hour cells share the same level');
 assert.match(band?.title??'',/Sonnenscheindauer 100 %/,'Retain separately sourced duration in title');
 console.log('PASS: seven-day snow hint cutoff, trace gate, real 4cm, meaningful rounding, dynamic lead and skybar 45% coherence.');
}finally{Date.now=originalNow}
