/**
 * Real MapLibre/WmsTileLayer source-lifecycle probe with a deterministic LOCAL
 * synthetic raster (not real meteorology). Independent from live radar sources.
 * The actual production MapLibreCore, LegacyCompat and UTC zoom policy run here.
 */
import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MidMapLibre,ImageQuadLayer,useMidMap} from '../../src/MapLibreCore';
import {WMSTileLayer,useMapEvents} from '../../src/MapLibreLegacyCompat';
import {mapTemporalWmsZoomPolicy} from '../../src/mapTemporalWmsZoomPolicy';

declare global {
 interface Window {
  __midWmsZoomMap?:ReturnType<typeof useMidMap>;
 }
}

const OBSERVED='2026-11-17T06:15:00.000Z';
const NOWCAST='2026-11-17T06:20:00.000Z';

function NativeRasterZoomProbe(){
 const map=useMidMap();
 const [zooming,setZooming]=useState(false),[revision,setRevision]=useState(0);
 const [mode,setMode]=useState<'observed'|'nowcast'|'latest'>('observed');
 const [readyCount,setReadyCount]=useState(0),[errorCount,setErrorCount]=useState(0);
 const onStart=useCallback(()=>setZooming(true),[]);
 const onEnd=useCallback(()=>{setRevision(value=>value+1);setZooming(false)},[]);
 useMapEvents({zoomstart:onStart,zoomend:onEnd});
 useEffect(()=>{window.__midWmsZoomMap=map;return()=>{if(window.__midWmsZoomMap===map)delete window.__midWmsZoomMap}},[map]);

 const latestOnly=mode==='latest',original=mode==='observed'?OBSERVED:mode==='nowcast'?NOWCAST:undefined;
 const policy=mapTemporalWmsZoomPolicy(original,latestOnly,revision);
 const zoom=()=>map?.easeTo({zoom:Math.min(9,map.getZoom()+1),duration:360,essential:true});

 return <div className="mid-zoom-qa-controls">
  <output data-testid="qa-current-mode">{mode}</output>
  <output data-testid="qa-revision">{revision}</output>
  <output data-testid="qa-zooming">{zooming?'zooming':'idle'}</output>
  <output data-testid="qa-original-time">{original??'latest'}</output>
  <output data-testid="qa-wms-ready">{readyCount}</output>
  <output data-testid="qa-wms-error">{errorCount}</output>
  <button type="button" onClick={zoom}>MapLibre zoom +1</button>
  <button type="button" onClick={()=>setMode('observed')}>DWD observed original</button>
  <button type="button" onClick={()=>setMode('nowcast')}>DWD nowcast original</button>
  <button type="button" onClick={()=>setMode('latest')}>Untimed latest snapshot</button>
  {!latestOnly&&<ImageQuadLayer id="qa-surroundings-original" key={original}
   url={location.origin+'/__mid_qa_wms?service=WMS&request=GetMap&layers=qa-surroundings&bbox=4,48,11,53&width=256&height=256&time='+encodeURIComponent(original!)}
   bounds={[[48,4],[53,11]]} zIndex={210} onReady={()=>setReadyCount(value=>value+1)}
   onError={()=>setErrorCount(value=>value+1)}/>}
  {(!zooming||policy.retainDuringZoom)&&<WMSTileLayer
   key={`qa:${mode}:${original??'latest'}:${policy.revision}`}
   url={location.origin+'/__mid_qa_wms?revision='+policy.revision}
   params={{layers:'mid:qa-ordinary-radar',styles:'',format:'image/png',transparent:true,version:'1.3.0',
    ...(original?{time:original}:{})}}
   opacity={1} zIndex={360}
   eventHandlers={{load:()=>setReadyCount(value=>value+1),tileerror:()=>setErrorCount(value=>value+1)}}
   attribution="Synthetische Testkacheln; keine Wetterdaten"/>}
 </div>;
}

document.body.style.margin='0';
const root=document.getElementById('root');
if(!root)throw new Error('QA root not found');
createRoot(root).render(<main className="qa-container">
 <h1>Native MapLibre Rasterzoom – synthetische QA</h1>
 <MidMapLibre center={[50.8,7.1]} zoom={5} className="qa-maplibre" navigationControl={false} scrollZoom={false}>
  <NativeRasterZoomProbe/>
 </MidMapLibre>
</main>);
