export type CompositeSource='dwd'|'opera'|'rainviewer'|'model';
export type OperaGridPoint={lat:number;lon:number;rate:number;observedAt?:string};
export type OperaGridFrame={time:string;points:OperaGridPoint[]};
export type OperaGrid={points:OperaGridPoint[];frames?:OperaGridFrame[];provider?:string;observedAt?:string;spacingKm?:number;nativeResolutionKm?:number;temporalResolutionMinutes?:number;error?:string};
export type LightningPoint={id:string;lat:number;lon:number;observedAt?:string;count?:number;intensity?:number;pulseType?:string;accuracyKm?:number};
export type LightningPointResponse={points:LightningPoint[];provider?:string;observedAt?:string;coverage?:string;fallback?:'mtg-li'|'none';nativeResolutionKm?:number;historyMinutes?:number;commercial?:boolean;enterprise?:boolean;reason?:string;error?:string};
export type CompositeProductTimes={satelliteDay:string[];satelliteIr:string[];mtgLightning:string[];dwdLightning:string[];checkedAt?:string;errors?:string[];error?:string};

export function configuredDataProxy(){
 const env=(import.meta as any).env??{};
 return String(env.VITE_RADAR_PROXY_URL||env.VITE_METAR_PROXY_URL||localStorage.getItem('radarProxyUrl')||localStorage.getItem('metarProxyUrl')||'').trim();
}
function endpoint(mode:string,lat:number,lon:number){
 const configured=configuredDataProxy();
 if(!configured)throw new Error('Cloudflare Worker v0.7.23 ist nicht konfiguriert.');
 const url=new URL(configured,location.href);url.searchParams.set('mode',mode);url.searchParams.set('lat',String(lat));url.searchParams.set('lon',String(lon));return url;
}
async function getJson<T extends {error?:string}>(url:URL,signal?:AbortSignal):Promise<T>{
 const response=await fetch(url.toString(),{signal,cache:'no-store'}),data=await response.json().catch(()=>({})) as T;
 if(!response.ok||data.error)throw new Error(data.error||`Worker HTTP ${response.status}`);return data;
}
export async function loadOperaGrid(lat:number,lon:number,signal?:AbortSignal){return getJson<OperaGrid>(endpoint('opera-grid',lat,lon),signal)}
export async function loadLightningPoints(lat:number,lon:number,signal?:AbortSignal){return getJson<LightningPointResponse>(endpoint('lightning-points',lat,lon),signal)}
export async function loadCompositeTimes(lat:number,lon:number,signal?:AbortSignal){return getJson<CompositeProductTimes>(endpoint('composite-times',lat,lon),signal)}
