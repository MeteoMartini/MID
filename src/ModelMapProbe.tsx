import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {Marker,type Map as MapLibreMap,type MapMouseEvent} from 'maplibre-gl';
import {AppPortalPopover} from './AppPortalPopover';
import {useMidMap} from './MapLibreCore';
import {formatDecimal} from './format';
import {MapProbeGroup,type MapProbeSnapshot,type MapProbeSource} from './mapProbeGroup';
import './modelMapProbe.css';

type MapProbeStore={
 group:MapProbeGroup;click:(event:MapMouseEvent)=>void;move:()=>void;
};
const stores=new WeakMap<MapLibreMap,MapProbeStore>();

function acquireStore(map:MapLibreMap):MapProbeStore{
 const current=stores.get(map);if(current)return current;
 const group=new MapProbeGroup();
 const click=(event:MapMouseEvent)=>{
  if((event.originalEvent.target as Element|null)?.closest('button,a,.maplibregl-ctrl'))return;
  group.show(event.lngLat.lat,event.lngLat.wrap().lng);
 };
 const move=()=>group.close();
 map.on('click',click);
 map.on('movestart',move);
 const store={group,click,move};stores.set(map,store);return store;
}
function releaseStore(map:MapLibreMap,store:MapProbeStore){
 if(store.group.size)return;
 store.group.close();
 map.off('click',store.click);map.off('movestart',store.move);
 stores.delete(map);
}

/**
 * All enabled probes on the SAME map share one event and one focusable popup.
 * Each existing caller still supplies its own verified field, unit and source.
 * No field blending, spatial interpolation or missing-to-zero substitution.
 */
export default function ModelMapProbe<T extends number|string=number>(
 {label,unit,source,enabled,contextKey,sample,format,unavailableNote='Keine geprüfte Rasterabdeckung.'}:{
 label:string;unit:string;source:string;enabled:boolean;contextKey:string;
 sample:(latitude:number,longitude:number,signal:AbortSignal)=>T|null|Promise<T|null>;
 format:(value:T|null)=>string;unavailableNote?:string;
 }){
 const map=useMidMap(),tooltipId=useId(),idRef=useRef(Symbol('mid-model-map-probe'));
 const [view,setView]=useState<MapProbeSnapshot>({owner:false,point:null});
 const anchorRef=useRef<HTMLElement|null>(null),storeRef=useRef<MapProbeStore|null>(null);
 const latest=useRef({label,unit,source,sample,format,unavailableNote});
 latest.current={label,unit,source,sample,format,unavailableNote};
 const close=useCallback(()=>storeRef.current?.group.close(),[]);
 const show=useCallback((latitude:number,longitude:number)=>
  storeRef.current?.group.show(latitude,longitude),[]);
 useEffect(()=>{
  if(!map||!enabled){setView({owner:false,point:null});return;}
  const store=acquireStore(map);storeRef.current=store;
  store.group.add({
   id:idRef.current,
   read:():MapProbeSource=>{
    const current=latest.current;
    return{label:current.label,unit:current.unit,source:current.source,
     unavailableNote:current.unavailableNote,
     sample:(latitude,longitude,signal)=>current.sample(latitude,longitude,signal),
     format:value=>current.format(value as T|null)};
   },
   notify:setView,
  });
  return()=>{
   store.group.remove(idRef.current);
   releaseStore(map,store);
   if(storeRef.current===store)storeRef.current=null;
  };
 },[map,enabled,contextKey]);
 const point=view.point;
 useLayoutEffect(()=>{
  if(!map||!view.owner||!point)return;
  const anchor=document.createElement('button');
  anchor.type='button';anchor.className='mid-model-map-probe-pin';
  anchor.setAttribute('aria-label','Ausgewählte Kartenwerte schließen');
  anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-describedby',tooltipId);
  const click=(event:MouseEvent)=>{event.stopPropagation();close()};
  anchor.addEventListener('click',click);
  const marker=new Marker({element:anchor,anchor:'center'})
   .setLngLat([point.longitude,point.latitude]).addTo(map);
  anchorRef.current=anchor;
  return()=>{
   anchor.removeEventListener('click',click);marker.remove();anchorRef.current=null;
  };
 },[map,view.owner,point?.latitude,point?.longitude,close,tooltipId]);
 // Followers register their numerical fields, but never create duplicate
 // buttons, markers, popover focus traps or overlapping portal overlays.
 if(!view.owner)return null;
 const rows=point?.rows??[],multiple=rows.length>1;
 const coordinates=point?`${formatDecimal(Math.abs(point.latitude),2)}° ${point.latitude<0?'S':'N'} · ${formatDecimal(Math.abs(point.longitude),2)}° ${point.longitude<0?'W':'O'}`:'';
 return <>
  <button type="button" className="mid-model-map-probe-center"
   title="Wert am Kartenmittelpunkt" aria-label="Wert am Kartenmittelpunkt anzeigen" aria-haspopup="dialog"
   aria-expanded={Boolean(point)} disabled={!enabled}
   onClick={()=>{
    if(point)close();else if(map){const center=map.getCenter();show(center.lat,center.wrap().lng)}
   }}>
   <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="7"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>
   </svg>
  </button>
  <AppPortalPopover anchorRef={anchorRef} open={Boolean(point)} onClose={close}
   role="dialog" className="mid-model-map-probe" width={multiple?285:240}
   ariaLabel={multiple?`Kartenwerte · ${rows.map(row=>row.label).join(' und ')}`:`Kartenwert · ${label}`}
   id={tooltipId} positionKey={point}>
   {point?<><header><span><small>{multiple?'RASTERWERTE':'RASTERWERT'}</small>
    <strong>{multiple?'Werte der aktiven Modell-Layer':rows[0]?.label??label}</strong>
    </span><button type="button" aria-label="Wertanzeige schließen" onClick={close}>×</button>
    </header>
    {rows.map((row,i)=><div key={i} className="mid-model-map-probe__row">
     {multiple&&<strong className="mid-model-map-probe__row-label">{row.label}</strong>}
     <p className="mid-model-map-probe__value" aria-live="polite" aria-busy={row.pending}>
      {row.pending?'Wert wird geladen …':row.value===null?'Kein Wert verfügbar':
       <>{row.format(row.value)} {row.unit&&<span>{row.unit}</span>}</>}
     </p>
     {multiple&&<p className="mid-model-map-probe__source">
      {!row.pending&&row.value===null?row.unavailableNote:row.source}
     </p>}
    </div>)}
    <p className="mid-model-map-probe__coordinates">{coordinates}</p>
    {!multiple&&rows[0]&&<p className="mid-model-map-probe__source">
     {!rows[0].pending&&rows[0].value===null?rows[0].unavailableNote:rows[0].source}
    </p>}
   </>:null}
  </AppPortalPopover>
 </>;
}
