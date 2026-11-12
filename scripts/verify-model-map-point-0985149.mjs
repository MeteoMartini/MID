import assert from 'node:assert/strict';
import {transform} from 'esbuild';
import {readFileSync} from 'node:fs';
const worker=await import('../worker/metar-proxy.js?point149='+Date.now()),originalFetch=globalThis.fetch;
const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),time=new Date(Date.parse(run)+3600000).toISOString();
let properties,requests=[],contentType='application/json',featureCount=1,padding='';
globalThis.fetch=async input=>{const u=new URL(typeof input==='string'?input:input.url);requests.push(u);return new Response(JSON.stringify({features:Array.from({length:featureCount},()=>({properties})),padding}),{headers:{'content-type':contentType}})};
async function point(overrides={}){
 const params={mode:'weather-map-point',layer:'dwd:Icon-eu_reg00625_fd_gl_T',lat:'50.8',lon:'7',time,reference_time:run,elevation:'2',...overrides},url=new URL('https://mid.test/');
 for(const[key,value]of Object.entries(params))if(value!==undefined)url.searchParams.set(key,String(value));
 const response=await worker.default.fetch(new Request(url),{});return {status:response.status,data:await response.json()};
}
try{
 properties={Temperature_height_level_above_ground:14.6,TIME:time,REFERENCE_TIME:run,ELEVATION:2};
 let result=await point();assert.equal(result.status,200);assert.equal(result.data.value,14.6);assert.equal(result.data.unit,'°C');assert.equal(result.data.layer,'dwd:Icon-eu_reg00625_fd_gl_T');
 for(const u of requests){assert.ok(['maps.dwd.de','brz-maps.dwd.de'].includes(u.hostname));assert.equal(u.searchParams.get('request'),'GetFeatureInfo');assert.equal(u.searchParams.get('time'),time);assert.equal(u.searchParams.get('dim_reference_time'),run);assert.equal(u.searchParams.get('elevation'),'2');const bbox=u.searchParams.get('bbox').split(',').map(Number);assert.ok(Math.abs((bbox[0]+bbox[2])/2-7)<1e-10&&Math.abs((bbox[1]+bbox[3])/2-50.8)<1e-10,'Query pixel is centered at the selected geographic point');assert.equal(u.searchParams.get('query_layers'),u.searchParams.get('layers'));assert.equal(u.searchParams.get('width'),'101');assert.equal(u.searchParams.get('x'),'50');}
 for(const invalid of [{lat:'NaN'},{lon:'181'},{time:'bad'},{reference_time:undefined},{elevation:'NaN'},{layer:'https://attacker.invalid/x'},{layer:'dwd:Icon_reg025_fd_sl_UV10M'}]){requests=[];result=await point(invalid);assert.equal(result.data.available,false);assert.equal(requests.length,0,'Invalid requests never reach an upstream');}
 for(const bad of [null,{}, {...properties,TIME:run},{...properties,REFERENCE_TIME:time},{...properties,ELEVATION:50},{...properties,Temperature_height_level_above_ground:null},{...properties,Temperature_height_level_above_ground:280},{...properties,Temperature_isobaric_level:14.5}]){properties=bad;result=await point();assert.equal(result.data.available,false,'Unknown, wrong-time/run/level or unverified fields fail closed');properties={Temperature_height_level_above_ground:14.6,TIME:time,REFERENCE_TIME:run,ELEVATION:2};}
 contentType='text/xml';assert.equal((await point()).data.available,false);contentType='application/json';featureCount=2;assert.equal((await point()).data.available,false);featureCount=1;padding='x'.repeat(66000);assert.equal((await point()).data.available,false,'Oversized provider bodies are bounded');padding='';
 properties={Pressure_reduced_to_MSL_mean_sea_level:1030.5,TIME:time,REFERENCE_TIME:run};result=await point({layer:'dwd:Icon_reg025_fd_sl_PMSL',elevation:undefined});assert.equal(result.data.value,1030.5);assert.equal(result.data.unit,'hPa');
 properties={Temperature_isobaric_level:6.3,TIME:time,REFERENCE_TIME:run,ELEVATION:850};result=await point({layer:'dwd:Icon_reg025_fd_pl_T',elevation:850});assert.equal(result.data.value,6.3);assert.equal(result.data.unit,'°C');
 properties={'Total_precipitation-1h_ground_or_water_surface':0,TIME:time,REFERENCE_TIME:run};result=await point({layer:'dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H',elevation:undefined});assert.equal(result.data.available,true);assert.equal(result.data.value,0,'Verified dry zero is not a missing value');assert.equal(result.data.unit,'mm');
 globalThis.fetch=async()=>new Response(`<WMS_Capabilities><Capability><Layer><Layer queryable="1"><Name>Icon_reg025_fd_sl_T2M</Name><Dimension name="time">${time}</Dimension><Dimension name="reference_time">${run}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`,{headers:{'content-type':'application/xml'}});
 const metadataResponse=await worker.default.fetch(new Request('https://mid.test/?mode=weather-map-metadata&layer=dwd:Icon_reg025_fd_sl_T2M'),{});const metadata=await metadataResponse.json();assert.equal(metadata.pointUnit,'°C','Queryable metadata exposes only the verified scalar unit, including unprefixed workspace catalogs');
 const probe=readFileSync('src/ModelMapProbe.tsx','utf8'),coordinator=readFileSync('src/mapProbeGroup.ts','utf8');
 assert.ok(probe.includes('AppPortalPopover')&&probe.includes('role="dialog"'));
 assert.ok(probe.includes('new MapProbeGroup()')&&probe.includes("map.on('movestart',move)")&&probe.includes('const move=()=>group.close()'),'One per-map coordinator closes on map moves');
 assert.ok(probe.includes("map.off('movestart',store.move)"),'Every map listener must be removed after the last layer');
 assert.ok(coordinator.includes('this.pending?.abort()')&&coordinator.includes('controller.signal.aborted||this.point?.revision!==revision'),'Abort and revision fence must survive moving sampling out of the React component');
 assert.ok(!probe.includes('window.setTimeout')&&!probe.includes('document.addEventListener'),'No copied generic portal/dismiss engine');
 // Execute the current coordinator as well: a stale first response cannot
 // overwrite the new coordinate or silently turn an observed zero into NoData.
 const {code:coordinatorJs}=await transform(coordinator,{loader:'ts',format:'esm',target:'es2022'});
 const {MapProbeGroup}=await import('data:text/javascript;base64,'+Buffer.from(coordinatorJs).toString('base64'));
 const group=new MapProbeGroup();
 let oldResolve,oldSignal,view,first=true;
 group.add({id:Symbol('DWD-point'),read:()=>({
  label:'Niederschlag',unit:'mm',source:'DWD ICON-D2',unavailableNote:'Originalwert fehlt',
  format:value=>String(value),
  sample:(_lat,_lon,signal)=>{
   if(first){first=false;oldSignal=signal;return new Promise(resolve=>{oldResolve=resolve})}
   return 0;
  }
 }),notify:state=>{view=state}});
 group.show(50.8,7);assert.equal(view.point.rows[0].pending,true);
 group.show(50.9,7.1);assert.equal(oldSignal.aborted,true);
 assert.equal(view.point.latitude,50.9);assert.equal(view.point.rows[0].value,0);
 oldResolve(99);await Promise.resolve();await Promise.resolve();
 assert.equal(view.point.rows[0].value,0,'Stale previous coordinate cannot overwrite genuine dry zero');
 group.close();assert.equal(view.point,null,'Closing map dialog clears the active point');
 console.log('MID149: bounded, whitelisted DWD scalar point queries; exact time/run/level, dry/missing distinction, unsupported units and abort/portal contracts verified.');
}finally{globalThis.fetch=originalFetch}
