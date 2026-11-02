/**
 * MID RUC native fast-cell _shadow_ reader, source-only, no live endpoint.
 * Source: verified mid.ruc.fast-shadow-pointer.v1, original DWD 0–6h.
 * Requires immutable producer byte admission before any R2 bucket is passed;
 * Ranged reads themselves cannot prove full-object SHA and do NOT authorize
 * live client adoption, even if unit tests pass.
 */
const POINTER='mid.ruc.fast-shadow-pointer.v1';
const MISSING=-32768, NODATA=0xffffffff;
const FIELDS=[
 ['temperature_2m','°C',.01,0],['dew_point_2m','°C',.01,0],
 ['relative_humidity_2m','%',.1,0],['pressure_msl','hPa',.1,0],
 ['wind_speed_10m','kn',.01,0],['wind_direction_10m','°',.1,0],
 ['wind_gusts_10m','kn',.01,0],['precipitation','mm',.01,0],
 ['cloud_cover','%',.1,0],['cloud_cover_low','%',.1,0],
 ['cape','J/kg',.1,0],['convective_inhibition','J/kg',.1,0]
];
const PRODUCTS={
 'deterministic.bin':{records:7,fields:12},
 'rapid-5m.bin':{records:73,fields:1},
 'rapid-15m.bin':{records:25,fields:3}
};
function failIf(x,description){if(x)throw Error(description)}
export function strictRun(value){
 failIf(typeof value!=='string'||!/^20\d\d-\d\d-\d\dT\d\d:00$/.test(value),'noncanonical UTC run');
 const d=new Date(value+'Z');
 failIf(!Number.isFinite(d.getTime())||d.toISOString().slice(0,16)!==value,'invalid UTC run');
 return d.getTime();
}
function axis(start,minutes){return new Date(start+minutes*60000).toISOString().slice(0,16)}
function checkAxis(input,start,step,number){
 return Array.isArray(input)&&input.length===number&&input.every((time,i)=>time===axis(start,i*step));
}
export function validateFastShadow(pointer){
 failIf(!pointer||typeof pointer!=='object'||pointer.schema!==POINTER,'bad fast pointer schema');
 for(const key of ['productionEnabled','publicationAuthorized','realtimeConsumerEnabled','consumerAdoptionVerified'])
  failIf(pointer[key]!==false,'unproven live activation: '+key);
 failIf(pointer.horizonHours!==6||pointer.eps?.availability!=='unavailable','Fast must not claim EPS20');
 failIf(pointer.nativePoints!==542040||pointer.grid?.nativePointCount!==542040,'invalid native DWD geometry');
 const {nx,ny}=pointer.grid;
 failIf(!Number.isSafeInteger(nx)||!Number.isSafeInteger(ny)||nx<1||ny<1||nx*ny>10000000,'invalid lookup geometry');
 const stamp=strictRun(pointer.run);
 failIf(!checkAxis(pointer.dataTimes,stamp,60,7)||!checkAxis(pointer.rapid5Times,stamp,5,73)||
   !checkAxis(pointer.rapid15Times,stamp,15,25),'invalid native valid-time axis');
 failIf(!Array.isArray(pointer.fields)||pointer.fields.length!==FIELDS.length||
   pointer.fields.some((item,i)=>FIELDS[i].some((expected,j)=>item[['name','unit','scale','offset'][j]]!==expected)),
   'invalid units/scales or field ordering');
 const prefix='fast/runs/'+pointer.run.replaceAll('-','').replaceAll(':','')+'/';
 const names=Object.keys(pointer.objects||{});
 failIf(names.length!==4||!['lookup.bin',...Object.keys(PRODUCTS)].every(x=>names.includes(x)),'incomplete native objects');
 const expected={...Object.fromEntries(Object.entries(PRODUCTS).map(([name,p])=>[name,p.records*p.fields*2*542040])), 'lookup.bin':nx*ny*4};
 for(const name of Object.keys(expected)){
  const item=pointer.objects[name];
  failIf(item.key!==prefix+name||item.bytes!==expected[name]||!(/^[a-f0-9]{64}$/.test(item.sha256||'')),'missing native object SHA/dimensions: '+name);
 }
 return {stamp,prefix,nx,ny};
}
/**
 * Admission-only joint contract; it never combines two different model runs
 * into one falsely homogeneous forecast or maps deterministic Fast to EPS20.
 */
export function inspectJointFullFastAxes(full,fast) {
 const {stamp:fastStamp}=validateFastShadow(fast);
 failIf(full?.schema!=='mid.dwd.ruc.grid.v2'||full?.storageProfile!=='pages-lossless-v1',
   'unverified canonical 27h RUC source');
 failIf(full.pointCount!==fast.nativePoints||full.eps?.memberCount!==20,
   'original native grid or 20-EPS contract mismatch');
 const fullStamp=strictRun(full.run);
 const axis28=Array.from({length:28},(_,i)=>axis(fullStamp,i*60));
 for(const key of ['times'])
  failIf(!Array.isArray(full[key])||full[key].length!==28||full[key].some((x,i)=>x!==axis28[i]),
     '27h full validity axis drift');
 for(const key of ['deterministic','epsSummary','eps']) {
  const times=full[key]?.times;
  failIf(!Array.isArray(times)||times.length!==28||times.some((x,i)=>x!==axis28[i]),
     '27h product/EPS validity axis drift: '+key);
 }
 failIf(fastStamp<fullStamp||fastStamp-fullStamp>21600000,'unrelated full/Fast model run');
 return {schema:'mid.ruc.full-fast-axes-shadow-proof.v1',fullModelRunUtc:new Date(fullStamp).toISOString(),
   fastModelRunUtc:new Date(fastStamp).toISOString(),fullValidTimes:28,fastValidTimes:7,
   fullEpsMembers:20,fastEpsMembers:0,productionAuthorized:false};
}
function decoded(raw,field){return raw===MISSING?null:raw*field[2]+field[3];}
function checkBucket(bucket){failIf(!bucket||typeof bucket.get!=='function','trusted read-only R2 binding required')}
async function range(bucket,key,offset,length){
 failIf(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(length)||length<=0||length>256,'excessive native per-cell read');
 const object=await bucket.get(key,{range:{offset,length}});
 failIf(!object||typeof object.arrayBuffer!=='function','missing original R2 object');
 const buffer=await object.arrayBuffer();
 failIf(buffer.byteLength!==length,'truncated or oversized original R2 range');
 return new DataView(buffer);
}
function sampleProduct(view,product){
 const fields=product.fields;
 const data=[];
 for(let t=0;t<product.records;t++){
  const row=[];
  for(let k=0;k<fields;k++){
   const f=product.records===7?FIELDS[k]:fields===1?FIELDS[7]:[FIELDS[7],FIELDS[10],FIELDS[11]][k];
   row.push(decoded(view.getInt16((t*fields+k)*2,true),f));
  }
  data.push(row);
 }
 return data;
}
/**
 * A verified native point lookup index is supplied by the canonical published
 * grid lookup (nx/ny/lat/lon mapping checked by producer). This consumer does
 * NOT turn coordinates into unverified index heuristics.
 */
export async function readFastPointShadow(pointer,bucket,{lookupIndex}={}){
 const {stamp,nx,ny}=validateFastShadow(pointer);
 checkBucket(bucket);
 failIf(!Number.isSafeInteger(lookupIndex)||lookupIndex<0||lookupIndex>=nx*ny,'invalid canonical lookup-grid index');
 const ptr=pointer.objects['lookup.bin'];
 const found=await range(bucket,ptr.key,lookupIndex*4,4);
 const nativeIndex=found.getUint32(0,true);
 if(nativeIndex===NODATA)return {available:false,reason:'outside-native-grid',productionAuthorized:false};
 failIf(nativeIndex>=542040,'invalid lookup native cell index');
 const out={};
 for(const [name,product] of Object.entries(PRODUCTS)){
  const descriptor=pointer.objects[name];
  const bytes=product.records*product.fields*2;
  const view=await range(bucket,descriptor.key,nativeIndex*bytes,bytes);
  out[name]=sampleProduct(view,product);
 }
 // Initialization timestamp is not an elapsed accumulation interval.
 const minutes5=out['rapid-5m.bin'].map((r,i)=>({validTimeUtc:new Date(stamp+i*300000).toISOString(),intervalStartUtc:i===0?null:new Date(stamp+(i-1)*300000).toISOString(),intervalEndUtc:i===0?null:new Date(stamp+i*300000).toISOString(),precipitationMm:i===0?null:r[0]}));
 const minutes15=out['rapid-15m.bin'].map((r,i)=>({validTimeUtc:new Date(stamp+i*900000).toISOString(),intervalStartUtc:i===0?null:new Date(stamp+(i-1)*900000).toISOString(),intervalEndUtc:i===0?null:new Date(stamp+i*900000).toISOString(),precipitationMm:i===0?null:r[0],capeJkg:r[1],cinJkg:r[2]}));
 return {schema:'mid.ruc.fast-cell-shadow.v1',available:true,productionAuthorized:false,consumerAdoptionVerified:false,epsAvailable:false,modelRunUtc:new Date(stamp).toISOString(),nativeIndex,validityHours:out['deterministic.bin'].map((v,i)=>({validTimeUtc:new Date(stamp+i*3600000).toISOString(),values:Object.fromEntries(FIELDS.map((f,k)=>[f[0],v[k]]))})),rapid5Minutes:minutes5,rapid15Minutes:minutes15};
}
