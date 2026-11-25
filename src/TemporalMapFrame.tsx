import {useEffect,useRef} from 'react';
import * as maplibregl from 'maplibre-gl';
import {registerMapLayerOrder,unregisterMapLayerOrder,useMidMap,type MidMap,type MidGeoLayer} from './MapLibreCore';

export type TemporalMapGroup={id:string;data:any;layers:MidGeoLayer[];zIndex:number;hoverProperty?:string};
export type TemporalMapFrameData={key:string;raster?:{url:string;bounds:[[number,number],[number,number]];resampling:'nearest'|'linear';zIndex:number};groups:TemporalMapGroup[]};
type FrameLayer={id:string;alphas:Record<string,number>;hoverProperty?:string};
type StagedFrame={key:string;sources:string[];layers:FrameLayer[];cleanup:()=>void};
type Environment={makeImage:()=>HTMLImageElement;now:()=>number;raf:(fn:FrameRequestCallback)=>number;cancelRaf:(id:number)=>void;timeout:(fn:()=>void,ms:number)=>number;clearTimeout:(id:number)=>void;reducedMotion:()=>boolean};
const safe=(s:string)=>s.replace(/[^a-zA-Z0-9_-]/g,'_');
const browserEnvironment:Environment={makeImage:()=>new Image(),now:()=>performance.now(),raf:fn=>requestAnimationFrame(fn),cancelRaf:id=>cancelAnimationFrame(id),timeout:(fn,ms)=>window.setTimeout(fn,ms),clearTimeout:id=>window.clearTimeout(id),reducedMotion:()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches};

/** A frame is a presentation transaction, not a new meteorological field.
 * Old and next exact source frames alone can coexist. Never interpolate values.
 */
export function createTemporalMapFrameController(map:MidMap,id:string,env:Environment=browserEnvironment){
 let serial=0,visible:StagedFrame|null=null,pending:StagedFrame|null=null,cancelPending=()=>{},opacity=1,weight=1,disposed=false;
 let clearHover=()=>{};
 const remove=(frame:StagedFrame|null)=>{if(!frame)return;frame.cleanup();for(const layer of frame.layers){unregisterMapLayerOrder(map,layer.id);try{if(map.getLayer(layer.id))map.removeLayer(layer.id)}catch{}}for(const source of frame.sources){try{if(map.getSource(source))map.removeSource(source)}catch{}}};
 const paint=(frame:StagedFrame|null,factor:number)=>{if(!frame)return;for(const layer of frame.layers){if(!map.getLayer(layer.id))continue;for(const [property,alpha] of Object.entries(layer.alphas))try{map.setPaintProperty(layer.id,property as keyof maplibregl.AllPaintProperties,alpha*opacity*factor)}catch{/* context/layer may have disappeared */}}};
 const intact=(frame:StagedFrame)=>frame.layers.every(layer=>Boolean(map.getLayer(layer.id)))&&frame.sources.every(source=>Boolean(map.getSource(source)));
 const hover=(frame:StagedFrame|null)=>{clearHover();clearHover=()=>{};if(!frame)return;
  const interactive=frame.layers.filter(layer=>layer.hoverProperty);if(!interactive.length)return;
  const popup=new maplibregl.Popup({closeButton:true,closeOnClick:false,offset:8,maxWidth:'320px',className:'mid-themed-popup'});
  let pinned=false;const close=()=>{pinned=false};popup.on('close',close);
  const handlers=interactive.map(layer=>{
   const show=(event:maplibregl.MapLayerMouseEvent)=>{const value=event.features?.[0]?.properties?.[layer.hoverProperty!];if(value!==undefined&&value!==null)popup.setLngLat(event.lngLat).setText(String(value)).addTo(map)};
   const move=(event:maplibregl.MapLayerMouseEvent)=>{if(pinned)return;map.getCanvas().style.cursor='pointer';show(event)};
   const leave=()=>{map.getCanvas().style.cursor='';if(!pinned)popup.remove()};
   const click=(event:maplibregl.MapLayerMouseEvent)=>{show(event);pinned=popup.isOpen()};
   map.on('mousemove',layer.id,move);map.on('mouseleave',layer.id,leave);map.on('click',layer.id,click);
   return {layer,move,leave,click};
  });
  clearHover=()=>{popup.off('close',close);popup.remove();for(const {layer,move,leave,click} of handlers){map.off('mousemove',layer.id,move);map.off('mouseleave',layer.id,leave);map.off('click',layer.id,click)}map.getCanvas().style.cursor=''};
 };
 const setOpacity=(value:number)=>{opacity=Math.max(0,Math.min(1,value));paint(visible,pending?1-weight:1);paint(pending,Math.max(.001,weight))};
 const stage=(data:TemporalMapFrameData|null,onReady:()=>void,onError:(message:string)=>void)=>{
  if(disposed)return;
  cancelPending();cancelPending=()=>{};
  // null = pending/unavailable selection, not an instruction to erase the last complete frame.
  if(!data)return;
  if(visible?.key===data.key&&intact(visible)){onReady();return}
  const prefix=safe(id)+'-frame-'+(++serial);
  let active=true,installed=false,raf=0,timer=0,started=false,image:HTMLImageElement|undefined;
  const frame:StagedFrame={key:data.key,sources:[],layers:[],cleanup:()=>{if(image){image.onload=null;image.onerror=null}}};
  pending=frame;weight=0;
  const detach=()=>{map.off('render',ready);map.off('error',sourceError);env.clearTimeout(timer);env.cancelRaf(raf);frame.cleanup()};
  const rollback=()=>{if(!active)return;active=false;detach();pending=null;remove(frame);weight=1;paint(visible,1);hover(visible)};
  cancelPending=rollback;
  const fail=()=>{if(!active)return;rollback();onError('Kartenbild nicht vollständig renderbar. Der letzte vollständige Modelltermin bleibt sichtbar.')};
  const finish=()=>{if(!active)return;active=false;detach();const old=visible;visible=frame;pending=null;weight=1;remove(old);paint(visible,1);hover(visible);cancelPending=()=>{};onReady()};
  const fade=(now:number,start:number,duration:number)=>{if(!active)return;if(!intact(frame)){fail();return}
   weight=duration?Math.max(0,Math.min(1,(now-start)/duration)):1;
   paint(visible,1-weight);paint(frame,weight);
   if(weight<1)raf=env.raf(t=>fade(t,start,duration));else finish();
  };
  function ready(){if(!active||!installed||started||!intact(frame)||!frame.sources.every(source=>map.isSourceLoaded(source)))return;
   started=true;map.off('render',ready);clearHover();clearHover=()=>{};
   const start=env.now(),duration=env.reducedMotion()?0:350;
   raf=env.raf(now=>fade(now,start,duration));
  }
  function sourceError(event:maplibregl.ErrorEvent){if(frame.sources.includes((event as unknown as {sourceId?:string}).sourceId??''))fail()}
  const add=(source:string,spec:MidGeoLayer,zIndex:number,hoverProperty?:string)=>{
   const layerId=prefix+'-'+safe(source)+'-'+safe(spec.id),paintSpec={...spec.paint},alphas:Record<string,number>={};
   const properties=spec.type==='line'?['line-opacity']:spec.type==='fill'?['fill-opacity']:spec.type==='circle'?['circle-opacity','circle-stroke-opacity']:['text-opacity',...(spec.layout?.['icon-image']?['icon-opacity']:[])];
   for(const p of properties){const a=paintSpec[p]??1;if(typeof a!=='number'||!Number.isFinite(a))throw Error('Temporal opacity requires a finite constant');alphas[p]=Math.max(0,Math.min(1,a));paintSpec[p]=alphas[p]*opacity*.001;paintSpec[p+'-transition']={duration:0,delay:0}}
   frame.layers.push({id:layerId,alphas,hoverProperty});
   map.addLayer({id:layerId,type:spec.type,source,...(spec.minzoom!==undefined?{minzoom:spec.minzoom}:{}),...(spec.maxzoom!==undefined?{maxzoom:spec.maxzoom}:{}),...(spec.layout?{layout:spec.layout}:{}),...(spec.filter?{filter:spec.filter}:{}),paint:paintSpec} as maplibregl.AddLayerObject);
   registerMapLayerOrder(map,layerId,zIndex);
  };
  const install=()=>{if(!active)return;try{
   if(data.raster&&image){const {bounds,resampling,zIndex}=data.raster,[[south,west],[north,east]]=bounds,source=prefix+'-raster',layerId=source+'-layer';
    frame.sources.push(source);map.addSource(source,{type:'image',coordinates:[[west,north],[east,north],[east,south],[west,south]]});if(!active)return;
    (map.getSource(source) as maplibregl.ImageSource).updateImage({image});if(!active)return;
    frame.layers.push({id:layerId,alphas:{'raster-opacity':1}});
    map.addLayer({id:layerId,type:'raster',source,paint:{'raster-opacity':opacity*.001,'raster-opacity-transition':{duration:0,delay:0},'raster-fade-duration':0,'raster-resampling':resampling}});
    registerMapLayerOrder(map,layerId,zIndex);
   }
   for(const group of data.groups){if(!group.data?.features?.length)continue;const source=prefix+'-'+safe(group.id);
    frame.sources.push(source);map.addSource(source,{type:'geojson',data:group.data});if(!active)return;
    for(const [index,spec] of group.layers.entries()){if(!active)return;add(source,spec,group.zIndex+index/1000,group.hoverProperty)}
   }
   installed=true;map.on('render',ready);map.triggerRepaint();
  }catch{fail()}};
  map.on('error',sourceError);timer=env.timeout(fail,20000);
  if(data.raster){image=env.makeImage();image.onload=install;image.onerror=fail;image.src=data.raster.url}else install();
 };
 return {stage,setOpacity,dispose(){if(disposed)return;disposed=true;cancelPending();clearHover();remove(visible);visible=null}};
}

export function TemporalMapFrame({id,frame,opacity,onReady,onError}:{id:string;frame:TemporalMapFrameData|null;opacity:number;onReady?:()=>void;onError?:(message:string)=>void}){
 const map=useMidMap(),controller=useRef<ReturnType<typeof createTemporalMapFrameController>|null>(null);
 const callbacks=useRef({onReady,onError});callbacks.current={onReady,onError};
 useEffect(()=>{if(!map)return;const c=createTemporalMapFrameController(map,id);controller.current=c;return()=>{c.dispose();controller.current=null}},[map,id]);
 useEffect(()=>{controller.current?.setOpacity(opacity)},[map,id,opacity]);
 // Capture the candidate's callback, not the next selection's callback.
 useEffect(()=>{const ready=onReady,error=onError;controller.current?.stage(frame,()=>ready?.(),message=>error?.(message))},[map,id,frame]);
 return null;
}
