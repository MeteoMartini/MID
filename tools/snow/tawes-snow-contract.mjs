/* MID-C51: read-only TAWES snow qualification; no production activation. */
import {readFile} from 'node:fs/promises';
export const metadataUrl='https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min/metadata';
export function snowMetadata(metadata){
 const parameters=Array.isArray(metadata?.parameters)?metadata.parameters:Array.isArray(metadata?.metadata?.parameters)?metadata.metadata.parameters:[];
 const p=parameters.filter(x=>String(x?.name??'').toUpperCase()==='SCHNEE');
 if(p.length!==1)return{ready:false,reason:'missing_or_ambiguous_SCHNEE'};
 if(String(p[0].unit??'').trim().toLowerCase()!=='cm')return{ready:false,reason:'invalid_unit'};
 if(!/schnee|snow/i.test([p[0].long_name,p[0].description].filter(Boolean).join(' ')))return{ready:false,reason:'unknown_semantics'};
 return{ready:true,parameter:'SCHNEE',unit:'cm',measurementClass:'automatic_unverified_snow_depth'};
}
function finite(v){
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(typeof v!=='string'||!/^[-+]?\d+(\.\d+)?$/.test(v.trim()))return null;
 const n=Number(v);return Number.isFinite(n)?n:null;
}
export function snowSample(feature,station,now=Date.now()){
 const props=feature?.properties??{},params=props.parameters??{},raw=params.SCHNEE??params.schnee;
 const values=Array.isArray(raw?.data)?raw.data:Array.isArray(raw?.values)?raw.values:Array.isArray(raw)?raw:[raw?.value??raw];
 let cm=null;for(let i=values.length-1;i>=0;i--){const n=finite(values[i]?.value??values[i]);if(n!==null){cm=n;break}}
 if(cm===null)return{accepted:false,reason:'missing'};
 if(cm<0||cm>1000)return{accepted:false,reason:'implausible'};
 const time=props.timestamp??props.reference_time??feature?.timestamp;
 if(typeof time!=='string'||!/(Z|[+-]\d{2}:?\d{2})$/.test(time))return{accepted:false,reason:'timezone_missing'};
 const epoch=Date.parse(time),age=(now-epoch)/60000;
 if(!Number.isFinite(age)||age< -15||age>180)return{accepted:false,reason:'not_fresh'};
 const site=finite(station?.elevation),target=finite(station?.targetElevation),dist=finite(station?.distanceKm);
 if(site===null||target===null||Math.abs(site-target)>350)return{accepted:false,reason:'height_missing_or_far'};
 if(dist===null||dist<0||dist>25)return{accepted:false,reason:'station_too_far'};
 return{accepted:true,valueCm:cm,unit:'cm',measurementClass:'automatic_unverified_snow_depth',observedAt:new Date(epoch).toISOString()};
}
async function cli(){
 const argv=process.argv.slice(2),i=argv.indexOf('--metadata'),live=argv.includes('--live');
 if((i<0&&!live)||(i>=0&&live)||argv.includes('--station')||argv.includes('--sample')||(i>=0&&!argv[i+1]))throw new Error('invalid_options');
 let metadata;
 if(live){
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),9000);
  try{
   const res=await fetch(metadataUrl,{signal:ac.signal,redirect:'error'});
   if(!res.ok||Number(res.headers.get('content-length')||0)>400000)throw new Error('remote_metadata_unavailable');
   let bytes=0,body='';const decoder=new TextDecoder();
   for await(const part of res.body){bytes+=part.byteLength;if(bytes>400000)throw new Error('metadata_oversize');body+=decoder.decode(part,{stream:true})}
   body+=decoder.decode();metadata=JSON.parse(body);
  }finally{clearTimeout(t)}
 }else metadata=JSON.parse(await readFile(argv[i+1],'utf8'));
 const result=snowMetadata(metadata);
 console.log(JSON.stringify({schema:'mid.tawes.snow.readonly.v1',origin:live?'live_metadata':'offline_fixture',...result}));
 if(!result.ready)process.exitCode=2;
}
if(import.meta.url==='file://'+process.argv[1])cli().catch(e=>{console.error(JSON.stringify({ready:false,reason:'unavailable',errorType:e?.name??'Error'}));process.exitCode=2});
