import {useEffect,useMemo,useState} from 'react';
import {GeoJsonLayers,HtmlMarker,useMidMap,type MidGeoLayer} from './MapLibreCore';
import type {NativeField} from './nativeModelFields';
import {modelMapUnit,modelMapValue} from './modelMapUnits';
import {nativeRasterExtremes,nativeScalarLines,scalarLineFeatures,scalarLineName,type RasterViewport} from './nativeScalarAnnotations';
import type {WindUnit} from './weather';

const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function scalarMapLayers():MidGeoLayer[]{return [
 {id:'halo',type:'line',paint:{'line-color':'#fff','line-width':3,'line-opacity':.8}},
 {id:'line',type:'line',paint:{'line-color':'#20384d','line-width':1.2}},
 {id:'labels',type:'symbol',layout:{'symbol-placement':'line','symbol-spacing':180,'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#20384d','text-halo-color':'#fff','text-halo-width':1.5}}
]}

/** MapLibre's visible extent drives scalar markers; never use the entire raster
 * while panning, and never substitute an unavailable/no-data cell with zero.
 * moveend/zoomend/resize are supported by MapLibre 6.
 */
export function NativeScalarOverlay({field,unit,lines=false,extremes=true}:{field:NativeField;unit:WindUnit;lines?:boolean;extremes?:boolean}){
 const map=useMidMap(),[viewport,setViewport]=useState<RasterViewport|null>(null),[moving,setMoving]=useState(false);
 useEffect(()=>{
  if(!map)return;
  const update=()=>{
   const b=map.getBounds();
   const next={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};
   setViewport(prev=>prev&&Object.keys(next).every(k=>prev[k as keyof RasterViewport]===next[k as keyof RasterViewport])?prev:next);
  };
  const start=()=>setMoving(true);
  const end=()=>{update();setMoving(false)};
  map.on('movestart',start);map.on('moveend',end);map.on('zoomend',end);map.on('resize',update);
  update();
  return()=>{map.off('movestart',start);map.off('moveend',end);map.off('zoomend',end);map.off('resize',update)};
 },[map]);
 const contours=useMemo(()=>scalarLineFeatures(lines?nativeScalarLines(field,unit):[]),[field,unit,lines]);
 const points=useMemo(()=>extremes&&!moving&&viewport?nativeRasterExtremes(field,viewport):[],[field,viewport,extremes,moving]);
 const uniform=points.length===2&&points[0].value===points[1].value;
 const visiblePoints=uniform?points.slice(0,1):points;
 const locations=visiblePoints.map(p=>{
  const centerLon=map?.getCenter().lng??p.lon;
  const longitude=p.lon+360*Math.round((centerLon-p.lon)/360);
  const pixel=map?.project([longitude,p.lat]),canvas=map?.getCanvas();
  const horizontal=!pixel||!canvas?'center':pixel.x<62?'left':pixel.x>canvas.clientWidth-62?'right':'center';
  const vertical=!pixel||!canvas?'center':pixel.y<30?'top':pixel.y>canvas.clientHeight-30?'bottom':'center';
  const anchor=(horizontal==='center'?vertical:vertical==='center'?horizontal:`${vertical}-${horizontal}`) as 'center'|'left'|'right'|'top'|'bottom'|'top-left'|'top-right'|'bottom-left'|'bottom-right';
  return {p,pixel,anchor,longitude};
 });
 const collision=locations.length===2&&locations.every(x=>x.pixel)&&Math.hypot(locations[0].pixel!.x-locations[1].pixel!.x,locations[0].pixel!.y-locations[1].pixel!.y)<32;
 return <>{lines&&<GeoJsonLayers id="native-parameter-isolines" data={contours} zIndex={665} hoverProperty="label" layers={scalarMapLayers()}/>}
  {locations.map(({p,anchor,longitude},i)=>{
   const val=modelMapValue(field.kind,p.value,field.unit,unit);
   const full=`${uniform?'Einheitlicher Wert':p.type==='Min'?'Minimum':'Maximum'} im sichtbaren Ausschnitt: ${val} ${modelMapUnit(field.kind,field.unit,unit)}`;
   const html=`<span role="img" tabindex="0" aria-label="${escape(full)}" style="display:block;color:#fff;font:600 12px/1.2 Arial,sans-serif;white-space:nowrap;text-shadow:0 1px 2px #12202b,1px 0 2px #12202b,-1px 0 2px #12202b,0 -1px 2px #12202b;pointer-events:auto">${escape(val)}</span>`;
   return <HtmlMarker key={p.type} latitude={p.lat} longitude={longitude} anchor={anchor} offset={(collision?[0,i===0?-12:12]:[0,0]) as [number,number]} zIndex={735} className="native-raster-extreme" html={html} popupHtml={escape(full)+`<br/>Modelltermin: ${escape(field.time)}`}/>;
  })}
 </>;
}
export function NativeScalarControls({field,unit,extremes,onExtremes,lines,onLines}:{field:NativeField;unit:WindUnit;extremes:boolean;onExtremes:(v:boolean)=>void;lines?:boolean;onLines?:(v:boolean)=>void}){
 const points=useMemo(()=>nativeRasterExtremes(field),[field]);
 if(!points.length)return null;
 const touch={display:'flex',alignItems:'center',gap:8,minHeight:44};
 return <div className="unified-scalar-controls" style={{display:'grid',gap:8,padding:'8px 0',fontSize:12}}>
  <label className="unified-check" style={touch} title={`Extremwerte in ${modelMapUnit(field.kind,field.unit,unit)}`}><input type="checkbox" checked={extremes} onChange={e=>onExtremes(e.target.checked)}/>Extremwerte im sichtbaren Ausschnitt</label>
  {onLines&&field.kind!=='pressure'&&<label className="unified-check" style={touch}><input type="checkbox" checked={lines} onChange={e=>onLines(e.target.checked)}/>{scalarLineName(field.kind)} · aus Rasterwerten</label>}
 </div>;
}
