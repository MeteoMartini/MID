/**
 * Opt-in model weather plot symbols. Must be rendered inside MID's existing
 * MapLibre provider. Requires a verified CloudWeatherData with same run/time.
 * Never use for GDPS WMS pixels without decoded, verified raw WW grid.
 */
import {useEffect,useMemo,useState} from 'react';
import {HtmlMarker,useMidMap} from './MapLibreCore';
import type {CloudWeatherData} from './cloudWeatherData';
import {sparseModelWeatherGlyphs,modelPrecipGlyphSvg} from './synopModelPlot';
import './midSynopMarkers.css';
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));

export default function CloudWwMarkers({data,visible,radarVisible=false}:{data:CloudWeatherData|null;visible:boolean;radarVisible?:boolean}){
 const map=useMidMap(),[revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!map||!visible||!data)return;
  const update=()=>setRevision(v=>v+1);
  map.on('moveend',update);map.on('zoomend',update);map.on('resize',update);
  return()=>{map.off('moveend',update);map.off('zoomend',update);map.off('resize',update)};
 },[map,visible,data]);
 const symbols=useMemo(()=>{
  if(!map||!visible||!data)return[];
  const element=map.getCanvas(),width=element.clientWidth,height=element.clientHeight;
  if(!width||!height)return[];
  // Each plotted code belongs to a verified original model grid cell, never a
  // radar-derived / thermally synthesized SYNOP station observation.
  return sparseModelWeatherGlyphs(data,(lat,lon)=>{
   const p=map.project([lon,lat]);return{x:p.x,y:p.y}
  },{width,height},{max:width<390?28:width<768?42:64,minDistancePx:width<390?72:80,hideRainIfRadar:radarVisible});
 },[map,visible,data,revision,radarVisible]);
 if(!visible||!data)return null;
 return <>{symbols.map(s=><HtmlMarker
   key={`${data.model}:${data.run}:${data.time}:${s.lat}:${s.lon}:${s.glyph.ww}`}
   latitude={s.lat} longitude={s.lon} anchor="center" zIndex={675}
   className="mid-synop-model-marker"
   html={`<button type="button" class="mid-synop-symbol-button" aria-label="${escapeHtml(`Modellcode ww ${s.glyph.ww}: ${s.glyph.label}`)}">${modelPrecipGlyphSvg(s.glyph,30)}</button>`}
   popupHtml={escapeHtml(`Modellcode ww ${s.glyph.ww}: ${s.glyph.label} · ${data.model} · Lauf ${data.run} · gültig ${data.time} · Modellprognose, keine SYNOP-Meldung`)}
 />)}</>;
}
