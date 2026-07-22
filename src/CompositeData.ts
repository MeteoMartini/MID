import {buildWorkerUrl,configuredWorkerBase,fetchWorkerJson} from './workerClient';
export type CompositeSource='dwd'|'opera'|'rainviewer'|'model';
export type OperaGridPoint={lat:number;lon:number;rate:number;observedAt?:string};
export type OperaGridFrame={time:string;points:OperaGridPoint[]};
export type OperaGrid={points:OperaGridPoint[];frames?:OperaGridFrame[];provider?:string;observedAt?:string;spacingKm?:number;nativeResolutionKm?:number;temporalResolutionMinutes?:number;error?:string};
export type LightningPoint={id:string;lat:number;lon:number;observedAt?:string;count?:number;intensity?:number;pulseType?:string;accuracyKm?:number};
export type LightningPointResponse={points:LightningPoint[];provider?:string;observedAt?:string;coverage?:string;fallback?:'mtg-li'|'none';nativeResolutionKm?:number;historyMinutes?:number;commercial?:boolean;enterprise?:boolean;reason?:string;error?:string};
export type WmsProvider='dwd'|'eumetsat';
export type ProductTime=string|number;
export type CompositeProduct={provider:WmsProvider;layer:string;label:string;resolutionKm?:number;times:ProductTime[];fresh?:boolean;fallback?:boolean;latestOnly?:boolean;latestTime?:ProductTime};
export type RainViewerFrame={time:number;path:string};
export type RainViewerResponse={host:string;generated?:number;radar:{past:RainViewerFrame[];nowcast?:RainViewerFrame[]};error?:string};
export type ContourPath=[number,number][];
export type ContourLevel={level:number;paths:ContourPath[]};
export type PressureCenter={type:'H'|'T';lat:number;lon:number;value:number;prominence?:number};
export type ModelContourFrame={time:string;isobarStep?:number;isoheightStepGpdm?:number;isobars:ContourLevel[];isoheights:ContourLevel[];centers?:PressureCenter[]};
export type ModelContourResponse={frames:ModelContourFrame[];provider?:string;model?:string;resolutionNote?:string;fallback?:{from?:string;to?:string;reason?:string};grid?:{rows:number;cols:number;latSpan:number;lonSpan:number;scope?:string;bounds?:{south:number;north:number;west:number;east:number}};contours?:{isobars?:string;isoheights?:string};checkedAt?:string;error?:string};
export type CompositeProductTimes={
 satelliteDay:ProductTime[];
 satelliteIr:ProductTime[];
 satellitePrecip:ProductTime[];
 mtgLightning:ProductTime[];
 dwdLightning:ProductTime[];
 dwdRadar?:ProductTime[];
 dwdRadarLayer?:string;
 satelliteDayProduct?:CompositeProduct;
 satelliteIrProduct?:CompositeProduct;
 satellitePrecipProduct?:CompositeProduct;
 checkedAt?:string;
 serverTime?:string;
 errors?:string[];
 error?:string;
};

export function configuredDataProxy(){return configuredWorkerBase('radar')}
export function compositeWmsProxy(provider:WmsProvider){
 const configured=configuredDataProxy();
 if(!configured)return'';
 return buildWorkerUrl(configured,'composite-wms',{provider}).toString();
}
export async function loadOperaGrid(lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<OperaGrid>('opera-grid',{lat,lon},{purpose:'radar',signal,timeoutMs:11000})}
export async function loadLightningPoints(lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<LightningPointResponse>('lightning-points',{lat,lon},{purpose:'radar',signal,timeoutMs:10000})}
export async function loadCompositeTimes(lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<CompositeProductTimes>('composite-times',{lat,lon},{purpose:'radar',signal,timeoutMs:10000})}
export async function loadRainViewer(lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<RainViewerResponse>('rainviewer-meta',{lat,lon},{purpose:'radar',signal,timeoutMs:9000})}
export async function loadModelContours(lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<ModelContourResponse>('model-contours',{lat,lon},{purpose:'radar',signal,timeoutMs:15000})}
