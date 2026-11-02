/** Transport-only recovery for MID observation maps. Never changes WMS TIME, data or masks. */
export const RASTER_TILE_MAX_RETRIES=3;
export const COMPOSITE_METADATA_MAX_RETRIES=4;
export function rasterTileRetryDelayMs(failedAttempts:number):number|null{
 if(!Number.isInteger(failedAttempts)||failedAttempts<0||failedAttempts>=RASTER_TILE_MAX_RETRIES)return null;
 return Math.min(12_000,1500*2**failedAttempts);
}
export function compositeMetadataRetryDelayMs(failedAttempts:number):number|null{
 if(!Number.isInteger(failedAttempts)||failedAttempts<0||failedAttempts>=COMPOSITE_METADATA_MAX_RETRIES)return null;
 return Math.min(60_000,10_000*2**failedAttempts);
}
export function shouldRefreshMapMetadataOnResume(nowMs:number,lastSuccessfulLoadMs:number,visible:boolean):boolean{
 return visible&&Number.isFinite(nowMs)&&Number.isFinite(lastSuccessfulLoadMs)
  &&nowMs-lastSuccessfulLoadMs>=30_000;
}

/** A server can return 200 with an explicit error and no satellite/radar times.
 * Do not replace a known-good catalog by such a failed response.
 * A genuinely empty but error-free catalog is still a valid empty response. */
export function isCompositeTimesFailureWithoutFrames(data:{
 error?:string;errors?:string[];satelliteDay?:unknown[];satelliteIr?:unknown[];satellitePrecip?:unknown[];
 dwdRadar?:unknown[];dwdLightning?:unknown[];mtgLightning?:unknown[];
 satelliteDayProduct?:{times?:unknown[];latestOnly?:boolean;latestTime?:string|number};
 satelliteIrProduct?:{times?:unknown[];latestOnly?:boolean;latestTime?:string|number};
 satellitePrecipProduct?:{times?:unknown[];latestOnly?:boolean;latestTime?:string|number};
 dwdReferenceSatelliteProduct?:{times?:unknown[];latestOnly?:boolean;latestTime?:string}
}|null|undefined):boolean{
 if(!data)return true;
 if(!data.error&&!data.errors?.length)return false;
 const lists=[data.satelliteDay,data.satelliteIr,data.satellitePrecip,data.dwdRadar,
  data.dwdLightning,data.mtgLightning,data.satelliteDayProduct?.times,
  data.satelliteIrProduct?.times,data.satellitePrecipProduct?.times];
 const latestOnly=[data.satelliteDayProduct,data.satelliteIrProduct,
  data.satellitePrecipProduct,data.dwdReferenceSatelliteProduct].some(product=>{
   if(product?.latestOnly!==true)return false;
   const stamp=product.latestTime;
   if(typeof stamp==='string')return Number.isFinite(Date.parse(stamp));
   if(typeof stamp!=='number'||!Number.isFinite(stamp))return false;
   // CompositeProduct.latestTime accepts epoch seconds or epoch milliseconds.
   const ms=Math.abs(stamp)<1e12?stamp*1000:stamp;
   return ms>=Date.UTC(2000,0,1)&&ms<Date.UTC(2100,0,1);
  });
 return !latestOnly&&!lists.some(values=>Array.isArray(values)&&values.length>0);
}
