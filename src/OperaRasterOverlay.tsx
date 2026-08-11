import {useEffect,useMemo,useState} from 'react';
import {CanvasOverlay,type MidMap} from './MapLibreCore';
import type {OperaRasterFrame} from './CompositeData';
import {loadOperaRasterData,operaRasterPoint,type OperaRaster} from './OperaRasterSource';
import {getProjectedCanvas,projectedViewportCacheKey,setProjectedCanvas} from './projectedCanvasCache';
import {radarDbzColor,type RadarColorTableId} from './radarColorTables';

type Status='idle'|'loading'|'ready'|'error';
function colour(dbz:number,colorTable:RadarColorTableId):[number,number,number,number]{return radarDbzColor(dbz,colorTable)}
function renderRaster(map:MidMap,canvas:HTMLCanvasElement,raster:OperaRaster,frameKey:string,colorTable:RadarColorTableId){
 const box=map.getContainer().getBoundingClientRect(),cssWidth=Math.max(1,Math.round(box.width)),cssHeight=Math.max(1,Math.round(box.height)),memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,pixelCount=cssWidth*cssHeight,coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches,step=coarse||memory<=4||pixelCount>220000?2:1,ratio=Math.min(1.25,window.devicePixelRatio||1),renderWidth=Math.max(1,Math.round(Math.ceil(cssWidth/step)*ratio)),renderHeight=Math.max(1,Math.round(Math.ceil(cssHeight/step)*ratio));
 canvas.width=renderWidth;canvas.height=renderHeight;canvas.style.width=`${cssWidth}px`;canvas.style.height=`${cssHeight}px`;const context=canvas.getContext('2d',{alpha:true});if(!context)return;const bounds=map.getBounds(),cacheKey=projectedViewportCacheKey({frame:`${frameKey}:${colorTable}`,zoom:map.getZoom(),bounds:{south:bounds.getSouth(),west:bounds.getWest(),north:bounds.getNorth(),east:bounds.getEast()},width:cssWidth,height:cssHeight,renderWidth,renderHeight}),cached=getProjectedCanvas(cacheKey);if(cached){context.clearRect(0,0,renderWidth,renderHeight);context.drawImage(cached,0,0);return}
 const image=context.createImageData(renderWidth,renderHeight),pixels=image.data,scaleX=cssWidth/renderWidth,scaleY=cssHeight/renderHeight;for(let y=0;y<renderHeight;y++){for(let x=0;x<renderWidth;x++){const ll=map.unproject([(x+.5)*scaleX,(y+.5)*scaleY]),point=operaRasterPoint(raster,ll.lat,ll.lng),rgba=point.dbz===undefined?[0,0,0,0] as [number,number,number,number]:colour(point.dbz,colorTable),index=(y*renderWidth+x)*4;pixels[index]=rgba[0];pixels[index+1]=rgba[1];pixels[index+2]=rgba[2];pixels[index+3]=rgba[3]}}context.putImageData(image,0,0);setProjectedCanvas(cacheKey,canvas);
}
export default function OperaRasterOverlay({frame,opacity,colorTable='dwd-standard',onStatus}:{frame:OperaRasterFrame;opacity:number;colorTable?:RadarColorTableId;onStatus?:(status:Status,message?:string)=>void}){
 const[raster,setRaster]=useState<OperaRaster|null>(null);useEffect(()=>{let active=true;setRaster(null);onStatus?.('loading');void loadOperaRasterData(frame.fileUrl).then(value=>{if(!active)return;setRaster(value);onStatus?.('ready')}).catch(error=>{if(active)onStatus?.('error',error instanceof Error?error.message:String(error))});return()=>{active=false}},[frame.fileUrl,onStatus]);const draw=useMemo(()=>raster?(map:MidMap,canvas:HTMLCanvasElement)=>renderRaster(map,canvas,raster,frame.fileUrl,colorTable):null,[raster,frame.fileUrl,colorTable]);return draw?<CanvasOverlay id="opera-raster" opacity={opacity} zIndex={355} render={draw}/>:null;
}
