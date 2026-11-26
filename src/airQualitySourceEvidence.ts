export const AIR_QUALITY_SOURCE_SCHEMA=2 as const;
export const AQI_SOURCE_FIELDS=[['pm2_5','PM2,5'],['pm10','PM10'],['nitrogen_dioxide','NO₂'],['ozone','O₃'],['sulphur_dioxide','SO₂']] as const;
export type AqiSourceKey=typeof AQI_SOURCE_FIELDS[number][0];
type JsonRecord=Record<string,unknown>;
const record=(value:unknown):JsonRecord|undefined=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as JsonRecord:undefined;
const label=(value:unknown):string|undefined=>typeof value==='string'&&value.trim()?value.trim().slice(0,200):undefined;
export function nonnegativeAqiNumber(value:unknown):number|null{
 if(typeof value!=='number'&&(typeof value!=='string'||!/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*$/.test(value)))return null;
 const number=Number(value);return Number.isFinite(number)&&number>=0?number:null;
}
export type AirQualityObservationEvidence={available:true;observation:true;provider:string;preliminary:boolean;observedAt:string;stationName?:string;attribution?:string;current:Partial<Record<AqiSourceKey,number>>};
// Preserve the model payload, never reconstruct a station aggregate from CAMS fields.
export function airQualityObservationEvidence(raw:unknown,now=Date.now()):AirQualityObservationEvidence|undefined{
 const input=record(raw),values=record(input?.current),time=input?.observedAt;
 if(input?.available!==true||input.observation!==true||!values||typeof time!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(time))return undefined;
 const wallEpoch=Date.parse(time.slice(0,19)+'Z');
 if(!Number.isFinite(wallEpoch)||new Date(wallEpoch).toISOString().slice(0,19)!==time.slice(0,19))return undefined;
 const epoch=Date.parse(time),age=now-epoch;
 if(!Number.isFinite(age)||age< -20*60000||age>180*60000)return undefined;
 const current:AirQualityObservationEvidence['current']={};
 for(const [key] of AQI_SOURCE_FIELDS){const value=nonnegativeAqiNumber(values[key]);if(value!==null)current[key]=value}
 if(!Object.keys(current).length)return undefined;
 return{available:true,observation:true,provider:label(input.provider)??'UBA-Adapter',preliminary:input.preliminary===true,observedAt:new Date(epoch).toISOString(),stationName:label(record(input.station)?.name)??label(input.stationName),attribution:label(input.attribution),current};
}
// Older blended caches cannot be demixed; admit only a model-only legacy payload.
export function airQualityModelCurrent(payload:unknown):JsonRecord|undefined{
 const input=record(payload);if(!input)return undefined;
 if(input._mid_air_quality_source_schema!==AIR_QUALITY_SOURCE_SCHEMA&&record(input._mid_air_quality)?.observation===true)return undefined;
 return record(input.current);
}
export function airQualityModelTimeLabel(payload:unknown):string|undefined{
 const input=record(payload),time=airQualityModelCurrent(input)?.time,offset=input?.utc_offset_seconds;
 if(typeof time!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(time)||typeof offset!=='number'||!Number.isInteger(offset)||Math.abs(offset)>14*3600||offset%60!==0)return undefined;
 const epoch=Date.parse(time+'Z');if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,16)!==time.slice(0,16))return undefined;
 const absolute=Math.abs(offset),hours=String(Math.floor(absolute/3600)).padStart(2,'0'),minutes=String(absolute%3600/60).padStart(2,'0');
 return `${time.replace('T',' ')} · UTC${offset<0?'-':'+'}${hours}:${minutes}`;
}
