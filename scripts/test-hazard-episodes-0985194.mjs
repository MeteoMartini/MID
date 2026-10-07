import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(path.resolve('.mid-hazard-episodes-'));
try{
 const outfile=path.join(temp,'episodes.mjs');
 await build({entryPoints:['src/hazardEpisodes.ts'],outfile,bundle:true,platform:'node',format:'esm'});
 const {mergeHazardEpisodes}=await import(pathToFileURL(outfile));
 const at=hour=>new Date(Date.UTC(2026,9,9,hour)).toISOString();
 const base={kind:'wind',level:'low',stageRank:1,title:'Windböen',displayMetric:'bis zu 35 kt',text:'Modellsignal',displayText:'Böen aus südwestlicher Richtung möglich.',scopeLabel:'lokal',validFrom:at(10),validTo:at(21)};
 const future={...base,validFrom:at(17),validTo:at(26),scopeLabel:'MID · Vorhinweis',conditional:true,displayText:base.displayText+' Langfristiges Modellsignal; keine ortsscharfe Warnung.'};
 const original=[base,future,{...future,validFrom:at(21),validTo:at(29)}];
 const snapshot=JSON.stringify(original),merged=mergeHazardEpisodes(original);
 assert.equal(merged.length,1);assert.equal(merged[0].validFrom,at(10));assert.equal(merged[0].validTo,at(29));
 assert.match(merged[0].displayText,/keine ortsscharfe Warnung/);assert.equal(merged[0].conditional,true);assert.equal(JSON.stringify(original),snapshot);
 assert.deepEqual(mergeHazardEpisodes(merged),merged,'idempotent across consumers');
 for(const different of [{level:'moderate',stageRank:2},{displayMetric:'bis zu 50 kt'},{displayText:'Konvektive Böen möglich.'},{displayText:'Böen aus östlicher Richtung möglich.'},{lowerIntensity:true},{validFrom:at(30),validTo:at(32)}])assert.equal(mergeHazardEpisodes([base,{...future,...different}]).length,2);
 assert.equal(mergeHazardEpisodes([{...base,kind:'heavyRain'},{...future,kind:'heavyRain'}]).length,2,'accumulation windows must stay distinct');
 assert.equal(mergeHazardEpisodes([base,{...future,validFrom:undefined}]).length,2,'invalid interval is not discarded');
 const weather=await readFile('src/weather-src/30-ensemble-climate-hazards.tsfrag','utf8');
 assert.match(weather,/return mergeHazardEpisodes\(rows\.map/,'canonical path, not a UI-only filter');
 console.log('MID wind episodes: screenshot chain merged; stages, direction, convective risks, gaps and rainfall preserved.');
}finally{await rm(temp,{recursive:true,force:true})}
