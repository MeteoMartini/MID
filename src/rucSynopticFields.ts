import type {SynopticModel} from './nativeSynopticFields';
import {modelInstant} from './modelForecastTime';
export function validateRucSynopticIndex(d:any):SynopticModel{
 const m=d?.model,stamp=modelInstant(d?.run),frames=m?.frames;
 if(d?.schema!=='mid.ruc.synoptic-fields.v1'||d.modelId!=='icon-d2-ruc'||d.sampling!=='nearest-native-cell'||!Number.isFinite(d.maxNearestKm)||d.maxNearestKm<=0||d.maxNearestKm>5||!Number.isFinite(stamp)||stamp>Date.now()+3600000||Date.now()-stamp>4*3600000||m?.run!==d.run||m.resolutionKm!==2.2||m.license!=='CC BY 4.0'||!Array.isArray(frames)||frames.length!==28||frames.some((f:any,h:number)=>f.hour!==h||modelInstant(f.time)!==stamp+h*3600000||f.file!==`icon-d2-ruc-${String(h).padStart(3,'0')}.bin`||f.cloudWeather!==true||f.encoding!=='gzip-json'||!Number.isInteger(f.bytes)||f.bytes<1||f.bytes>12000000||!Number.isInteger(f.decodedBytes)||f.decodedBytes<1||f.decodedBytes>12000000||!/^[a-f0-9]{64}$/.test(f.sha256)))throw Error('RUC-Synoptik: vollständiger Lauf, Zeitachse oder Prüfsummen ungültig.');
 return {...m,label:'DWD ICON-D2-RUC'};
}
export async function loadRucSynopticIndex(signal:AbortSignal){
 const r=await fetch(`/ruc/latest.json?mid_ruc_synoptic=${Date.now()}`,{signal,cache:'no-store'});if(!r.ok)throw Error('RUC-Synoptik-Katalog nicht erreichbar.');
 const meta=await r.json(),ref=meta.rucSynopticFields;
 if(meta.schema!=='mid.dwd.ruc.grid.v2'||!/^runs\/[a-zA-Z0-9_-]+__ruc_synoptic_[a-f0-9]{16}\/ruc-synoptic-fields\/index.json$/.test(ref?.key??'')||!/^[a-f0-9]{64}$/.test(ref?.sha256??'')||!Number.isInteger(ref?.bytes)||ref.bytes<1||ref.bytes>400000)throw Error('RUC-Synoptik noch nicht vollständig veröffentlicht.');
 const response=await fetch('/ruc/'+ref.key,{signal});if(!response.ok)throw Error('RUC-Synoptik-Index nicht erreichbar.');
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==ref.bytes)throw Error('RUC-Synoptik-Indexgröße ungültig.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==ref.sha256||!ref.key.includes('__ruc_synoptic_'+hash.slice(0,16)+'/'))throw Error('RUC-Synoptik-Indexprüfsumme ungültig.');
 const d=JSON.parse(new TextDecoder().decode(bytes)),m=validateRucSynopticIndex(d);
 if(modelInstant(m.run)!==modelInstant(meta.run))throw Error('RUC-Synoptik und Kern haben verschiedene Läufe.');
 return {...m,base:'/ruc/'+ref.key.slice(0,-10)};
}
