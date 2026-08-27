import {Fragment,memo,useCallback,useMemo} from 'react';
import {CanvasOverlay,HtmlMarker} from './MapLibreCore';
import {drawExtremeOutlookContours} from './extremeOutlookAreaCanvas';
import {buildExtremeOutlookContourSet} from './extremeOutlookModelledAreas';
import {EXTREME_INTENSITY_COLORS,type ExtremeHazardId,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

function escapeHtml(value:unknown){return String(value??'').replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]||character))}

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const contourSet=useMemo(()=>buildExtremeOutlookContourSet(data,periodId,hazard),[data,periodId,hazard]),{contours,areas}=contourSet;
 const renderContours=useCallback((map:Parameters<typeof drawExtremeOutlookContours>[0],canvas:HTMLCanvasElement)=>drawExtremeOutlookContours(map,canvas,contours),[contours]);
 return <Fragment>
  <CanvasOverlay id="extreme-outlook-areas" zIndex={8} render={renderContours} events={['moveend','zoomend','resize','render']}/>
  {areas.map(area=><HtmlMarker key={area.id} latitude={area.latitude} longitude={area.longitude} className="extreme-map-label" anchor="center" html={`<span style="background:${EXTREME_INTENSITY_COLORS[area.intensity]};color:${area.intensity<=2?'#17202a':'#ffffff'}"><b>I${area.intensity}</b><small>${area.probability}%</small></span>`} popupHtml={`<strong>${escapeHtml(area.region)}</strong><br/>Modellierte Gefahrenfläche<br/>I${area.intensity} · <b>${area.probability} %</b>`} zIndex={35}/>) }
 </Fragment>;
}

export default memo(ExtremeOutlookAreaOverlay);
