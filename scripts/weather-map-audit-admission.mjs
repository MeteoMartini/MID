/**
 * Pure and read-only transport admission for the existing MID weather map audit.
 * A structurally correct PNG is NOT proof of nonempty meteorological data, valid
 * georeferencing, correct provider colors or successful WebGL rendering.
 */
export const MAP_AUDIT_MAX_IMAGE_BYTES=2_000_000;
const MINUTE=60_000,HOUR=60*MINUTE;
const PNG_SIGNATURE=[137,80,78,71,13,10,26,10];
const pngCrcTable=Uint32Array.from({length:256},(_,n)=>{
 let c=n;
 for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function pngCrc(bytes,from,to){
 let crc=0xffffffff;
 for(let i=from;i<to;i++)crc=pngCrcTable[(crc^bytes[i])&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}
function int32(bytes,index){return (bytes[index]*0x1000000+((bytes[index+1]<<16)|(bytes[index+2]<<8)|bytes[index+3]))>>>0;}

/** Validate the complete wire structure, not the weather signal inside the image. */
export function validateMapAuditPng(raw,{width=256,height=256,maxBytes=MAP_AUDIT_MAX_IMAGE_BYTES}={}){
 const bytes=raw instanceof Uint8Array?raw:new Uint8Array(raw);
 if(bytes.length<57||bytes.length>maxBytes)return{ok:false,reason:'png-byte-budget-or-truncation'};
 if(!PNG_SIGNATURE.every((value,index)=>bytes[index]===value))return{ok:false,reason:'not-png'};
 let offset=8,seenHeader=false,seenIdat=false,seenEnd=false,chunks=0,dimensions;
 while(offset+12<=bytes.length&&++chunks<=1000){
  const size=int32(bytes,offset),typeAt=offset+4,start=offset+8,end=start+size;
  if(size>maxBytes||!Number.isSafeInteger(end)||end+4>bytes.length)return{ok:false,reason:'png-truncated-chunk'};
  const type=String.fromCharCode(...bytes.subarray(typeAt,typeAt+4));
  if(!/^[A-Za-z]{4}$/.test(type))return{ok:false,reason:'png-invalid-chunk-type'};
  if(pngCrc(bytes,typeAt,end)!==int32(bytes,end))return{ok:false,reason:'png-crc-mismatch'};
  if(!seenHeader){
   if(type!=='IHDR'||size!==13)return{ok:false,reason:'png-invalid-ihdr'};
   const w=int32(bytes,start),h=int32(bytes,start+4),depth=bytes[start+8],color=bytes[start+9];
   if(w!==width||h!==height)return{ok:false,reason:'png-unexpected-dimensions',width:w,height:h};
   if(![0,2,3,4,6].includes(color)||!({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]}[color]).includes(depth)||bytes[start+10]!==0||bytes[start+11]!==0||bytes[start+12]>1)return{ok:false,reason:'png-invalid-header-encoding'};
   dimensions={width:w,height:h};seenHeader=true;
  }else if(type==='IHDR')return{ok:false,reason:'png-duplicate-header'};
  if(type==='IDAT')seenIdat=true;
  if(type==='IEND'){
   if(size!==0||!seenIdat||end+4!==bytes.length)return{ok:false,reason:'png-invalid-end'};
   seenEnd=true;break;
  }
  offset=end+4;
 }
 return seenHeader&&seenIdat&&seenEnd?{ok:true,...dimensions,bytes:bytes.length,proof:'png-wire-only'}:{ok:false,reason:'png-missing-end-or-pixels'};
}

function validTimes(items){return(Array.isArray(items)?items:[]).filter(value=>typeof value==='string'&&Number.isFinite(Date.parse(value))).sort((a,b)=>Date.parse(a)-Date.parse(b));}
function latestValidRun(items,now){return validTimes(items).filter(value=>Date.parse(value)>=now-120*HOUR&&Date.parse(value)<=now+12*HOUR).at(-1);}
/**
 * Match app's run/time/level admission and the Worker's time windows. Prefer
 * a currently relevant original frame instead of the last (furthest) forecast.
 * The audit never invents an unavailable model run or temporal aggregation.
 */
export function selectMapAuditFrame({layer,metadata,entry,now=Date.now()}){
 if(!metadata||metadata.layer!==layer)return{ok:false,reason:'metadata-layer-mismatch'};
 if(!Number.isFinite(now))return{ok:false,reason:'invalid-reference-clock'};
 const nowcast=/^dwd:(?:Autowarn_|Gewitterzellen$|Gewittercluster$|NCEW_)/.test(layer);
 const timed=Number(entry?.timeCount)>0||Number(entry?.referenceCount)>0||validTimes(metadata.times).length>0;
 const runs=validTimes(metadata.referenceTimes),run=latestValidRun(runs,now);
 if(timed&&!nowcast&&!run)return{ok:false,reason:'unverified-model-run'};
 const windowHours=Number(layer.match(/TOTPREC(\d\d)H$/)?.[1]||0);
 const lower=now-(nowcast?24:48)*HOUR,upper=now+(nowcast?4:204)*HOUR;
 const times=validTimes(metadata.times).filter(value=>{
  const t=Date.parse(value);
  return t>=lower&&t<=upper&&(!run||t>=Date.parse(run)+windowHours*HOUR);
 });
 if(timed&&!times.length)return{ok:false,reason:'no-admissible-valid-time'};
 let time;
 if(times.length){
  const future=times.find(value=>Date.parse(value)>=now-15*MINUTE);
  time=future??times.at(-1);
 }
 const levels=Array.isArray(metadata.elevations)?metadata.elevations.filter(Number.isFinite):[];
 const elevation=levels.length?levels[0]:undefined;
 return{ok:true,time,run:nowcast?undefined:run,elevation,windowHours,phase:nowcast?'observation-or-nowcast':'forecast-or-static'};
}
