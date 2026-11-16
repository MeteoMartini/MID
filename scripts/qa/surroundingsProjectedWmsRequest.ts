import type {WmsProvider} from '../../src/CompositeData';
import {planSurroundingsMercatorWms,type SurroundingsMercatorWmsPlan} from './surroundingsMercatorWmsPlan';

/** Unactivated request adapter for MID's allowlisted composite-wms Worker route.
 * Source-product time validity, original alpha and actual coverage must be
 * verified independently. A successful GetMap response is NOT a dry-weather
 * observation and does not certify a georeferenced pixel.
 */
export type SurroundingsProjectedWmsRequest = {
  url: string;
  requestKey: string;
  geographicBounds: SurroundingsMercatorWmsPlan['imageBounds'];
  version: '1.1.1'|'1.3.0';
  projectionParameter: 'srs'|'crs';
};

const REPLACED_WMS_PARAMS=new Set([
  'service','request','version','srs','crs','layers','styles','format',
  'transparent','bbox','width','height','time'
]);
const MIN_TIME=Date.UTC(2000,0,1);
const MAX_TIME=Date.UTC(2100,0,1);

/** WMS 1.1.1 DWD: SRS=x,y; WMS 1.3.0 EUMETSAT: CRS=x,y.
 * Unlike EPSG:4326 in WMS 1.3.0, EPSG:3857 keeps easting,northing
 * metre-axis ordering. Never mix a 4326 BBOX with a 3857 ImageSource.
 */
export function buildSurroundingsProjectedWmsRequest(
  proxyUrl:string|undefined,
  provider:WmsProvider,
  layer:string,
  time:number,
  plan:SurroundingsMercatorWmsPlan|undefined
):SurroundingsProjectedWmsRequest|undefined{
  if(!proxyUrl||!plan||!['dwd','eumetsat'].includes(provider)||
    !/^[a-zA-Z0-9_:.-]{1,160}$/.test(layer)||
    !Number.isFinite(time)||time<MIN_TIME||time>=MAX_TIME||
    plan.crs!=='EPSG:3857'||
    !Number.isInteger(plan.width)||!Number.isInteger(plan.height)||
    plan.width<16||plan.height<16||plan.width>512||plan.height>256||
    plan.width*plan.height>512*256)return undefined;
  const {west,south,east,north}=plan.imageBounds??{};
  if(![west,south,east,north].every(Number.isFinite)||
    west!>=east!||south!>=north!||west!< -180||east!>180||
    south!<=-85.0511287798066||north!>=85.0511287798066)return undefined;
  // The source image must represent EXACTLY the rectangle pinned onto the
  // MapLibre quad. Prevent plausible-but-wrong BBOX and corner combinations.
  // The quantization belongs to the planner alone (outward 1 mm rounding).
  const canonical=planSurroundingsMercatorWms(plan.imageBounds);
  if(!canonical||canonical.bbox!==plan.bbox||
    canonical.width!==plan.width||canonical.height!==plan.height)return undefined;
  const coordinates=plan.bbox.split(',');
  if(coordinates.length!==4||coordinates.some(value=>!/^[-]?\d+\.\d{3}$/.test(value)))return undefined;
  const [xMin,yMin,xMax,yMax]=coordinates.map(Number);
  if(![xMin,yMin,xMax,yMax].every(Number.isFinite)||xMin>=xMax||yMin>=yMax||
    Math.abs(xMin)>20037509||Math.abs(xMax)>20037509||
    Math.abs(yMin)>20037509||Math.abs(yMax)>20037509)return undefined;
  const ratio=(xMax-xMin)/(yMax-yMin);
  if(!Number.isFinite(ratio)||Math.abs(plan.width/plan.height/ratio-1)>.015)return undefined;
  let url:URL;
  try{url=new URL(proxyUrl)}catch{return undefined}
  if(!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))||
    url.username||url.password||url.searchParams.get('mode')!=='composite-wms'||
    url.searchParams.get('provider')!==provider)return undefined;
  // Scrub case-variant stale WMS parameters so a previous CRS cannot leak
  // through the Worker URL even if the caller supplied uppercase keys.
  for(const key of new Set(url.searchParams.keys())){
    if(REPLACED_WMS_PARAMS.has(key.toLowerCase()))url.searchParams.delete(key);
  }
  const version=provider==='dwd'?'1.1.1':'1.3.0';
  const projectionParameter=provider==='dwd'?'srs':'crs';
  const params={
    service:'WMS',request:'GetMap',version,layers:layer,styles:'',
    format:'image/png',transparent:'true',bbox:plan.bbox,
    width:String(plan.width),height:String(plan.height),time:new Date(time).toISOString()
  };
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  url.searchParams.set(projectionParameter,'EPSG:3857');
  const requestUrl=url.toString();
  return {url:requestUrl,requestKey:requestUrl,geographicBounds:plan.imageBounds,version,projectionParameter};
}
