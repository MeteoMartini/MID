import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid319-radar-'));
try{
 await build({entryPoints:['src/radarNowcastVisual.ts'],outfile:join(dir,'visual.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {radarBarIntensity,radarBarScenario,radarBarIntensityLabel}=await import(pathToFileURL(join(dir,'visual.mjs')));
 for(const [rate,band] of [[0,'light'],[.01,'light'],[.5,'light'],[.51,'moderate'],[2.5,'moderate'],[4,'moderate'],[4.01,'strong'],[10,'strong'],[87,'strong'],[NaN,'missing'],[-1,'missing']])assert.equal(radarBarIntensity(rate),band);
 assert.equal(radarBarIntensity(20,true),'missing','NoData cannot appear as a strong rain report');
 for(const [chance,band] of [[0,'low'],[34.99,'low'],[35,'medium'],[69.99,'medium'],[70,'high'],[100,'high'],[undefined,'unknown'],[NaN,'unknown'],[-1,'unknown'],[101,'unknown']])assert.equal(radarBarScenario(true,chance),band);
 assert.equal(radarBarScenario(false,undefined),'observed','Observation is not a forecast probability');
 assert.equal(radarBarIntensityLabel('strong'),'stark');
 const app=readFileSync('src/App.tsx','utf8'),css=readFileSync('src/radarForecastReadability.css','utf8');
 for(const contract of ['className={`radar-nowcast-wet intensity-','scenario-${radarBarScenario(segment.future,segment.hitProbability)}','Szenarioanteil (unkalibriert)','radar-nowcast-visual-legend','typeof frame.hitProbability===\'number\''])assert.ok(app.includes(contract),`Nowcast usage missing: ${contract}`);
 for(const band of ['light','moderate','strong'])assert.ok(css.includes(`radar-nowcast-wet.intensity-${band}`),'Intensity must be styled in shared RADAR gate');
 for(const band of ['low','medium','high','unknown'])assert.ok(css.includes(`radar-nowcast-wet.scenario-${band}`),'Every uncalibrated ensemble state must have independent styling');
 assert.ok(css.includes('.radar-nowcast-wet.radar-nowcast-missing'),'Missing data remains visually distinct');
 assert.ok(!app.includes('Math.max(0,Math.min(100,Number(frame.hitProbability)))'),'Null may not silently become 0%');
 console.log('MID .319 radar nowcast: source intensity, forecast uncertainty, genuine zero and missing, shared CSS, and access semantics checked');
}finally{rmSync(dir,{recursive:true,force:true})}
