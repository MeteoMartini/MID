import type {NativeIndex} from './nativeModelFields';
export const RUC_MAP_KINDS=['temperature','pressure','wind','gust','cloud','precipitation'] as const;
const units={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',precipitation:'mm/1 h'};
const sha=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
// DWD's offsetless manifest run is UTC, regardless of the browser timezone.
const utc=(s:string)=>Date.parse(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)?s+'Z':s);
export function validateRucMapIndex(raw:unknown,run:string,now=Date.now()):NativeIndex{
 const index=raw as NativeIndex&{sourceManifestSha256:string;maxNearestKm:number},stamp=utc(run);
 if(!index||index.schema!=='mid.ruc.map-fields.v1'||index.modelId!=='icon-d2-ruc'||index.sampling!=='nearest-native-cell'||!sha(index.sourceManifestSha256)||!Number.isFinite(stamp)||typeof index.run!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(index.run)||Date.parse(index.run)!==stamp||now-stamp>4*3600000||stamp>now+3600000||!Number.isFinite(index.maxNearestKm)||index.maxNearestKm<=0||index.maxNearestKm>5)throw Error('Kein gültiger aktueller RUC-Kartenlauf.');
 if(!index.products||Object.keys(index.products).length!==6)throw Error('Unvollständiger RUC-Kartenkatalog.');
 let horizon:number|undefined;
 for(const kind of RUC_MAP_KINDS){
  const product=index.products[kind],start=kind==='gust'||kind==='precipitation'?1:0;
  if(!product||product.unit!==units[kind]||!Array.isArray(product.frames))throw Error('RUC-Parametervertrag ungültig.');
  const end=product.frames.length+start-1;if(end<2||end>27||horizon!==undefined&&end!==horizon)throw Error('RUC-Zeitabdeckung inkonsistent.');horizon=end;
  if(product.frames.some((f,i)=>f.hour!==i+start||Date.parse(f.time)!==stamp+f.hour*3600000||!/[Zz]|[+-]\d{2}:\d{2}$/.test(f.time)||f.file!==`${kind}-${String(f.hour).padStart(3,'0')}.bin`||!sha(f.sha256)||!Number.isInteger(f.bytes)||f.bytes<1||f.bytes>12000000||f.encoding!=='gzip-json'||!Number.isInteger(f.decodedBytes)||f.decodedBytes!<1||f.decodedBytes!>12000000||f.intervalHours!==start))throw Error('RUC-Kartenzeiten oder Dateivertrag ungültig.');
 }
 return index;
}
export async function loadRucNativeIndex(signal:AbortSignal){
 const response=await fetch(`/ruc/latest.json?mid_ruc_fields=${Date.now()}`,{signal,cache:'no-store'});if(!response.ok)throw Error('RUC-Katalog nicht verfügbar.');
 const meta=await response.json(),pointer=meta.rucModelFields;if(pointer===undefined)return null;
 if(meta.schema!=='mid.dwd.ruc.grid.v2'||meta.storageProfile!=='pages-lossless-v1'||typeof pointer.key!=='string'||!/^runs\/[a-zA-Z0-9_-]+\/ruc-model-fields\/index\.json$/.test(pointer.key)||!sha(pointer.sha256)||!Number.isInteger(pointer.bytes)||pointer.bytes<1||pointer.bytes>200000)throw Error('RUC-Kartenverweis ungültig.');
 const r=await fetch('/ruc/'+pointer.key,{signal});if(!r.ok)throw Error('RUC-Kartenindex nicht verfügbar.');const bytes=await r.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(bytes.byteLength!==pointer.bytes||digest!==pointer.sha256)throw Error('RUC-Kartenindex unvollständig oder Prüfsumme ungültig.');
 return {index:validateRucMapIndex(JSON.parse(new TextDecoder().decode(bytes)),meta.run),base:'/ruc/'+pointer.key.slice(0,-10)};
}
