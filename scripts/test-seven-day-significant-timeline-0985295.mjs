import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'mid-seven-brief-'));
try{
 const out=join(tmp,'seven.cjs');
 await build({entryPoints:['src/sevenDayNarrativeTimeline.ts'],bundle:true,platform:'node',format:'cjs',outfile:out,logLevel:'silent'});
 const {sevenDayNarrativeText:render}=createRequire(import.meta.url)(out);
 const e=(dayIndex,phase,importance,text,kind='weather')=>({dayIndex,phase,importance,text,kind});
 assert.equal(render([e(5,0,5,'Am Samstag Regen'),e(1,1,12,'Morgen Sturmböen möglich'),e(3,2,7,'In der Nacht zum Freitag Schnee möglich')],true),'Morgen Sturmböen möglich. In der Nacht zum Freitag Schnee möglich. Am Samstag Regen.');
 assert.equal(render([e(6,0,3,'Später freundlich'),e(0,0,8,'Heute Regen'),e(2,0,9,'Am Mittwoch Schnee'),e(4,1,12,'Am Freitag schwere Böen möglich')],true),'Heute Regen. Am Mittwoch Schnee. Am Freitag schwere Böen möglich.');
 assert.equal(render([e(0,0,8,'Heute Regen'),e(0,0,8,'Heute Regen'),e(1,2,5,'In der Nacht zum Mittwoch Schauer möglich')],true),'Heute Regen. In der Nacht zum Mittwoch Schauer möglich.');
 assert.equal(render([],true),'Keine markanten Wetteränderungen erkennbar.');
 assert.equal(render([],false),'7-Tage-Prognosedaten unvollständig.');
 assert.equal(render([e(-1,0,10,'Ungültig'),e(0,0,4,'Heute Gewitter möglich.')],true),'Heute Gewitter möglich.');
 const source=await readFile('src/SevenDayForecastSummary.tsx','utf8');
 assert.ok(source.includes('return sevenDayNarrativeText(events,hasUsableData);'),'Full 7-day component must use chronological renderer');
 assert.ok(source.includes("const duplicateThunder=/gewitt/i.test(hazard.text)"),'Same-day thunder warning must not duplicate storm narrative');
 assert.ok(!source.includes('weatherClauses=supplementalClause'),'Late hazard append must not reintroduce time jumps');
 console.log('7-day concise significant timeline: relevance cap, chronological order, duplicates, missing data passed.');
}finally{await rm(tmp,{recursive:true,force:true})}
