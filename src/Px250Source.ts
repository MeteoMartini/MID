import {fetchWorkerJson,workerBaseCandidates} from './workerClient';

export type Px250Meta={available:boolean;product?:'hx'|'px250';productName?:string;coverage?:string;site?:string;siteName?:string;stationId?:string;radarLat?:number;radarLon?:number;distanceKm?:number;observedAt?:string;fileUrl?:string;nativeResolutionM?:number;rangeKm?:number;georeferencing?:'local-site'|'projected-national-fallback'|'projected-national'|'local-site-fallback';warning?:string;reason?:string;ageMinutes?:number;stale?:boolean;error?:string};

export async function loadPx250Metadata(lat:number,lon:number,signal?:AbortSignal):Promise<Px250Meta>{
 if(!workerBaseCandidates('radar').length)return{available:false,nativeResolutionM:250,reason:`Das 250-m-Radar ist über den aktuellen MID-Datendienst nicht verfügbar.`};
 try{return await fetchWorkerJson<Px250Meta>('px250-meta',{lat,lon},{purpose:'radar',timeoutMs:12000,signal})}
 catch(error){return{available:false,nativeResolutionM:250,reason:'Das 250-m-Radar ist derzeit nicht verfügbar.'}}
}
