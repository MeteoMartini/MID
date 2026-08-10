import {useEffect,useMemo,useState} from 'react';
import {CanvasOverlay,type MidMap} from './MapLibreCore';
import {hymecNgClassForRaw,hymecNgSourceIndex,loadHymecNgRaster,type HymecNgMeta,type HymecNgRaster} from './HymecNgSource';

export type HymecNgOverlayStatus='idle'|'loading'|'ready'|'error';
function drawRaster(map:MidMap,canvas:HTMLCanvasElement,raster:HymecNgRaster,opacity:number){
 const box=map.getContainer().getBoundingClientRect(),cssWidth=Math.max(1,Math.round(box.width)),cssHeight=Math.max(1,Math.round(box.height)),memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches,step=coarse||memory<=4||cssWidth*cssHeight>260000?2:1,ratio=Math.min(1.35,window.devicePixelRatio||1),width=Math.max(1,Math.round(cssWidth/step*ratio)),height=Math.max(1,Math.round(cssHeight/step*ratio));
 canvas.width=width;canvas.height=height;canvas.style.width=`${cssWidth}px`;canvas.style.height=`${cssHeight}px`;const context=canvas.getContext('2d',{alpha:true});if(!context)return;const image=context.createImageData(width,height),pixels=image.data,scaleX=cssWidth/width,scaleY=cssHeight/height,alphaScale=Math.max(0,Math.min(1,opacity));
 for(let y=0;y<height;y++){for(let x=0;x<width;x++){const ll=map.unproject([(x+.5)*scaleX,(y+.5)*scaleY]),index=hymecNgSourceIndex(raster,ll.lat,ll.lng);if(index===null)continue;const classification=hymecNgClassForRaw(Number(raster.values[index]),raster),rgba=classification.rgba;if(rgba[3]<=0)continue;const pixel=(y*width+x)*4;pixels[pixel]=rgba[0];pixels[pixel+1]=rgba[1];pixels[pixel+2]=rgba[2];pixels[pixel+3]=Math.round(rgba[3]*alphaScale)}}
 context.putImageData(image,0,0);
}
export default function HymecNgOverlay({meta,opacity=.88,onStatus}:{meta:HymecNgMeta;opacity?:number;onStatus?:(status:HymecNgOverlayStatus,message?:string)=>void}){
 const[raster,setRaster]=useState<HymecNgRaster|null>(null);
 useEffect(()=>{let active=true;setRaster(null);onStatus?.('loading');void loadHymecNgRaster(meta).then(value=>{if(!active)return;setRaster(value);onStatus?.('ready',`DWD HymecNG · ${value.width}×${value.height} · ${Math.round(value.xScale)} m · Radar-Niederschlagsart`) }).catch(error=>{if(active)onStatus?.('error',error instanceof Error?error.message:String(error))});return()=>{active=false}},[meta.fileUrl,meta.observedAt,onStatus]);
 const render=useMemo(()=>raster?(map:MidMap,canvas:HTMLCanvasElement)=>drawRaster(map,canvas,raster,1):null,[raster]);
 return render?<CanvasOverlay id="hymecng-raster" opacity={opacity} zIndex={450} render={render}/>:null;
}
