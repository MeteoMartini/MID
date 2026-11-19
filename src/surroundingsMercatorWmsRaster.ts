import type {SurroundingsRasterPlan} from './surroundingsViewportRaster';

/** WMS 1.1.1, EPSG:3857 native source pixels for DWD RV only.
 *
 * The DWD original layer Radar_rv_product_1x1km_ger advertises EPSG:3857
 * BoundingBox and returns PNG GetMap at that SRS. A WMS 1.1.1 EPSG:4326
 * image encodes y in linear latitude and cannot be stretched over a Mercator
 * MapLibre ImageSource without moving interior observations.
 *
 * This pure planner neither proves meteorological validity nor grants SRS
 * support to any other DWD/EUMETSAT layer. Fails closed near seams/poles.
 */
export type SurroundingsMercatorWmsRaster={
 bbox:string; // min projected x, min projected y, max x, max y (metres)
 srs:'EPSG:3857';
 width:number;
 height:number;
};
const R=6378137; // Web Mercator spherical Earth radius, metres.
const MAX_LAT=85.0511287798066;
const MAX_W=512;
const MAX_H=256;
const MAX_PIXELS=MAX_W*MAX_H;
const rad=(x:number)=>x*Math.PI/180;
const finite=(x:number[])=>x.every(Number.isFinite);
const xMeters=(lon:number)=>R*rad(lon);
const yMeters=(lat:number)=>R*Math.log(Math.tan(Math.PI/4+rad(lat)/2));

/** Reuse the SAME post-fit geographic corners as ImageQuad/OPERA; request the
 * provider to do the actual 3857 re-projection, rather than a client-side
 * Canvas resample or four-corner fake correction.
 */
export function planSurroundingsMercatorWmsRaster(
 plan:SurroundingsRasterPlan|undefined
):SurroundingsMercatorWmsRaster|undefined{
 if(!plan)return undefined;
 const b=plan.bounds;
 if(!b||!finite([b.west,b.south,b.east,b.north])||
    !(b.west<b.east&&b.south<b.north)||
    b.west< -180||b.east>180||
    b.south<=-MAX_LAT||b.north>=MAX_LAT)return undefined;
 const coords=[xMeters(b.west),yMeters(b.south),xMeters(b.east),yMeters(b.north)];
 if(!finite(coords))return undefined;
 // Expand outward by <=1 mm; no clipped pixel-edge coverage.
 const [west,south,east,north]=[
  Math.floor(coords[0]*1000)/1000,
  Math.floor(coords[1]*1000)/1000,
  Math.ceil(coords[2]*1000)/1000,
  Math.ceil(coords[3]*1000)/1000
 ];
 const ratio=(east-west)/(north-south);
 if(!finite([west,south,east,north,ratio])||ratio<=0)return undefined;
 const scale=Math.min(MAX_W/ratio,MAX_H);
 const height=Math.floor(scale),width=Math.floor(scale*ratio);
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<16||height<16||width>MAX_W||height>MAX_H||
    width*height>MAX_PIXELS)return undefined;
 return {bbox:[west,south,east,north].join(','),srs:'EPSG:3857',width,height};
}
