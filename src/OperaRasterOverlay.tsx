import {useEffect} from 'react';
import L from 'leaflet';
import {useMap} from 'react-leaflet';
import type {OperaRasterFrame} from './CompositeData';
import {loadOperaRasterData,operaRasterPoint,type OperaRaster} from './OperaRasterSource';

type Status='idle'|'loading'|'ready'|'error';

function colour(dbz:number):[number,number,number,number]{
 if(!Number.isFinite(dbz)||dbz<5)return[0,0,0,0];
 if(dbz<10)return[217,243,255,140];if(dbz<20)return[114,201,255,178];if(dbz<30)return[47,145,227,205];if(dbz<40)return[67,200,121,222];if(dbz<50)return[240,212,71,234];if(dbz<55)return[245,155,61,240];if(dbz<60)return[227,75,75,244];return[184,63,200,248];
}
function render(map:L.Map,canvas:HTMLCanvasElement,raster:OperaRaster){
 const size=map.getSize(),memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,pixelCount=size.x*size.y,step=memory<=2||pixelCount>650000?2:1,width=Math.max(1,Math.ceil(size.x/step)),height=Math.max(1,Math.ceil(size.y/step)),ratio=Math.min(1.5,window.devicePixelRatio||1),renderWidth=Math.max(1,Math.round(width*ratio)),renderHeight=Math.max(1,Math.round(height*ratio));
 canvas.width=renderWidth;canvas.height=renderHeight;canvas.style.width=`${size.x}px`;canvas.style.height=`${size.y}px`;const topLeft=map.containerPointToLayerPoint([0,0]);L.DomUtil.setPosition(canvas,topLeft);
 const context=canvas.getContext('2d',{alpha:true});if(!context)return;const image=context.createImageData(renderWidth,renderHeight),pixels=image.data,zoom=map.getZoom(),worldSize=256*2**zoom,pixelOrigin=map.getPixelOrigin(),worldLeft=pixelOrigin.x,worldTop=pixelOrigin.y,screenScale=step/ratio;
 for(let y=0;y<renderHeight;y++){
  const worldY=worldTop+(y+.5)*screenScale,mercator=Math.PI*(1-2*worldY/worldSize),lat=Math.atan(Math.sinh(mercator))*180/Math.PI;
  for(let x=0;x<renderWidth;x++){
   const worldX=worldLeft+(x+.5)*screenScale,lon=worldX/worldSize*360-180,point=operaRasterPoint(raster,lat,lon),rgba=point.dbz===undefined?[0,0,0,0] as [number,number,number,number]:colour(point.dbz),index=(y*renderWidth+x)*4;
   pixels[index]=rgba[0];pixels[index+1]=rgba[1];pixels[index+2]=rgba[2];pixels[index+3]=rgba[3];
  }
 }
 context.putImageData(image,0,0);
}

export default function OperaRasterOverlay({frame,opacity,onStatus}:{frame:OperaRasterFrame;opacity:number;onStatus?:(status:Status,message?:string)=>void}){
 const map=useMap();
 useEffect(()=>{let active=true,raf=0;const pane=map.getPane('overlayPane');if(!pane){onStatus?.('error','Leaflet-Overlayebene nicht verfügbar.');return}
  const canvas=L.DomUtil.create('canvas','mid-opera-raster-canvas',pane) as HTMLCanvasElement;canvas.style.position='absolute';canvas.style.pointerEvents='none';canvas.style.zIndex='355';canvas.style.opacity=String(Math.max(0,Math.min(1,opacity)));onStatus?.('loading');
  let raster:OperaRaster|undefined;const redraw=()=>{if(!active||!raster)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{try{render(map,canvas,raster!);if(active)onStatus?.('ready')}catch(error){if(active)onStatus?.('error',error instanceof Error?error.message:String(error))}})};
  loadOperaRasterData(frame.fileUrl).then(value=>{if(!active)return;raster=value;redraw()}).catch(error=>{if(active)onStatus?.('error',error instanceof Error?error.message:String(error))});map.on('moveend zoomend resize viewreset',redraw);
  return()=>{active=false;cancelAnimationFrame(raf);map.off('moveend zoomend resize viewreset',redraw);canvas.remove()};
 },[frame.fileUrl,map,onStatus]);
 useEffect(()=>{const pane=map.getPane('overlayPane'),canvas=pane?.querySelector('.mid-opera-raster-canvas') as HTMLCanvasElement|null;if(canvas)canvas.style.opacity=String(Math.max(0,Math.min(1,opacity)))},[map,opacity]);
 return null;
}
