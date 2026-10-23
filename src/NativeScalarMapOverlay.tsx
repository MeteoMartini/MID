import {useMemo} from 'react';
import {GeoJsonLayers,HtmlMarker,type MidGeoLayer} from './MapLibreCore';
import type {NativeField} from './nativeModelFields';
import {modelMapUnit,modelMapValue} from './modelMapUnits';
import {nativeRasterExtremes,nativeScalarLines,scalarLineFeatures,scalarLineName} from './nativeScalarAnnotations';
import type {WindUnit} from './weather';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function scalarMapLayers():MidGeoLayer[]{return [
 {id:'halo',type:'line',paint:{'line-color':'#fff','line-width':3,'line-opacity':.8}},
 {id:'line',type:'line',paint:{'line-color':'#20384d','line-width':1.2}},
 {id:'labels',type:'symbol',layout:{'symbol-placement':'line','symbol-spacing':180,'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#20384d','text-halo-color':'#fff','text-halo-width':1.5}}
]}
export function NativeScalarOverlay({field,unit,lines=false,extremes=true}:{field:NativeField;unit:WindUnit;lines?:boolean;extremes?:boolean}){
 const contours=useMemo(()=>scalarLineFeatures(lines?nativeScalarLines(field,unit):[]),[field,unit,lines]);
 const points=useMemo(()=>extremes?nativeRasterExtremes(field):[],[field,extremes]);
 const uniform=points.length===2&&points[0].value===points[1].value;
 return <>{lines&&<GeoJsonLayers id="native-parameter-isolines" data={contours} zIndex={665} hoverProperty="label" layers={scalarMapLayers()}/>}{points.filter((_,i)=>!uniform||i===0).map(p=>{
  const text=`${uniform?'Min = Max':p.type} ${modelMapValue(field.kind,p.value,field.unit,unit)} ${modelMapUnit(field.kind,field.unit,unit)}`;
  const anchor=`${p.lat>(field.lats[0]+field.lats.at(-1)!)/2?'top':'bottom'}-${p.lon>(field.lons[0]+field.lons.at(-1)!)/2?'right':'left'}` as 'top-left'|'top-right'|'bottom-left'|'bottom-right';
  return <HtmlMarker key={p.type} latitude={p.lat} longitude={p.lon} anchor={anchor} zIndex={735} className="native-raster-extreme" html={`<span style="display:block;background:#fff;color:${p.type==='Max'?'#9b1833':'#153c7b'};border:1px solid currentColor;border-radius:5px;padding:3px 5px;font:700 12px Arial;white-space:nowrap;box-shadow:0 1px 4px #0006">${escape(text)}</span>`} popupHtml={`${escape(text)}<br/>Extremwert im verfügbaren Raster · ${escape(field.time)}`}/>;
 })}</>;
}
export function NativeScalarControls({field,unit,extremes,onExtremes,lines,onLines}:{field:NativeField;unit:WindUnit;extremes:boolean;onExtremes:(v:boolean)=>void;lines?:boolean;onLines?:(v:boolean)=>void}){
 const points=useMemo(()=>nativeRasterExtremes(field),[field]);
 if(!points.length)return null;
 const touch={display:'flex',alignItems:'center',gap:8,minHeight:44};
 return <div className="unified-scalar-controls" style={{display:'grid',gap:8,padding:'8px 0',fontSize:12}}><label className="unified-check" style={touch}><input type="checkbox" checked={extremes} onChange={e=>onExtremes(e.target.checked)}/>Min / Max im verfügbaren Raster</label>{onLines&&field.kind!=='pressure'&&<label className="unified-check" style={touch}><input type="checkbox" checked={lines} onChange={e=>onLines(e.target.checked)}/>{scalarLineName(field.kind)} · aus Rasterwerten</label>}<p role="status" style={{margin:0}}>{points.map(p=>`${p.type} ${modelMapValue(field.kind,p.value,field.unit,unit)} ${modelMapUnit(field.kind,field.unit,unit)}`).join(' · ')} · verfügbares Raster, kein vollständiges Modellgebiet.</p></div>;
}
