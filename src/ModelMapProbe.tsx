import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {Marker,type MapMouseEvent} from 'maplibre-gl';
import {AppPortalPopover} from './AppPortalPopover';
import {useMidMap} from './MapLibreCore';
import {formatDecimal} from './format';
import './modelMapProbe.css';

type Point={latitude:number;longitude:number;value:number|null;revision:number;pending?:boolean};
/** Geographic anchor; all portal/outside-tap/Escape logic stays in the app primitive. */
export default function ModelMapProbe({label,unit,source,enabled,contextKey,sample,format,unavailableNote='Keine geprüfte Rasterabdeckung.'}:{label:string;unit:string;source:string;enabled:boolean;contextKey:string;sample:(latitude:number,longitude:number,signal:AbortSignal)=>number|null|Promise<number|null>;format:(value:number|null)=>string;unavailableNote?:string}){
 const map=useMidMap(),tooltipId=useId(),[point,setPoint]=useState<Point|null>(null),anchorRef=useRef<HTMLElement|null>(null),requestRef=useRef<AbortController|null>(null),latest=useRef({sample});latest.current={sample};
 const close=useCallback(()=>{requestRef.current?.abort();setPoint(null)},[]);
 const show=useCallback((latitude:number,longitude:number)=>{
  requestRef.current?.abort();const controller=new AbortController();requestRef.current=controller;
  const position={latitude,longitude,value:null,revision:Date.now()};
  try{const result=latest.current.sample(latitude,longitude,controller.signal);
   if(result instanceof Promise){setPoint({...position,pending:true});void result.then(value=>{if(!controller.signal.aborted)setPoint({...position,value,pending:false})}).catch(()=>{if(!controller.signal.aborted)setPoint({...position,pending:false})})}
   else setPoint({...position,value:result});
  }catch{setPoint(position)}
 },[]);
 useEffect(()=>{
  close();if(!map||!enabled)return;
  const click=(event:MapMouseEvent)=>{if((event.originalEvent.target as Element|null)?.closest('button,a,.maplibregl-ctrl'))return;show(event.lngLat.lat,event.lngLat.wrap().lng)};
  map.on('click',click);map.on('movestart',close);
  return()=>{requestRef.current?.abort();map.off('click',click);map.off('movestart',close)};
 },[map,enabled,contextKey,close,show]);
 useLayoutEffect(()=>{
  if(!map||!point)return;
  const anchor=document.createElement('button');anchor.type='button';anchor.className='mid-model-map-probe-pin';anchor.setAttribute('aria-label','Ausgewählten Kartenwert schließen');anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-describedby',tooltipId);
  const click=(event:MouseEvent)=>{event.stopPropagation();close()};anchor.addEventListener('click',click);
  const marker=new Marker({element:anchor,anchor:'center'}).setLngLat([point.longitude,point.latitude]).addTo(map);anchorRef.current=anchor;
  return()=>{anchor.removeEventListener('click',click);marker.remove();anchorRef.current=null};
 },[map,point,close,tooltipId]);
 // Interactive point information must remain available while it is being read.
 // Dismissal stays explicit (close/Escape/outside tap) or follows a context change.
 const coordinates=point?`${formatDecimal(Math.abs(point.latitude),2)}° ${point.latitude<0?'S':'N'} · ${formatDecimal(Math.abs(point.longitude),2)}° ${point.longitude<0?'W':'O'}`:'';
 return <>
  <button type="button" className="mid-model-map-probe-center" title="Wert am Kartenmittelpunkt" aria-label="Wert am Kartenmittelpunkt anzeigen" aria-expanded={Boolean(point)} disabled={!enabled} onClick={()=>{if(point)close();else if(map){const center=map.getCenter();show(center.lat,center.wrap().lng)}}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/></svg></button>
  <AppPortalPopover anchorRef={anchorRef} open={Boolean(point)} onClose={close} role="dialog" className="mid-model-map-probe" width={240} ariaLabel={`Kartenwert · ${label}`} id={tooltipId} positionKey={point}>
   {point?<><header><span><small>RASTERWERT</small><strong>{label}</strong></span><button type="button" aria-label="Wertanzeige schließen" onClick={close}>×</button></header><p className="mid-model-map-probe__value" aria-live="polite" aria-busy={Boolean(point.pending)}>{point.pending?'Wert wird geladen …':point.value===null?'Kein Wert verfügbar':<>{format(point.value)} <span>{unit}</span></>}</p><p className="mid-model-map-probe__coordinates">{coordinates}</p><p className="mid-model-map-probe__source">{point.pending?source:point.value===null?unavailableNote:source}</p></>:null}
  </AppPortalPopover>
 </>;
}
