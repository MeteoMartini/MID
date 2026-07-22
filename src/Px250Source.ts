import {MID_VERSION} from './version';
import {fetchWorkerJson,workerBaseCandidates} from './workerClient';

export type Px250Meta={available:boolean;product?:'hx'|'px250';productName?:string;coverage?:string;site?:string;siteName?:string;stationId?:string;radarLat?:number;radarLon?:number;distanceKm?:number;observedAt?:string;fileUrl?:string;nativeResolutionM?:number;rangeKm?:number;reason?:string;ageMinutes?:number;stale?:boolean;error?:string};

export async function loadPx250Metadata(lat:number,lon:number):Promise<Px250Meta>{
 if(!workerBaseCandidates('radar').length)return{available:false,nativeResolutionM:250,reason:`Das 250-m-Radar benötigt den Cloudflare Worker v${MID_VERSION}; ein direkter Browserabruf beim DWD ist wegen CORS nicht zuverlässig möglich.`};
 try{return await fetchWorkerJson<Px250Meta>('px250-meta',{lat,lon},{purpose:'radar',timeoutMs:12000})}
 catch(error){return{available:false,nativeResolutionM:250,reason:`Das 250-m-Radar konnte über keinen Worker-Endpunkt geprüft werden: ${error instanceof Error?error.message:String(error)}`}}
}
