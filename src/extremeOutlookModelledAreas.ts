import {buildExtremeOutlookContours,type ExtremeAreaContour} from './extremeOutlookAreaCanvas';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityBand,extremeProbabilityLevelsForCell,extremeSignalForCell,type ExtremeHazardId,type ExtremeHazardKind,type ExtremeOutlookCell,type ExtremeWeatherOutlook,type ResolvedExtremeSignal} from './extremeWeatherOutlook';

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

function distanceTo(center:{lon:number;lat:number},cell:ExtremeOutlookCell){return(cell.lat-center.lat)**2+((cell.lon-center.lon)*Math.cos(center.lat*Math.PI/180))**2}
function contourSignalForCell(cell:ExtremeOutlookCell,periodId:string,hazard:ExtremeHazardId,levelIndex:number):ResolvedExtremeSignal|null{
 const period=cell.periods?.[periodId];if(!period)return null;
 if(hazard!=='overall'){const signal=period.hazards?.[hazard];return signal?{...signal,hazard}:null}
 const candidates=(Object.entries(period.probabilityFields||{}) as Array<[ExtremeHazardKind,[number,number,number,number]]>).map(([kind,levels])=>({kind,probability:Number(levels?.[levelIndex])||0,signal:period.hazards?.[kind]})).filter(item=>item.signal&&item.probability>0).sort((a,b)=>b.probability-a.probability||Number(b.signal?.probability||0)-Number(a.signal?.probability||0));
 const selected=candidates[0];return selected?.signal?{...selected.signal,hazard:selected.kind}:extremeSignalForCell(cell,periodId,hazard);
}
function thresholdMetricsForContour(data:ExtremeWeatherOutlook,signal:ResolvedExtremeSignal,intensity:ExtremeAreaContour['intensity'],probability:number){const metrics={...(signal.metrics||{})};if(signal.hazard==='rain'){const level=data.thresholds.rain.levels[intensity-1],requested=Math.round(Number(metrics.thresholdWindowHours??metrics.windowHours??6)),window=level?.values?.[String(requested)]!==undefined?requested:Number(Object.keys(level?.values||{}).map(Number).find(value=>Number.isFinite(value))??6);metrics.thresholdWindowHours=window;metrics.thresholdMm=level?.values?.[String(window)]}else if(signal.hazard==='wind'){const terrain=String(metrics.terrain??'lowland'),band=data.thresholds.wind.terrainBands.find(item=>item.id===terrain)??data.thresholds.wind.terrainBands[0];metrics.thresholdGustKmh=band?.levels?.[intensity-1]}else if(signal.hazard==='snow'){const level=data.thresholds.snow.levels[intensity-1],requested=Math.round(Number(metrics.thresholdWindowHours??metrics.windowHours??6)),window=level?.values?.[String(requested)]!==undefined?requested:Number(Object.keys(level?.values||{}).map(Number).find(value=>Number.isFinite(value))??6),multiplier=data.thresholds.snow.terrainMultipliers[String(metrics.terrain??'lowland')]??1;metrics.thresholdWindowHours=window;metrics.thresholdSnowCm=Number(level?.values?.[String(window)]??0)*multiplier}else if(signal.hazard==='ice'){const level=data.thresholds.ice.levels[intensity-1];metrics.thresholdGlazeMm=level?.value;if(level?.durationHours)metrics.thresholdDurationHours=level.durationHours}else if(signal.hazard==='thunderstorm'){metrics.thresholdCapeJkg=data.thresholds.thunderstorm.capeJkg[intensity-1];metrics.thresholdLapseRateKkm=data.thresholds.thunderstorm.lapseRateKkm[intensity-1];metrics.thresholdShearMs=data.thresholds.thunderstorm.shearMs[intensity-1];metrics.thresholdHailCm=data.thresholds.thunderstorm.hailCm[intensity-1]}metrics.thresholdProbability=probability;return metrics}
function cellsForContour(data:ExtremeWeatherOutlook,contour:ExtremeAreaContour){
 const center=contourCenter(contour),cells=data.cells.map(cell=>({cell,inside:contourContains(contour,{lon:cell.lon,lat:cell.lat}),distance:distanceTo(center,cell)})),contained=cells.filter(item=>item.inside);
 return{center,cells,spatial:(contained.length?contained:cells).sort((a,b)=>a.distance-b.distance)[0]};
}
function representativeCell(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId,contour:ExtremeAreaContour){
 const levelIndex=contour.intensity-1,{cells,spatial}=cellsForContour(data,contour);
 const candidates=cells.map(item=>({...item,signal:contourSignalForCell(item.cell,periodId,hazard,levelIndex),levelProbability:extremeProbabilityLevelsForCell(item.cell,periodId,hazard)[levelIndex]})).filter(item=>item.signal);
 const contained=candidates.filter(item=>item.inside&&item.levelProbability>0);
 const metric=(contained.length?contained.sort((a,b)=>Number(b.signal?.intensity===contour.intensity)-Number(a.signal?.intensity===contour.intensity)||b.levelProbability-a.levelProbability||a.distance-b.distance):candidates.sort((a,b)=>a.distance-b.distance||Number(b.signal?.intensity===contour.intensity)-Number(a.signal?.intensity===contour.intensity)||b.levelProbability-a.levelProbability))[0];
 return metric&&spatial?{metric,spatial}:null;
}

export function buildExtremeOutlookContourSet(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId):ExtremeOutlookContourSet{
 const paintAreas=data.cells.map(cell=>({row:cell.row,col:cell.col,lat:cell.lat,lon:cell.lon,probabilityLevels:extremeProbabilityLevelsForCell(cell,periodId,hazard)}));
 const minimumProbability=hazard==='overall'?data.thresholds.probability.overviewMin:data.thresholds.probability.hazardMin;
 const options={minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,colors:EXTREME_INTENSITY_COLORS};
 const contours=buildExtremeOutlookContours(paintAreas,data.grid,options),hatchContours=buildExtremeOutlookContours(paintAreas,data.grid,{...options,maximumProbability:60});
 const areas=displayContours(contours).map(contour=>{
  const center=contourCenter(contour),representative=representativeCell(data,periodId,hazard,contour);
  if(!representative?.metric.signal)return null;
  const signal={...representative.metric.signal,intensity:contour.intensity,probability:contour.probability,probabilityBand:extremeProbabilityBand(contour.probability),metrics:thresholdMetricsForContour(data,representative.metric.signal,contour.intensity,contour.probability)} as ResolvedExtremeSignal;
  return{id:`${periodId}:${hazard}:I${contour.intensity}:${representative.spatial.cell.id}:${center.lat.toFixed(3)}:${center.lon.toFixed(3)}`,latitude:center.lat,longitude:center.lon,intensity:contour.intensity,probability:contour.probability,region:representative.spatial.cell.region,cell:representative.metric.cell,signal,contour};
 }).filter((area):area is ExtremeModelledArea=>Boolean(area)).sort((a,b)=>b.intensity-a.intensity||b.probability-a.probability||a.region.localeCompare(b.region,'de'));
 return{contours,hatchContours,areas};
}

export function strongestModelledRegionAreas(areas:ExtremeModelledArea[],limit=8){
 const regions=new Map<string,ExtremeModelledArea>();
 for(const area of areas){const key=`${area.region}:${area.signal.hazard}:I${area.intensity}`,current=regions.get(key);if(!current||area.probability>current.probability)regions.set(key,area)}
 return[...regions.values()].sort((a,b)=>b.intensity-a.intensity||b.probability-a.probability||a.region.localeCompare(b.region,'de')).slice(0,limit);
}
