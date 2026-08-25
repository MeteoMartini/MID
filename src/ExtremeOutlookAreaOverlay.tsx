import {memo,useMemo} from 'react';
import {CanvasOverlay,type MidMap} from './MapLibreCore';
import {buildExtremeOutlookContours,drawExtremeOutlookContours} from './extremeOutlookAreaCanvas';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityOpacity,extremeSignalForCell,extremeSignalVisible,type ExtremeHazardId,type ExtremeWeatherOutlook,type ResolvedExtremeSignal} from './extremeWeatherOutlook';

type AreaCell={cell:ExtremeWeatherOutlook['cells'][number];signal:ResolvedExtremeSignal};
const EXTREME_AREA_EVENTS=['moveend','zoomend','resize','render'] as const;

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const areas=useMemo(()=>data.cells.map(cell=>({cell,signal:extremeSignalForCell(cell,periodId,hazard)})).filter((item):item is AreaCell=>Boolean(item.signal&&extremeSignalVisible(item.signal,hazard,data.thresholds))),[data,periodId,hazard]);
 const paintAreas=useMemo(()=>[...areas].sort((a,b)=>a.signal.intensity-b.signal.intensity||a.signal.probability-b.signal.probability).map(({cell,signal})=>({lat:cell.lat,lon:cell.lon,intensity:signal.intensity,probability:signal.probability,color:EXTREME_INTENSITY_COLORS[signal.intensity],opacity:Math.max(.42,Math.min(.8,extremeProbabilityOpacity(signal.probability)+.08))})),[areas]);
 const contours=useMemo(()=>buildExtremeOutlookContours(paintAreas,data.grid),[paintAreas,data.grid]);
 const render=useMemo(()=>((map:MidMap,canvas:HTMLCanvasElement)=>drawExtremeOutlookContours(map,canvas,contours)),[contours]);
 return contours.length?<CanvasOverlay id="extreme-outlook-areas" zIndex={8} render={render} events={EXTREME_AREA_EVENTS}/>:null;
}

export default memo(ExtremeOutlookAreaOverlay);
