import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
const output=await build({stdin:{contents:"export{availableCompositeFutureMinutes,buildAvailableCompositeTimeline}from'./src/CompositeTimeline';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent'});
const {availableCompositeFutureMinutes,buildAvailableCompositeTimeline}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const now=Date.parse('2026-10-08T12:00Z')/1000,hour=3600;
for(const horizon of [48,120,180,360,384]){
 const forecasts=[now+3*hour,now+48*hour,now+horizon*hour],contract={source:'verified native model',observations:[now-300],nowcasts:[now+600],forecasts};
 const rows=buildAvailableCompositeTimeline(now,contract,90,availableCompositeFutureMinutes(now,forecasts));
 assert.equal(rows.at(-1).time,now+horizon*hour,'last published model term must survive navigation');
 assert.deepEqual(rows.filter(r=>r.phase==='forecast').map(r=>r.time),[...new Set(forecasts)].sort((a,b)=>a-b),'no synthetic intermediary terms');
 assert.equal(rows.find(r=>r.live).time,now-300,'live observation stays independent from model horizon');
 if(horizon>204)assert.ok(!buildAvailableCompositeTimeline(now,contract,90,204*60).some(r=>r.time===now+horizon*hour),'fixture reproduces the former cutoff');
}
assert.equal(availableCompositeFutureMinutes(now,[NaN,Infinity,-Infinity]),204*60);
assert.equal(availableCompositeFutureMinutes(now,[]),204*60);
const panel=readFileSync('src/RadarPanel.tsx','utf8');assert.match(panel,/unified\?availableCompositeFutureMinutes\(referenceSeconds,modelForecastTimes\):120/);assert.match(panel,/unified\.times\.map/);
console.log('C23: complete published ICON/EU/IFS/GFS horizons survive navigation; no fabricated terms or changed live observations.');
