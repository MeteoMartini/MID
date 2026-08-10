import {useEffect,useMemo,useState} from 'react';
import {CanvasOverlay,ImageQuadLayer,type MidMap} from './MapLibreCore';
import type {Px250Meta} from './Px250Source';
import {inverseProjectedPoint,projectionFromDefinition,stereographicRadius,type RadarProjection} from './radarProjection';

type Status='idle'|'loading'|'ready'|'error';
type Bounds=[[number,number],[number,number]];
type OverlayState={url:string;bounds:Bounds};
type H5Node={value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>};
type H5File={get(path:string):H5Node};
type DatasetSelection={node:H5Node;path:string;what?:H5Node;quantity:string};
type ProjectedRaster={
 projection:RadarProjection;
 width:number;
 height:number;
 xScale:number;
 yScale:number;
 values:ArrayLike<number>;
 gain:number;
 offset:number;
 nodata:number;
 undetect:number;
 isRate:boolean;
 bounds:Bounds;
 colourLookup:Uint8ClampedArray;
 colourLookupMax:number;
};

function text(value:unknown):string{
 if(typeof value==='string')return value.replace(/\0/g,'').trim();
 if(value instanceof Uint8Array)return new TextDecoder().decode(value).replace(/\0/g,'').trim();
 if(ArrayBuffer.isView(value)){const view=value as unknown as ArrayLike<number>;return Array.from({length:view.length},(_,i)=>String.fromCharCode(Number(view[i])||0)).join('').replace(/\0/g,'').trim()}
 if(Array.isArray(value)&&value.every(x=>typeof x==='number'))return String.fromCharCode(...value).replace(/\0/g,'').trim();
 return String(value??'').replace(/\0/g,'').trim();
}
function scalar(value:unknown):number|undefined{
 if(ArrayBuffer.isView(value)){const v=value as unknown as ArrayLike<number>;value=v.length?v[0]:undefined}
 else if(Array.isArray(value))value=value[0];
 const n=Number(value);return Number.isFinite(n)?n:undefined;
}
function attr(node:H5Node|undefined,...names:string[]):unknown{
 const attrs=node?.attrs??{};for(const name of names){if(name in attrs)return attrs[name];const found=Object.keys(attrs).find(k=>k.toLowerCase()===name.toLowerCase());if(found)return attrs[found]}return undefined;
}
function safeGet(file:H5File,path:string){try{return file.get(path)}catch{return undefined}}
function projectionFrom(where:H5Node|undefined):RadarProjection|null{return projectionFromDefinition(text(attr(where,'projdef','projection_definition','proj4')))}
function inverseProjected(x:number,y:number,projection:RadarProjection):[number,number]|null{return inverseProjectedPoint(x,y,projection)}
function projectedBounds(file:H5File,dataset:H5Node):Bounds|null{
 const where=['where','dataset1/where','dataset1/data1/where','dataset1/data2/where','dataset2/where'].map(path=>safeGet(file,path)).find(Boolean),projection=projectionFrom(where),shape=dataset.shape??[],height=Number(shape[0]),width=Number(shape[1]);
 if(!projection||!width||!height)return null;
 const xScale=Math.abs(scalar(attr(where,'xscale','x_scale'))??250),yScale=Math.abs(scalar(attr(where,'yscale','y_scale'))??250),llX=scalar(attr(where,'LL_x','ll_x')),ulX=scalar(attr(where,'UL_x','ul_x')),urX=scalar(attr(where,'UR_x','ur_x')),llY=scalar(attr(where,'LL_y','ll_y')),ulY=scalar(attr(where,'UL_y','ul_y')),urY=scalar(attr(where,'UR_y','ur_y'));
 const minX=llX??ulX??(urX!==undefined?urX-width*xScale:-xScale/2),maxY=urY??ulY??(llY!==undefined?llY+height*yScale:yScale/2),maxX=minX+width*xScale,minY=maxY-height*yScale;
 const corners=[[minX,maxY],[maxX,maxY],[minX,minY],[maxX,minY]].map(([x,y])=>inverseProjected(x,y,projection)).filter((value):value is [number,number]=>Boolean(value&&Number.isFinite(value[0])&&Number.isFinite(value[1])));
 if(corners.length!==4)return null;
 const lats=corners.map(row=>row[0]),lons=corners.map(row=>row[1]),south=Math.min(...lats),north=Math.max(...lats),west=Math.min(...lons),east=Math.max(...lons);
 if(north-south<=0||east-west<=0||north-south>30||east-west>45)return null;
 return[[south,west],[north,east]];
}
function approximateBounds(lat:number,lon:number,rangeKm:number):Bounds{if(!Number.isFinite(lat)||!Number.isFinite(lon))return[[46.55,4.2],[55.95,15.95]];const dy=rangeKm/111.32,dx=rangeKm/(111.32*Math.max(.25,Math.cos(lat*Math.PI/180)));return[[lat-dy,lon-dx],[lat+dy,lon+dx]]}
function geographicBounds(where:H5Node|undefined):Bounds|null{
 const points=[
  [scalar(attr(where,'LL_lat','ll_lat')),scalar(attr(where,'LL_lon','ll_lon'))],
  [scalar(attr(where,'LR_lat','lr_lat')),scalar(attr(where,'LR_lon','lr_lon'))],
  [scalar(attr(where,'UL_lat','ul_lat')),scalar(attr(where,'UL_lon','ul_lon'))],
  [scalar(attr(where,'UR_lat','ur_lat')),scalar(attr(where,'UR_lon','ur_lon'))],
 ].filter((point):point is [number,number]=>Number.isFinite(point[0])&&Number.isFinite(point[1]));
 if(points.length<2)return null;
 const lats=points.map(point=>point[0]),lons=points.map(point=>point[1]);
 return[[Math.min(...lats),Math.min(...lons)],[Math.max(...lats),Math.max(...lons)]];
}
function boundsFromFile(file:H5File,meta:Px250Meta,dataset:H5Node):Bounds{
 const nodes=['where','dataset1/where','dataset1/data1/where','dataset1/data2/where','dataset2/where'].map(path=>safeGet(file,path)).filter(Boolean) as H5Node[],readBounds=(where:H5Node|undefined)=>{const llLat=scalar(attr(where,'LL_lat','ll_lat')),llLon=scalar(attr(where,'LL_lon','ll_lon')),urLat=scalar(attr(where,'UR_lat','ur_lat')),urLon=scalar(attr(where,'UR_lon','ur_lon')),ulLat=scalar(attr(where,'UL_lat','ul_lat')),ulLon=scalar(attr(where,'UL_lon','ul_lon')),lrLat=scalar(attr(where,'LR_lat','lr_lat')),lrLon=scalar(attr(where,'LR_lon','lr_lon')),south=scalar(attr(where,'south','min_lat','lat_min')),west=scalar(attr(where,'west','min_lon','lon_min')),north=scalar(attr(where,'north','max_lat','lat_max')),east=scalar(attr(where,'east','max_lon','lon_max'));if([llLat,llLon,urLat,urLon].every(Number.isFinite))return[[llLat!,llLon!],[urLat!,urLon!]] as Bounds;if([ulLat,ulLon,lrLat,lrLon].every(Number.isFinite))return[[lrLat!,ulLon!],[ulLat!,lrLon!]] as Bounds;if([south,west,north,east].every(Number.isFinite))return[[south!,west!],[north!,east!]] as Bounds;return null};
 for(const node of nodes){const candidate=readBounds(node);if(candidate)return candidate}
 const projected=projectedBounds(file,dataset);if(projected)return projected;
 if(meta.product==='hx')return[[45.68,1.46],[55.87,18.74]];
 return approximateBounds(Number(meta.radarLat),Number(meta.radarLon),Number(meta.rangeKm)||150);
}
function findDataset(file:H5File):DatasetSelection{
 const candidates=[] as DatasetSelection[];
 for(let dataset=1;dataset<=5;dataset++)for(let data=1;data<=6;data++){
  const base=`dataset${dataset}/data${data}`,node=safeGet(file,`${base}/data`),what=safeGet(file,`${base}/what`);
  if(!node?.value||node.shape?.length!==2)continue;
  const quantity=text(attr(what,'quantity')).toUpperCase();candidates.push({node,path:`${base}/data`,what,quantity});
 }
 if(!candidates.length)throw new Error('Kein unterstütztes zweidimensionales Radar-Raster im HDF5 gefunden.');
 const score=(item:DatasetSelection)=>/DBZH|TH|DBZ/.test(item.quantity)?4:/RATE|RR/.test(item.quantity)?3:/VRAD/.test(item.quantity)?-2:1;
 return candidates.sort((a,b)=>score(b)-score(a))[0];
}
function rateColour(rate:number):[number,number,number,number]{if(!Number.isFinite(rate)||rate<.08)return[0,0,0,0];if(rate<.5)return[217,243,255,155];if(rate<1)return[114,201,255,190];if(rate<2.5)return[47,145,227,214];if(rate<5)return[67,200,121,226];if(rate<10)return[240,212,71,238];if(rate<20)return[245,155,61,242];if(rate<50)return[227,75,75,246];return[184,63,200,249]}
function radarRate(raw:number,selection:DatasetSelection){const gain=scalar(attr(selection.what,'gain'))??0.5,offset=scalar(attr(selection.what,'offset'))??-32.5,value=raw*gain+offset;if(/RATE|RR/.test(selection.quantity))return Math.max(0,value);const dbz=value,z=Math.pow(10,dbz/10);return Math.pow(Math.max(0,z/200),1/1.6)}
function rawColour(raw:number,gain:number,offset:number,isRate:boolean,nodata:number,undetect:number):[number,number,number,number]{
 if(!Number.isFinite(raw)||raw===nodata||raw===undetect)return[0,0,0,0];
 const value=raw*gain+offset,rate=isRate?Math.max(0,value):Math.pow(Math.max(0,Math.pow(10,value/10)/200),1/1.6);
 return rateColour(rate);
}
function renderDataset(selection:DatasetSelection):HTMLCanvasElement{
 const dataset=selection.node,shape=dataset.shape??[],height=Number(shape[0]),width=Number(shape[1]),sourcePixels=width*height;
 if(!width||!height||sourcePixels>35_000_000)throw new Error('Ungültige 250-m-Rastergröße.');
 const nodata=scalar(attr(selection.what,'nodata'))??65535,undetect=scalar(attr(selection.what,'undetect'))??0,source=dataset.value as ArrayLike<number>;
 if(!source||source.length<sourcePixels)throw new Error('PX250-Raster ist unvollständig.');
 const memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,maxPixels=memory<=2?3_500_000:memory<=4?6_000_000:10_000_000,scale=Math.min(1,Math.sqrt(maxPixels/sourcePixels)),outWidth=Math.max(1,Math.round(width*scale)),outHeight=Math.max(1,Math.round(height*scale)),canvas=document.createElement('canvas');
 canvas.width=outWidth;canvas.height=outHeight;
 const context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Canvas nicht verfügbar.');
 const image=context.createImageData(outWidth,outHeight),pixels=image.data;let visible=0;
 for(let y=0;y<outHeight;y++)for(let x=0;x<outWidth;x++){
  const sourceX=Math.min(width-1,Math.floor(x/scale)),sourceY=Math.min(height-1,Math.floor(y/scale)),raw=Number(source[sourceY*width+sourceX]);
  const rgba=!Number.isFinite(raw)||raw===nodata||raw===undetect?[0,0,0,0] as [number,number,number,number]:rateColour(radarRate(raw,selection));
  if(rgba[3]>0)visible++;
  const pixel=(y*outWidth+x)*4;pixels[pixel]=rgba[0];pixels[pixel+1]=rgba[1];pixels[pixel+2]=rgba[2];pixels[pixel+3]=rgba[3];
 }
 context.putImageData(image,0,0);if(!visible)console.info('MID PX250: aktuelles Raster enthält im sichtbaren Wertebereich keine Echos.');return canvas;
}
async function canvasBlob(canvas:HTMLCanvasElement){const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(blob)return blob;const response=await fetch(canvas.toDataURL('image/png'));return response.blob()}
function colourLookup(selection:DatasetSelection,nodata:number,undetect:number){
 const gain=scalar(attr(selection.what,'gain'))??0.5,offset=scalar(attr(selection.what,'offset'))??-32.5,isRate=/RATE|RR/.test(selection.quantity),maxCode=Math.max(255,Math.min(65535,Math.ceil(Math.max(nodata,undetect,255)))),lookup=new Uint8ClampedArray((maxCode+1)*4);
 for(let raw=0;raw<=maxCode;raw++){const rgba=rawColour(raw,gain,offset,isRate,nodata,undetect),index=raw*4;lookup[index]=rgba[0];lookup[index+1]=rgba[1];lookup[index+2]=rgba[2];lookup[index+3]=rgba[3]}
 return{gain,offset,isRate,lookup,maxCode};
}
function projectedRaster(file:H5File,selection:DatasetSelection):ProjectedRaster|null{
 const where=safeGet(file,'where'),projection=projectionFrom(where),shape=selection.node.shape??[],height=Number(shape[0]),width=Number(shape[1]),values=selection.node.value as ArrayLike<number>;
 if(!projection||projection.kind!=='stere'||!width||!height||!values||values.length<width*height)return null;
 const xScale=Math.abs(scalar(attr(where,'xscale','x_scale'))??250),yScale=Math.abs(scalar(attr(where,'yscale','y_scale'))??250),xSize=scalar(attr(where,'xsize')),ySize=scalar(attr(where,'ysize'));
 if(Number.isFinite(xSize)&&Math.abs(Number(xSize)-width)>1)throw new Error(`HX-xsize ${xSize} passt nicht zum Raster ${width}.`);
 if(Number.isFinite(ySize)&&Math.abs(Number(ySize)-height)>1)throw new Error(`HX-ysize ${ySize} passt nicht zum Raster ${height}.`);
 const nodata=scalar(attr(selection.what,'nodata'))??65535,undetect=scalar(attr(selection.what,'undetect'))??0,physical=colourLookup(selection,nodata,undetect),bounds=geographicBounds(where)??projectedBounds(file,selection.node)??[[45.68,1.46],[55.87,18.74]];
 return{projection,width,height,xScale,yScale,values,gain:physical.gain,offset:physical.offset,nodata,undetect,isRate:physical.isRate,bounds,colourLookup:physical.lookup,colourLookupMax:physical.maxCode};
}
function paintRaw(pixels:Uint8ClampedArray,pixel:number,raw:number,raster:ProjectedRaster){
 if(Number.isInteger(raw)&&raw>=0&&raw<=raster.colourLookupMax){const index=raw*4;pixels[pixel]=raster.colourLookup[index];pixels[pixel+1]=raster.colourLookup[index+1];pixels[pixel+2]=raster.colourLookup[index+2];pixels[pixel+3]=raster.colourLookup[index+3];return}
 const rgba=rawColour(raw,raster.gain,raster.offset,raster.isRate,raster.nodata,raster.undetect);pixels[pixel]=rgba[0];pixels[pixel+1]=rgba[1];pixels[pixel+2]=rgba[2];pixels[pixel+3]=rgba[3];
}
function renderProjectedViewport(map:MidMap,canvas:HTMLCanvasElement,raster:ProjectedRaster){
 const box=map.getContainer().getBoundingClientRect(),cssWidth=Math.max(1,Math.round(box.width)),cssHeight=Math.max(1,Math.round(box.height)),memory=Number((navigator as Navigator&{deviceMemory?:number}).deviceMemory)||4,coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches,step=coarse||memory<=4||cssWidth*cssHeight>250000?2:1,ratio=Math.min(1.25,window.devicePixelRatio||1),width=Math.max(1,Math.round(cssWidth/step*ratio)),height=Math.max(1,Math.round(cssHeight/step*ratio));
 canvas.width=width;canvas.height=height;canvas.style.width=`${cssWidth}px`;canvas.style.height=`${cssHeight}px`;const context=canvas.getContext('2d',{alpha:true});if(!context)return;const image=context.createImageData(width,height),pixels=image.data,scaleX=cssWidth/width,scaleY=cssHeight/height,longitude0=raster.projection.lon0*Math.PI/180;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const ll=map.unproject([(x+.5)*scaleX,(y+.5)*scaleY]),radius=stereographicRadius(ll.lat,raster.projection);if(radius===null)continue;const delta=ll.lng*Math.PI/180-longitude0,projectedX=raster.projection.x0+radius*Math.sin(delta),projectedY=raster.projection.y0-radius*Math.cos(delta),sourceX=Math.round(projectedX/raster.xScale),sourceY=Math.round(-projectedY/raster.yScale);if(sourceX<0||sourceX>=raster.width||sourceY<0||sourceY>=raster.height)continue;const raw=Number(raster.values[sourceY*raster.width+sourceX]),pixel=(y*width+x)*4;paintRaw(pixels,pixel,raw,raster)}
 context.putImageData(image,0,0);
}

export default function Px250Overlay({meta,opacity,onStatus}:{meta:Px250Meta;opacity:number;onStatus?:(status:Status,message?:string)=>void}){
 const[overlay,setOverlay]=useState<OverlayState|null>(null),[projected,setProjected]=useState<ProjectedRaster|null>(null);
 useEffect(()=>{let alive=true,objectUrl='';setOverlay(null);setProjected(null);onStatus?.('loading');(async()=>{if(!meta.fileUrl)throw new Error(meta.reason||'Keine 250-m-Radardatei verfügbar.');const response=await fetch(meta.fileUrl,{cache:'no-store'});if(!response.ok)throw new Error(`250-m-Radardatei HTTP ${response.status}`);const buffer=await response.arrayBuffer();if(buffer.byteLength<1024)throw new Error('250-m-Radardatei ist unerwartet klein.');const hdf5=await import('jsfive'),file=new hdf5.File(buffer,meta.fileUrl) as unknown as H5File,selection=findDataset(file),dataset=selection.node;if(meta.product==='hx'){const raster=projectedRaster(file,selection);if(!raster)throw new Error('HX-Projektionsmetadaten fehlen oder sind nicht stereografisch.');if(!alive)return;setProjected(raster);onStatus?.('ready',`${selection.quantity||'Radar'} · projektionstreu via MapLibre · ${raster.width}×${raster.height}`);return}const canvas=renderDataset(selection),blob=await canvasBlob(canvas);if(!alive)return;objectUrl=URL.createObjectURL(blob);setOverlay({url:objectUrl,bounds:boundsFromFile(file,meta,dataset)});onStatus?.('ready',`${selection.quantity||'Radar'} → äquivalente Regenrate · ${selection.node.shape?.join('×')||'Raster'}`)})().catch(error=>{if(alive)onStatus?.('error',error instanceof Error?error.message:String(error))});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[meta.fileUrl,meta.reason,meta.radarLat,meta.radarLon,meta.rangeKm,meta.product,onStatus]);
 const draw=useMemo(()=>projected?(map:MidMap,canvas:HTMLCanvasElement)=>renderProjectedViewport(map,canvas,projected):null,[projected]);
 if(draw)return <CanvasOverlay id="px250-projected" opacity={opacity} zIndex={430} render={draw}/>;return overlay?<ImageQuadLayer id="px250-image" url={overlay.url} bounds={overlay.bounds} opacity={opacity} zIndex={430}/>:null;
}
