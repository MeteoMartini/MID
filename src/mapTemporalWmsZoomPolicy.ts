/** MapLibre-native WMS raster zoom policy.
 *
 * Explicit UTC source-original TIME frames (radar observations, approved
 * nowcasts and time-addressed satellite observations) must keep the same
 * source/cache URL across zoom changes. MapLibre's own raster source requests
 * whatever new XYZ tiles the new viewport requires. Do not unmount that
 * source merely to make a browser request for the same original TIME again.
 *
 * Mutable untimed "latest" snapshots, invalid timestamps and model/warning
 * overlays are intentionally NOT granted this special retention policy.
 * This changes only zoom lifecycle, never source validity/NoData/phase.
 */
export type TemporalWmsZoomPolicy={
 retainDuringZoom:boolean;
 revision:number;
};
const ORIGINAL_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export function mapTemporalWmsZoomPolicy(
 originalTimeIso:string|undefined,
 latestOnly:boolean,
 zoomRevision:number,
):TemporalWmsZoomPolicy{
 const safeRevision=Number.isSafeInteger(zoomRevision)&&zoomRevision>=0?zoomRevision:0;
 const parsed=originalTimeIso&&ORIGINAL_UTC.test(originalTimeIso)?Date.parse(originalTimeIso):NaN;
 // Date.parse can normalize impossible calendar dates. A retained raster must
 // carry an exact published UTC time, never a silently normalized date.
 const canonical=Number.isFinite(parsed)?new Date(parsed).toISOString():'';
 if(latestOnly||!originalTimeIso||!Number.isFinite(parsed)||
    (canonical!==originalTimeIso&&canonical.replace('.000Z','Z')!==originalTimeIso)){
  return{retainDuringZoom:false,revision:safeRevision};
 }
 return{retainDuringZoom:true,revision:0};
}
