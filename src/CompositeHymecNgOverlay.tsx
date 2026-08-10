import {useEffect,useRef} from 'react';
import {GridLayer as LeafletGridLayer,type Coords} from 'leaflet';
import {useMap} from 'react-leaflet';
import {hymecNgClassForRaw,loadHymecNgRaster,type HymecNgMeta,type HymecNgRaster} from './CompositeHymecNgSource';
import {projectWgs84} from './radarProjection';

export type HymecNgOverlayStatus='idle'|'loading'|'ready'|'error';
type RasterGridLayer=LeafletGridLayer&{createTile:(coords:Coords,done:(error:Error|undefined,tile:HTMLElement)=>void)=>HTMLElement};

function paintPixel(pixels:Uint8ClampedArray,pixel:number,raw:number,raster:HymecNgRaster,opacity:number){
 const classification=hymecNgClassForRaw(raw,raster),rgba=classification.rgba,alpha=Math.round(rgba[3]*Math.max(0,Math.min(1,opacity)));
 pixels[pixel]=rgba[0];pixels[pixel+1]=rgba[1];pixels[pixel+2]=rgba[2];pixels[pixel+3]=alpha;
}
function renderTile(canvas:HTMLCanvasElement,coords:Coords,raster:HymecNgRaster,opacity:number){
 const size=256,context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Canvas nicht verfügbar.');
 const image=context.createImageData(size,size),pixels=image.data,worldSize=size*Math.pow(2,coords.z),startX=coords.x*size,startY=coords.y*size,longitudes=new Float64Array(size);
 for(let tileX=0;tileX<size;tileX++){
  const worldX=startX+tileX+.5;
  longitudes[tileX]=worldX/worldSize*360-180;
 }
 for(let tileY=0;tileY<size;tileY++){
  const worldY=startY+tileY+.5,latitude=Math.atan(Math.sinh(Math.PI*(1-2*worldY/worldSize)))*180/Math.PI;
  for(let tileX=0;tileX<size;tileX++){
   const projected=projectWgs84(latitude,longitudes[tileX],raster.projection);if(!projected)continue;
   const sourceX=Math.floor((projected[0]-raster.minX)/raster.xScale),sourceY=Math.floor((raster.maxY-projected[1])/raster.yScale);
   if(sourceX<0||sourceX>=raster.width||sourceY<0||sourceY>=raster.height)continue;
   const raw=Number(raster.values[sourceY*raster.width+sourceX]),pixel=(tileY*size+tileX)*4;paintPixel(pixels,pixel,raw,raster,opacity);
  }
 }
 context.putImageData(image,0,0);
}
function createLayer(raster:HymecNgRaster,opacity:number):LeafletGridLayer{
 const layer=new LeafletGridLayer({tileSize:256,opacity:1,zIndex:430,noWrap:true,bounds:raster.bounds,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:2,className:'mid-hymecng-grid'}) as RasterGridLayer;
 layer.createTile=(coords,done)=>{
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.setAttribute('role','presentation');
  const render=()=>{try{renderTile(canvas,coords,raster,opacity);done(undefined,canvas)}catch(error){done(error instanceof Error?error:new Error(String(error)),canvas)}};
  const idle=(window as Window&{requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;
  if(idle)idle(render,{timeout:80});else window.setTimeout(render,0);
  return canvas;
 };
 return layer;
}

export default function HymecNgOverlay({meta,opacity=.88,onStatus}:{meta:HymecNgMeta;opacity?:number;onStatus?:(status:HymecNgOverlayStatus,message?:string)=>void}){
 const map=useMap(),layerRef=useRef<LeafletGridLayer|null>(null);
 useEffect(()=>{
  let alive=true,layer:LeafletGridLayer|null=null;onStatus?.('loading');
  void loadHymecNgRaster(meta).then(raster=>{if(!alive)return;layer=createLayer(raster,opacity);layer.addTo(map);layerRef.current=layer;onStatus?.('ready',`DWD HymecNG · ${raster.width}×${raster.height} · ${Math.round(raster.xScale)} m`) }).catch(error=>{if(alive)onStatus?.('error',error instanceof Error?error.message:String(error))});
  return()=>{alive=false;if(layer){map.removeLayer(layer);if(layerRef.current===layer)layerRef.current=null}}
 },[map,meta.fileUrl,opacity,onStatus]);
 return null;
}
