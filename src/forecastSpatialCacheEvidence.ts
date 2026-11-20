/** Pure, bounded location provenance for cached primary weather; never infers exactness from a rounded storage key. */
export type ForecastSpatialPoint={lat:number;lon:number};
export type ForecastSpatialEvidence={spatialMatch:'exact'|'nearby'|'unknown';spatialFallbackDistanceM?:number};
const valid=(p:unknown):p is ForecastSpatialPoint=>Boolean(p&&typeof p==='object'&&typeof (p as ForecastSpatialPoint).lat==='number'&&typeof (p as ForecastSpatialPoint).lon==='number'&&Number.isFinite((p as ForecastSpatialPoint).lat)&&Number.isFinite((p as ForecastSpatialPoint).lon)&&Math.abs((p as ForecastSpatialPoint).lat)<=90&&Math.abs((p as ForecastSpatialPoint).lon)<=180);
export function forecastSpatialDistanceM(a:ForecastSpatialPoint,b:ForecastSpatialPoint){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,latA=a.lat*rad,latB=b.lat*rad,x=Math.sin(dlat/2)**2+Math.cos(latA)*Math.cos(latB)*Math.sin(dlon/2)**2;return 12742000*Math.atan2(Math.sqrt(Math.max(0,x)),Math.sqrt(Math.max(0,1-x)))}
/** Legacy v5 entries without an original location remain unknown, even for an exact-looking key. */
export function classifyForecastSpatialCache(request:ForecastSpatialPoint,origin:ForecastSpatialPoint|undefined,bucket:ForecastSpatialPoint,maximumMeters=2500):ForecastSpatialEvidence|null{
 if(!valid(request)||!valid(bucket)||!Number.isFinite(maximumMeters)||maximumMeters<=0)return null;
 if(origin===undefined)return forecastSpatialDistanceM(request,bucket)<=maximumMeters?{spatialMatch:'unknown'}:null;
 if(!valid(origin)||forecastSpatialDistanceM(origin,bucket)>100)return null; // v5 0.001-degree rounded key tolerance
 const meters=forecastSpatialDistanceM(request,origin);
 if(meters>maximumMeters)return null;
 return meters<=5?{spatialMatch:'exact'}:{spatialMatch:'nearby',spatialFallbackDistanceM:Math.ceil(meters)};
}
