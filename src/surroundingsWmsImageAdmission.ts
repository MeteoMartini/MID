import type {SurroundingsRasterPlan} from './surroundingsViewportRaster';

/**
 * Only checks that the browser decoded an image of the exact dimensions
 * requested from WMS. Neither opacity nor successful decoding establishes
 * meteorological source coverage, a valid precipitation value, or dry weather.
 *
 * A WMS exception, an unsupported response, or an unexpected raster shape
 * is not admitted. Never sample alpha (a transparency/presentation property)
 * as a meteorological validity mask.
 */
export type SurroundingsWmsDecodedEvidence={
 kind:'decoded-wms-image';
 width:number;
 height:number;
 meteorologicalCoverage:null;
 precipitationRate:null;
 sourceValidity:'unverified';
};

const MAX_WMS_WIDTH=512;
const MAX_WMS_HEIGHT=256;
const MAX_WMS_PIXELS=MAX_WMS_WIDTH*MAX_WMS_HEIGHT;

export function admitSurroundingsWmsDecodedImage(
 plan:Pick<SurroundingsRasterPlan,'width'|'height'>|undefined,
 actualWidth:number,
 actualHeight:number
):SurroundingsWmsDecodedEvidence|undefined{
 if(!plan)return undefined;
 const {width,height}=plan;
 if(![width,height,actualWidth,actualHeight].every(Number.isSafeInteger)||
    width<16||width>MAX_WMS_WIDTH||height<16||height>MAX_WMS_HEIGHT||
    width*height>MAX_WMS_PIXELS||
    actualWidth!==width||actualHeight!==height)return undefined;
 return {
  kind:'decoded-wms-image',width,height,
  meteorologicalCoverage:null,precipitationRate:null,
  sourceValidity:'unverified'
 };
}
