/** Strict boundary for an official GeoSphere snow-depth observation. Missing is never zero. */
export type GeoSphereSnowResponse={available?:boolean;valueCm?:number|null;stationName?:string;stationId?:string;stationElevation?:number|null;distanceKm?:number|null;heightDifferenceM?:number|null;observedAt?:string;provider?:string};
export type ValidatedMountainSnowObservation={valueCm:number;stationName:string;stationId?:string;stationElevation?:number;distanceKm:number;heightDifferenceM:number;observedAt:string;provider:string};
const finiteNumber=(value:unknown):number|undefined=>typeof value==='number'&&Number.isFinite(value)?value:undefined;

export function validatedGeoSphereSnowMeasurement(raw:unknown,targetElevation:number,nowMs=Date.now()):ValidatedMountainSnowObservation|undefined{
 if(!raw||typeof raw!=='object'||!Number.isFinite(targetElevation)||!Number.isFinite(nowMs))return undefined;
 const response=raw as GeoSphereSnowResponse;
 if(response.available!==true)return undefined;
 const value=finiteNumber(response.valueCm),distanceKm=finiteNumber(response.distanceKm),heightDifferenceM=finiteNumber(response.heightDifferenceM),stationElevation=finiteNumber(response.stationElevation);
 if(value===undefined||value<0||value>1000||distanceKm===undefined||distanceKm<0||distanceKm>25||heightDifferenceM===undefined||Math.abs(heightDifferenceM)>350||stationElevation===undefined||stationElevation< -500||stationElevation>9000)return undefined;
 if(Math.abs(stationElevation-targetElevation-heightDifferenceM)>2)return undefined;
 const observedAt=typeof response.observedAt==='string'?response.observedAt:'';
 const observedMs=Date.parse(observedAt),ageMs=nowMs-observedMs;
 if(!Number.isFinite(observedMs)||ageMs< -15*60_000||ageMs>3*60*60_000)return undefined;
 const stationId=typeof response.stationId==='string'?response.stationId.trim():'';
 if(!stationId)return undefined;
 return {valueCm:value,stationName:typeof response.stationName==='string'&&response.stationName.trim()?response.stationName:'GeoSphere-Schneestation',stationId,stationElevation,distanceKm,heightDifferenceM,observedAt,provider:typeof response.provider==='string'&&response.provider.trim()?response.provider:'GeoSphere Austria'};
}
