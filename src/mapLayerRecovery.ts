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
