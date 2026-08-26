import {buildExtremeOutlookContours,type ExtremeAreaContour} from './extremeOutlookAreaCanvas';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityBand,extremeProbabilityLevelsForCell,extremeSignalForCell,extremeSignalVisible,type ExtremeHazardId,type ExtremeOutlookCell,type ExtremeWeatherOutlook,type ResolvedExtremeSignal} from './extremeWeatherOutlook';

export type ExtremeModelledArea={
 id:string;
 latitude:number;
 longitude:number;
 intensity:ExtremeAreaContour['intensity'];
 probability:number;
 region:string;
 cell:ExtremeOutlookCell;
 signal:ResolvedExtremeSignal;
 contour:ExtremeAreaContour;
};

export type ExtremeOutlookContourSet={contours:ExtremeAreaContour[];hatchContours:ExtremeAreaContour[];areas:ExtremeModelledArea[]};

function ringArea(ring:ExtremeAreaContour['rings'][number]){let area=0;for(let index=0;index<ring.length;index++){const point=ring[index],next=ring[(index+1)%ring.length];area+=point.lon*next.lat-next.lon*point.lat}return area/2}
function ringCenter(ring:ExtremeAreaContour['rings'][number]){const area=ringArea(ring);if(Math.abs(area)<1e-9){const count=Math.max(1,ring.length);return{lon:ring.reduce((sum,point)=>sum+point.lon,0)/count,lat:ring.reduce((sum,point)=>sum+point.lat,0)/count}}let lon=0,lat=0;for(let index=0;index<ring.length;index++){const point=ring[index],next=ring[(index+1)%ring.length],cross=point.lon*next.lat-next.lon*point.lat;lon+=(point.lon+next.lon)*cross;lat+=(point.lat+next.lat)*cross}return{lon:lon/(6*area),lat:lat/(6*area)}}
function pointInRing(point:{lon:number;lat:number},ring:ExtremeAreaContour['rings'][number]){let inside=false;for(let index=0,last=ring.length-1;index<ring.length;last=index++){const a=ring[index],b=ring[last],intersects=(a.lat>point.lat)!==(b.lat>point.lat)&&point.lon<(b.lon-a.lon)*(point.lat-a.lat)/((b.lat-a.lat)||1e-9)+a.lon;if(intersects)inside=!inside}return inside}
function contourCenter(contour:ExtremeAreaContour){const outer=[...contour.rings].sort((a,b)=>Math.abs(ringArea(b))-Math.abs(ringArea(a)))[0];return outer?ringCenter(outer):{lon:0,lat:0}}
function contourContains(contour:ExtremeAreaContour,point:{lon:number;lat:number}){return contour.rings.reduce((inside,ring)=>pointInRing(point,ring)?!inside:inside,false)}

function displayContours(contours:ExtremeAreaContour[]){
 const selected:ExtremeAreaContour[]=[];
 for(const contour of [...contours].sort((a,b)=>b.intensity-a.intensity||b.probability-a.probability)){
  const center=contourCenter(contour),overlapsStronger=selected.some(stronger=>stronger.intensity>contour.intensity&&(contourContains(stronger,center)||contourContains(contour,contourCenter(stronger))));
  if(!overlapsStronger)selected.push(contour);
 }
 return selected;
}

function representativeCell(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId,contour:ExtremeAreaContour){
 const center=contourCenter(contour),levelIndex=contour.intensity-1;
 const candidates=data.cells.map(cell=>({cell,signal:extremeSignalForCell(cell,periodId,hazard),levelProbability:extremeProbabilityLevelsForCell(cell,periodId,hazard)[levelIndex],inside:contourContains(contour,{lon:cell.lon,lat:cell.lat}),distance:(cell.lat-center.lat)**2+((cell.lon-center.lon)*Math.cos(center.lat*Math.PI/180))**2})).filter(item=>item.signal&&extremeSignalVisible(item.signal,hazard,data.thresholds));
 const contained=candidates.filter(item=>item.inside&&item.levelProbability>0),pool=contained.length?contained:candidates;
 return pool.sort((a,b)=>Number(b.signal?.intensity===contour.intensity)-Number(a.signal?.intensity===contour.intensity)||b.levelProbability-a.levelProbability||Number(b.signal?.probability||0)-Number(a.signal?.probability||0)||a.distance-b.distance)[0];
}

export function buildExtremeOutlookContourSet(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId):ExtremeOutlookContourSet{
 const paintAreas=data.cells.map(cell=>({row:cell.row,col:cell.col,lat:cell.lat,lon:cell.lon,probabilityLevels:extremeProbabilityLevelsForCell(cell,periodId,hazard)}));
 const minimumProbability=hazard==='overall'?data.thresholds.probability.overviewMin:data.thresholds.probability.hazardMin;
 const options={minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,colors:EXTREME_INTENSITY_COLORS};
 const contours=buildExtremeOutlookContours(paintAreas,data.grid,options),hatchContours=buildExtremeOutlookContours(paintAreas,data.grid,{...options,maximumProbability:60});
 const areas=displayContours(contours).map(contour=>{
  const center=contourCenter(contour),representative=representativeCell(data,periodId,hazard,contour);
  if(!representative?.signal)return null;
  const signal={...representative.signal,intensity:contour.intensity,probability:contour.probability,probabilityBand:extremeProbabilityBand(contour.probability)} as ResolvedExtremeSignal;
  return{id:`${periodId}:${hazard}:I${contour.intensity}:${representative.cell.id}:${center.lat.toFixed(3)}:${center.lon.toFixed(3)}`,latitude:center.lat,longitude:center.lon,intensity:contour.intensity,probability:contour.probability,region:representative.cell.region,cell:representative.cell,signal,contour};
 }).filter((area):area is ExtremeModelledArea=>Boolean(area)).sort((a,b)=>b.intensity-a.intensity||b.probability-a.probability||a.region.localeCompare(b.region,'de'));
 return{contours,hatchContours,areas};
}
