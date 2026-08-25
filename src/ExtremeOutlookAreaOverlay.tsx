import {memo,useMemo} from 'react';
import {CanvasOverlay,type MidMap} from './MapLibreCore';
import {buildExtremeOutlookContours,drawExtremeOutlookContours} from './extremeOutlookAreaCanvas';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityLevelsForCell,type ExtremeHazardId,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

const EXTREME_AREA_EVENTS=['moveend','zoomend','resize','render'] as const;

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const paintAreas=useMemo(()=>data.cells.map(cell=>({row:cell.row,col:cell.col,lat:cell.lat,lon:cell.lon,probabilityLevels:extremeProbabilityLevelsForCell(cell,periodId,hazard)})),[data,periodId,hazard]);
 const minimumProbability=hazard==='overall'?data.thresholds.probability.overviewMin:data.thresholds.probability.hazardMin;
 const contours=useMemo(()=>buildExtremeOutlookContours(paintAreas,data.grid,{minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,colors:EXTREME_INTENSITY_COLORS}),[paintAreas,data.grid,minimumProbability,data.thresholds.probability.extremeExceptionMin]);
 const render=useMemo(()=>((map:MidMap,canvas:HTMLCanvasElement)=>drawExtremeOutlookContours(map,canvas,contours)),[contours]);
 return contours.length?<CanvasOverlay id="extreme-outlook-areas" zIndex={8} render={render} events={EXTREME_AREA_EVENTS}/>:null;
}

export default memo(ExtremeOutlookAreaOverlay);
