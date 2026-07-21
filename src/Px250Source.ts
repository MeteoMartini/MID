import {configuredDataProxy} from './CompositeData';
import {MID_VERSION} from './version';

export type Px250Meta={available:boolean;product?:'hx'|'px250';productName?:string;coverage?:string;site?:string;siteName?:string;stationId?:string;radarLat?:number;radarLon?:number;distanceKm?:number;observedAt?:string;fileUrl?:string;nativeResolutionM?:number;rangeKm?:number;reason?:string;ageMinutes?:number;stale?:boolean};

export async function loadPx250Metadata(lat:number,lon:number):Promise<Px250Meta>{
 const configured=configuredDataProxy();
 if(!configured)return{available:false,nativeResolutionM:250,reason:`Das 250-m-Radar benötigt den Cloudflare Worker v${MID_VERSION}; ein direkter Browserabruf beim DWD ist wegen CORS nicht zuverlässig möglich.`};
 try{
  const url=new URL(configured,location.href);url.searchParams.set('mode','px250-meta');url.searchParams.set('lat',String(lat));url.searchParams.set('lon',String(lon));url.searchParams.set('_mid',MID_VERSION);
  const response=await fetch(url.toString(),{cache:'no-store'}),data=await response.json().catch(()=>({})) as Px250Meta&{error?:string};
  if(!response.ok||data.error)throw new Error(data.error||`Worker HTTP ${response.status}`);
  return data;
 }catch(error){return{available:false,nativeResolutionM:250,reason:`Das 250-m-Radar konnte über den Worker nicht geprüft werden: ${error instanceof Error?error.message:String(error)}`}}
}
