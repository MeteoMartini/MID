import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(path.resolve('.mid-synoptic-'));
try{
 await build({entryPoints:['src/synopticComposite.ts','src/unifiedMapCatalog.ts','src/WeatherMapsData.ts'],outdir:temp,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const {SYNOPTIC_COMPONENTS,synopticCompositePlan}=await import(pathToFileURL(path.join(temp,'synopticComposite.js')));
 const {UNIFIED_MAP_PARAMETERS,groupedUnifiedParameters,unifiedSources}=await import(pathToFileURL(path.join(temp,'unifiedMapCatalog.js')));
 const {weatherMapProduct,weatherMapModel}=await import(pathToFileURL(path.join(temp,'WeatherMapsData.js')));assert.equal(weatherMapProduct('obsolete-saved-id').id,'icon-d2-precipitation-totals');assert.equal(weatherMapModel('obsolete-saved-id').id,'observations','New models must not change legacy fallback defaults');
 const run='2026-10-07T12:00:00Z',time='2026-10-07T18:00:00Z',target=Date.parse(time);
 const data={label:'DWD ICON-EU',run,resolutionKm:7,license:'CC BY 4.0',frames:[{hour:6,time,file:'icon-eu-006.bin'}]};
 const plan=synopticCompositePlan(data,target);assert.ok(plan);assert.equal(plan.run,run);assert.equal(plan.time,time);assert.equal(plan.components.length,5);assert.equal(plan.components[0].level,850);assert.equal(plan.components[1].level,500);assert.equal(plan.components[3].level,700);assert.equal(plan.components[4].level,300);
 assert.equal(synopticCompositePlan(data,target+91*60000),null);assert.equal(synopticCompositePlan(undefined,target),null);
 // Run/time/grid/level identities now share one native five-component object,
 // instead of five independent provider styles; field validation covers corrupt identities.
 const grouped=groupedUnifiedParameters(UNIFIED_MAP_PARAMETERS),ids=grouped.flatMap(g=>g.parameters.map(p=>p.id));assert.equal(ids.length,new Set(ids).size);assert.deepEqual([...ids].sort(),UNIFIED_MAP_PARAMETERS.map(p=>p.id).sort(),'Every parameter appears in exactly one group');
 assert.deepEqual(unifiedSources('synoptic',null,false,false).map(s=>s.id),[]);assert.ok(unifiedSources('temperature',null,false,false).some(s=>s.id==='icon-eu'));
 const worker=await readFile('worker-src/20-composite-models.js','utf8');for(const layer of ['Icon-eu_reg00625_fd_sl_TOTPREC12H','Icon_reg025_fd_sl_TOTPREC12H'])assert.ok(worker.includes(layer));
 const config=worker.slice(worker.indexOf('const WEATHER_MAP_LAYER_CONFIG='),worker.indexOf('\nconst WMS_ALLOWED_LAYERS='));
 const responseFunction=worker.slice(worker.indexOf('async function weatherMapWmsResponse('),worker.indexOf('async function compositeWmsResponse('));
 const requests=[],factory=new Function('requests',`${config}\nconst GEOMET_WEATHER_WMS='https://geo.weather.gc.ca/geomet';const WORKER_VERSION='test',DWD_RADAR_WMS_BASES=['https://maps.dwd.de/geoserver/wms'];const dwdLayerForEndpoint=layer=>layer,json=(body,status)=>new Response(JSON.stringify(body),{status});const fetchWithDeadline=async url=>{requests.push(url);return new Response('png',{headers:{'content-type':'image/png'}})};${responseFunction}\nreturn weatherMapWmsResponse;`);
 const proxy=factory(requests),query=new URL('https://mid.test/?provider=dwd&request=GetLegendGraphic&layers=dwd%3AIcon_reg025_fd_pl_T&styles=t_below500hPa_isoarea&layer=unapproved&format=image%2Fpng');
 assert.equal((await proxy(new Request(query))).status,200);const forwarded=new URL(requests[0]);assert.equal(forwarded.searchParams.get('layer'),'dwd:Icon_reg025_fd_pl_T','Legend layer derives exclusively from the approved layer');assert.equal(forwarded.searchParams.get('style'),'t_below500hPa_isoarea');assert.equal(forwarded.searchParams.has('layers'),false);
 query.searchParams.set('layers','unapproved');assert.equal((await proxy(new Request(query))).status,400);assert.equal(requests.length,1,'Unapproved layers never reach upstream');
 assert.ok(unifiedSources('cloud',null,false,false).some(s=>s.id==='gdps'));
 query.searchParams.set('layers','GDPS_15km_TotalCloudCover');query.searchParams.set('provider','dwd');assert.equal((await proxy(new Request(query))).status,400);query.searchParams.set('provider','geomet');query.searchParams.set('request','GetMap');query.searchParams.set('styles','CLOUD');assert.equal((await proxy(new Request(query))).status,200);const geomet=new URL(requests.at(-1));assert.equal(geomet.hostname,'geo.weather.gc.ca');assert.equal(geomet.searchParams.get('interpolation'),'true');assert.equal(geomet.searchParams.get('layers'),'GDPS_15km_TotalCloudCover');
 console.log('Synoptic same-run/time/levels/style validation, exhaustive unique parameter categories, ICON-EU 2m and verified 12h capabilities passed.');
}finally{await rm(temp,{recursive:true,force:true})}
