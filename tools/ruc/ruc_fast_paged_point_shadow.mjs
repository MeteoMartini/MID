/* Pages-only original-DWD Fast 0-6h immutable read-only point consumer.
 * SHADOW ONLY. Fetches four <=86kB immutable chunks; checks every fetched
 * SHA-256. Requires the SHA of the full paged manifest from a trusted release,
 * never from a URL parameter or another untrusted HTTP response.
 * No activation, R2 writing, probability fabrication or client SLO claim.
 */
const SCHEMA='mid.ruc.fast-paged-shadow.v1';
const PARTS={'lookup.bin':[4,1], 'deterministic.bin':[168,7], 'rapid-5m.bin':[146,73], 'rapid-15m.bin':[150,25]};
const FIELDS=[
 ['temperature_2m','°C',.01,0],['dew_point_2m','°C',.01,0],['relative_humidity_2m','%',.1,0],
 ['pressure_msl','hPa',.1,0],['wind_speed_10m','kn',.01,0],['wind_direction_10m','°',.1,0],
 ['wind_gusts_10m','kn',.01,0],['precipitation','mm',.01,0],['cloud_cover','%',.1,0],
 ['cloud_cover_low','%',.1,0],['cape','J/kg',.1,0],['convective_inhibition','J/kg',.1,0]
];
const SHA=/^[a-f0-9]{64}$/;
const fail=(condition,reason)=>{if(condition)throw Error(reason)};
function utcRun(value) {
 fail(typeof value!=='string'||!/^20\d{2}-\d\d-\d\dT\d\d:00$/.test(value),'not a canonical DWD UTC run');
 const d=new Date(value+'Z');
 fail(!Number.isFinite(d.getTime())||d.toISOString().slice(0,16)!==value,'invalid native calendar');
 return d.getTime();
}
const isoMinute=(n)=>new Date(n).toISOString().slice(0,16);
export async function sha256hex(bytes) {
 fail(!(bytes instanceof Uint8Array)||bytes.byteLength>4_000_000,'unbounded SHA input');
 fail(!globalThis.crypto?.subtle,'SHA-256 runtime unavailable');
 const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function inspect(manifest) {
 fail(!manifest||manifest.schema!==SCHEMA,'unknown paged Fast schema');
 for(const flag of ['productionEnabled','publicationAuthorized','realtimeConsumerEnabled'])
  fail(manifest[flag]!==false,'unapproved Fast activation');
 fail(manifest.epsAvailable!==false||manifest.nativePoints!==542040||manifest.chunkCells!==512,'invalid original Fast/EPS geometry');
 const start=utcRun(manifest.run);
 fail(!SHA.test(manifest.sourceManifestSha256||'')||!SHA.test(manifest.sourceGribSha256||''),'untrusted DWD SHA');
 const expectedAxis=(step,length)=>Array.from({length},(_,i)=>isoMinute(start+step*60_000*i));
 for(const [name,step,length] of [['hourly',60,7],['rapid5',5,73],['rapid15',15,25]])
  fail(JSON.stringify(manifest.timeAxes?.[name])!==JSON.stringify(expectedAxis(step,length)),'invalid model validity or accumulation axis: '+name);
 fail(manifest.fields?.length!==12||FIELDS.some((spec,i)=>spec.some((x,k)=>manifest.fields[i][['name','unit','scale','offset'][k]]!==x)),
  'native field units or scale mismatch');
 const {nx,ny,nativePointCount}=manifest.grid||{};
 fail(!Number.isInteger(nx)||!Number.isInteger(ny)||nx!==964||ny!==596||nativePointCount!==542040,'native projection geometry mismatch');
 fail(Object.keys(manifest.objects||{}).sort().join(',')!==Object.keys(PARTS).sort().join(','),'original Fast object inventory incomplete');
 let total=0;
 const prefix='fast/pages/'+manifest.run.replaceAll('-','').replaceAll(':','')+'/';
 for(const [name,[bytesPerCell]] of Object.entries(PARTS)) {
  const obj=manifest.objects[name],count=name==='lookup.bin'?nx*ny:542040;
  fail(!obj||obj.cellCount!==count||obj.bytesPerCell!==bytesPerCell||!SHA.test(obj.sourceSha256||''),'native part provenance mismatch');
  const all=obj.parts;
  fail(!Array.isArray(all)||all.length!==Math.ceil(count/512)||all.length>2000,'unbounded/incomplete native chunks');
  let next=0;
  for(let i=0;i<all.length;i++){
   const part=all[i],cells=Math.min(512,count-next);
   const key=prefix+name.slice(0,-4)+'/'+String(i).padStart(4,'0')+'.bin';
   fail(part.firstCell!==next||part.cells!==cells||part.bytes!==cells*bytesPerCell||part.key!==key||!SHA.test(part.sha256||''),'tampered chunk index/path/hash');
   next+=cells;
  }
  fail(next!==count,'missing native source cells');total+=count*bytesPerCell;
 }
 fail(total!==manifest.sourceNativeBytes||total!==253813284,'original native binary physical length drift');
 return {start,nx,ny};
}
function asUint8Array(value){
 fail(!(value instanceof Uint8Array),'invalid fetched native chunk');
 return value;
}
async function fetchNative(manifest,objectName,index,read) {
 const obj=manifest.objects[objectName],n=Math.floor(index/512),part=obj.parts[n];
 fail(!part||index<part.firstCell||index>=part.firstCell+part.cells,'point index beyond native chunk');
 const bytes=asUint8Array(await read(part.key));
 fail(bytes.length!==part.bytes||bytes.byteLength>512*168,'missing/oversized original chunk');
 fail(await sha256hex(bytes)!==part.sha256,'native chunk SHA mismatch');
 return {view:new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),offset:(index-part.firstCell)*obj.bytesPerCell};
}
function numberOrMissing(view,position,field){
 const x=view.getInt16(position,true);
 return x===-32768?null:x*field[2]+field[3];
}
export async function readPagedFastPointShadow(manifestBytes,verifiedManifestSha256,read,lookupGridIndex) {
 const original=asUint8Array(manifestBytes);
 fail(original.byteLength>3_000_000||!SHA.test(verifiedManifestSha256||''),'manifest not release SHA pinned');
 fail(await sha256hex(original)!==verifiedManifestSha256,'paged manifest not SHA admitted');
 const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(original));
 const {start,nx,ny}=inspect(manifest);
 fail(typeof read!=='function'||!Number.isSafeInteger(lookupGridIndex)||lookupGridIndex<0||lookupGridIndex>=nx*ny,'unverified native lookup request');
 const found=await fetchNative(manifest,'lookup.bin',lookupGridIndex,read);
 const nativeIndex=found.view.getUint32(found.offset,true);
 if(nativeIndex===0xffffffff)return {available:false,reason:'outside-native-grid',productionAuthorized:false};
 fail(nativeIndex>=542040,'invalid native lookup index');
 const data={};
 for(const [name,[length,count]] of Object.entries(PARTS)){
  if(name==='lookup.bin')continue;
  const {view,offset}=await fetchNative(manifest,name,nativeIndex,read);
  const fields=name==='deterministic.bin'?FIELDS:name==='rapid-5m.bin'?[FIELDS[7]]:[FIELDS[7],FIELDS[10],FIELDS[11]];
  const recordBytes=length/count;
  data[name]=Array.from({length:count},(_,time)=>fields.map((field,index)=>numberOrMissing(view,offset+time*recordBytes+2*index,field)));
 }
 const hours=data['deterministic.bin'].map((values,i)=>({
  validTimeUtc:new Date(start+i*3600000).toISOString(),
  intervalStartUtc:i===0?null:new Date(start+(i-1)*3600000).toISOString(),
  fields:Object.fromEntries(FIELDS.map((f,k)=>[f[0],k===7&&i===0?null:values[k]]))
 }));
 const intervals=(name,step)=>data[name].map((values,i)=>({
  validTimeUtc:new Date(start+i*step*60000).toISOString(),
  intervalStartUtc:i===0?null:new Date(start+(i-1)*step*60000).toISOString(),
  intervalEndUtc:i===0?null:new Date(start+i*step*60000).toISOString(),
  precipitationMm:i===0?null:values[0],...(step===15?{capeJkg:values[1],cinJkg:values[2]}:{})
 }));
 return {schema:'mid.ruc.fast-paged-cell-shadow.v1',available:true,modelRunUtc:new Date(start).toISOString(),
  source:'DWD ICON-D2 RUC original native deterministic',nativeIndex,hours,rapid5Minutes:intervals('rapid-5m.bin',5),
  rapid15Minutes:intervals('rapid-15m.bin',15),epsAvailable:false,productionAuthorized:false,consumerAdoptionVerified:false};
}
