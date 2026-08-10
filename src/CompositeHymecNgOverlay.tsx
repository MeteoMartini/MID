import {useEffect,useMemo,useState} from 'react';
import {CanvasOverlay,type MidMap} from './MapLibreCore';
import {hymecNgClassForRaw,hymecNgRasterDiagnostics,hymecNgSourceIndex,loadHymecNgRaster,type HymecNgMeta,type HymecNgRaster} from './CompositeHymecNgSource';

export type HymecNgOverlayStatus='idle'|'loading'|'ready'|'error';
function drawRaster(map:MidMap,canvas:HTMLCanvasElement,raster:HymecNgRaster){
 const box=map.getContainer().getBoundingClientRect(),cssWidth=Math.max(1,Math.round(box.width)),cssHeight=Math.max(1,Math.round(box.height)),memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches,step=coarse||memory<=4||cssWidth*cssHeight>260000?2:1,ratio=Math.min(1.35,window.devicePixelRatio||1),width=Math.max(1,Math.round(cssWidth/step*ratio)),height=Math.max(1,Math.round(cssHeight/step*ratio));
 canvas.width=width;canvas.height=height;canvas.style.width=`${cssWidth}px`;canvas.style.height=`${cssHeight}px`;const context=canvas.getContext('2d',{alpha:true});if(!context)return;const image=context.createImageData(width,height),pixels=image.data,scaleX=cssWidth/width,scaleY=cssHeight/height;
 for(let y=0;y<height;y++){for(let x=0;x<width;x++){const ll=map.unproject([(x+.5)*scaleX,(y+.5)*scaleY]),index=hymecNgSourceIndex(raster,ll.lat,ll.lng);if(index===null)continue;const classification=hymecNgClassForRaw(Number(raster.values[index]),raster),rgba=classification.rgba;if(rgba[3]<=0)continue;const pixel=(y*width+x)*4;pixels[pixel]=rgba[0];pixels[pixel+1]=rgba[1];pixels[pixel+2]=rgba[2];pixels[pixel+3]=rgba[3]}}
 context.putImageData(image,0,0);
}
export default function CompositeHymecNgOverlay({meta,opacity=.88,onStatus}:{meta:HymecNgMeta;opacity?:number;onStatus?:(status:HymecNgOverlayStatus,message?:string)=>void}){
 const[raster,setRaster]=useState<HymecNgRaster|null>(null);
 useEffect(()=>{let active=true;setRaster(null);onStatus?.('loading');void loadHymecNgRaster(meta).then(value=>{if(!active)return;const diagnostics=hymecNgRasterDiagnostics(value);if(diagnostics.unknown>=20&&diagnostics.knownPrecipitation===0)throw new Error(`HymecNG-Klassencodierung nicht plausibel (${diagnostics.unknown} unbekannte Stichproben).`);if(diagnostics.unknownShare>.72&&diagnostics.unknown>diagnostics.knownPrecipitation*2)throw new Error(`HymecNG-Klassencodierung überwiegend unbekannt (${Math.round(diagnostics.unknownShare*100)} %).`);setRaster(value);onStatus?.('ready',diagnostics.knownPrecipitation>0?`DWD HymecNG · ${value.width}×${value.height} · ${Math.round(value.xScale)} m · klassifizierte Niederschlagsflächen vorhanden`:`DWD HymecNG · ${value.width}×${value.height} · aktuell keine klassifizierten Niederschlagsflächen`) }).catch(error=>{if(active)onStatus?.('error',error instanceof Error?error.message:String(error))});return()=>{active=false}},[meta.fileUrl,meta.observedAt,onStatus]);
 const render=useMemo(()=>raster?(map:MidMap,canvas:HTMLCanvasElement)=>drawRaster(map,canvas,raster):null,[raster]);
 return render?<CanvasOverlay id="composite-hymecng-raster" opacity={opacity} zIndex={450} render={render}/>:null;
}
