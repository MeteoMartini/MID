import {MID_VERSION} from './version';
export type CompositeSource='dwd'|'opera'|'rainviewer'|'model';
export type OperaGridPoint={lat:number;lon:number;rate:number;observedAt?:string};
export type OperaGridFrame={time:string;points:OperaGridPoint[]};
export type OperaGrid={points:OperaGridPoint[];frames?:OperaGridFrame[];provider?:string;observedAt?:string;spacingKm?:number;nativeResolutionKm?:number;temporalResolutionMinutes?:number;error?:string};
export type LightningPoint={id:string;lat:number;lon:number;observedAt?:string;count?:number;intensity?:number;pulseType?:string;accuracyKm?:number};
export type LightningPointResponse={points:LightningPoint[];provider?:string;observedAt?:string;coverage?:string;fallback?:'mtg-li'|'none';nativeResolutionKm?:number;historyMinutes?:number;commercial?:boolean;enterprise?:boolean;reason?:string;error?:string};
export type WmsProvider='dwd'|'eumetsat';
export type ProductTime=string|number;
export type CompositeProduct={provider:WmsProvider;layer:string;label:string;resolutionKm?:number;times:ProductTime[];fresh?:boolean;fallback?:boolean;latestOnly?:boolean};
export type RainViewerFrame={time:number;path:string};
export type RainViewerResponse={host:string;generated?:number;radar:{past:RainViewerFrame[];nowcast?:RainViewerFrame[]};error?:string};
export type ContourPath=[number,number][];
export type ContourLevel={level:number;paths:ContourPath[]};
export type ModelContourFrame={time:string;isobarStep?:number;isoheightStepGpdm?:number;isobars:ContourLevel[];isoheights:ContourLevel[]};
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

export function configuredDataProxy(){
 const env=(import.meta as any).env??{};
 return String(env.VITE_RADAR_PROXY_URL||env.VITE_METAR_PROXY_URL||localStorage.getItem('radarProxyUrl')||localStorage.getItem('metarProxyUrl')||'').trim();
}
function endpoint(mode:string,lat:number,lon:number){
 const configured=configuredDataProxy();
 if(!configured)throw new Error(`Cloudflare Worker v${MID_VERSION} ist nicht konfiguriert.`);
 const url=new URL(configured,location.href);
 url.searchParams.set('mode',mode);
 url.searchParams.set('lat',String(lat));
 url.searchParams.set('lon',String(lon));
 url.searchParams.set('_mid',MID_VERSION);
 return url;
}
export function compositeWmsProxy(provider:WmsProvider){
 const configured=configuredDataProxy();
 if(!configured)return'';
 const url=new URL(configured,location.href);
 url.searchParams.set('mode','composite-wms');
 url.searchParams.set('provider',provider);
 url.searchParams.set('_mid',MID_VERSION);
 return url.toString();
}
async function getJson<T extends {error?:string}>(url:URL,signal?:AbortSignal):Promise<T>{
 const response=await fetch(url.toString(),{signal,cache:'no-store'}),data=await response.json().catch(()=>({})) as T;
 if(!response.ok||data.error)throw new Error(data.error||`Worker HTTP ${response.status}`);
 return data;
}
export async function loadOperaGrid(lat:number,lon:number,signal?:AbortSignal){return getJson<OperaGrid>(endpoint('opera-grid',lat,lon),signal)}
export async function loadLightningPoints(lat:number,lon:number,signal?:AbortSignal){return getJson<LightningPointResponse>(endpoint('lightning-points',lat,lon),signal)}
export async function loadCompositeTimes(lat:number,lon:number,signal?:AbortSignal){return getJson<CompositeProductTimes>(endpoint('composite-times',lat,lon),signal)}
export async function loadRainViewer(lat:number,lon:number,signal?:AbortSignal){return getJson<RainViewerResponse>(endpoint('rainviewer-meta',lat,lon),signal)}
export async function loadModelContours(lat:number,lon:number,signal?:AbortSignal){return getJson<ModelContourResponse>(endpoint('model-contours',lat,lon),signal)}
