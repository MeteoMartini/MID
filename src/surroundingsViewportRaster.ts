/** Strictly geometric WMS plan for a previously positioned MapLibre camera.
 * Read map.getBounds() AFTER its fitBounds/resize. Never infer the visible area
 * from the narrower original focus rectangle or the requested maxZoom.
 * The caller must fail closed on undefined; this does not grant source coverage.
 */
export type SurroundingsGeoBounds = {west:number;south:number;east:number;north:number};
export type SurroundingsMapSize = {width:number;height:number};
export type SurroundingsRasterPlan = {
 bounds:SurroundingsGeoBounds;
 bbox:string; // WMS 1.1.1, EPSG:4326: west,south,east,north
 width:number;
 height:number;
};
const MAX_MERCATOR_LAT=85.0511287798066;
const MAX_SOURCE_WIDTH=512;
const MAX_SOURCE_HEIGHT=256;
const MAX_PIXELS=MAX_SOURCE_WIDTH*MAX_SOURCE_HEIGHT;
const EPS=1_000_000;
const toRadians=(value:number)=>value*Math.PI/180;
const toDegrees=(value:number)=>value*180/Math.PI;
const projectLat=(lat:number)=>Math.log(Math.tan(Math.PI/4+toRadians(lat)/2));
const unprojectLat=(merc:number)=>toDegrees(2*Math.atan(Math.exp(merc))-Math.PI/2);
const floorOut=(value:number)=>Math.floor(value*EPS)/EPS;
const ceilOut=(value:number)=>Math.ceil(value*EPS)/EPS;
const finite=(values:number[])=>values.every(Number.isFinite);

/** Returns undefined rather than inventing cross-dateline/polar raster coverage.
 * Includes modest pixel overscan so MapLibre image edges never expose a strip
 * of only the basemap. The fixed pixel budget matches the existing 512×256 WMS.
 * Native radar, OPERA, and satellite products may still contain actual NoData.
 */
export function planSurroundingsViewportRaster(
 visible:SurroundingsGeoBounds,
 viewport:SurroundingsMapSize,
 overscanPixels=12
):SurroundingsRasterPlan|undefined {
 if(!visible||!viewport||!finite([visible.west,visible.south,visible.east,visible.north,viewport.width,viewport.height,overscanPixels]))return undefined;
 const {west,south,east,north}=visible;
 const {width,height}=viewport;
 if(west>=east||south>=north||west< -180||east>180||
    south<=-MAX_MERCATOR_LAT||north>=MAX_MERCATOR_LAT||
    width<64||width>4096||height<64||height>4096||
    overscanPixels<0||overscanPixels>32)return undefined;
 const latLow=projectLat(south),latHigh=projectLat(north);
 if(!finite([latLow,latHigh])||latHigh<=latLow)return undefined;
 const horizontal=(east-west)*overscanPixels/width;
 const vertical=(latHigh-latLow)*overscanPixels/height;
 const bounds:SurroundingsGeoBounds={
  west:floorOut(west-horizontal),
  east:ceilOut(east+horizontal),
  south:floorOut(unprojectLat(latLow-vertical)),
  north:ceilOut(unprojectLat(latHigh+vertical))
 };
 if(!finite([bounds.west,bounds.south,bounds.east,bounds.north])||
   bounds.west< -180||bounds.east>180||
   bounds.south<=-MAX_MERCATOR_LAT||bounds.north>=MAX_MERCATOR_LAT||
   bounds.west>=bounds.east||bounds.south>=bounds.north)return undefined;
 // WMS 1.1.1 / EPSG:4326 image pixels live in longitude/latitude degrees,
 // NOT WebMercator pixels. Match the BBOX degree aspect instead of CSS aspect.
 const degreeAspect=(bounds.east-bounds.west)/(bounds.north-bounds.south);
 if(!Number.isFinite(degreeAspect)||degreeAspect<=0)return undefined;
 const rasterScale=Math.min(MAX_SOURCE_WIDTH/degreeAspect,MAX_SOURCE_HEIGHT);
 const rasterHeight=Math.floor(rasterScale);
 const rasterWidth=Math.floor(rasterScale*degreeAspect);
 if(rasterWidth<16||rasterHeight<16||rasterWidth>MAX_SOURCE_WIDTH||
   rasterHeight>MAX_SOURCE_HEIGHT||rasterWidth*rasterHeight>MAX_PIXELS)return undefined;
 return {
  bounds,bbox:[bounds.west,bounds.south,bounds.east,bounds.north].join(','),
  width:rasterWidth,height:rasterHeight
 };
}
