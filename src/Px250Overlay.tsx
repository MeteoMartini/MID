import {useEffect,useState} from 'react';
import {ImageOverlay} from 'react-leaflet';
import type {LatLngBoundsExpression} from 'leaflet';
import type {Px250Meta} from './Px250Source';

type Status='idle'|'loading'|'ready'|'error';
type OverlayState={url:string;bounds:LatLngBoundsExpression};
type H5Node={value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>};

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
function colour(dbz:number):[number,number,number,number]{
 if(!Number.isFinite(dbz)||dbz<5)return[0,0,0,0];
 if(dbz<10)return[217,243,255,145];if(dbz<20)return[114,201,255,180];if(dbz<30)return[47,145,227,205];if(dbz<40)return[67,200,121,220];if(dbz<50)return[240,212,71,232];if(dbz<55)return[245,155,61,238];if(dbz<60)return[227,75,75,242];return[184,63,200,245];
}
function approximateBounds(lat:number,lon:number,rangeKm:number):LatLngBoundsExpression{
 const dy=rangeKm/111.32,dx=rangeKm/(111.32*Math.max(.25,Math.cos(lat*Math.PI/180)));return[[lat-dy,lon-dx],[lat+dy,lon+dx]];
}
function boundsFromFile(file:{get(path:string):H5Node},meta:Px250Meta):LatLngBoundsExpression{
 const where=file.get('where'),llLat=scalar(attr(where,'LL_lat','ll_lat')),llLon=scalar(attr(where,'LL_lon','ll_lon')),urLat=scalar(attr(where,'UR_lat','ur_lat')),urLon=scalar(attr(where,'UR_lon','ur_lon')),ulLat=scalar(attr(where,'UL_lat','ul_lat')),ulLon=scalar(attr(where,'UL_lon','ul_lon')),lrLat=scalar(attr(where,'LR_lat','lr_lat')),lrLon=scalar(attr(where,'LR_lon','lr_lon'));
 if([llLat,llLon,urLat,urLon].every(Number.isFinite))return[[llLat!,llLon!],[urLat!,urLon!]];
 if([ulLat,ulLon,lrLat,lrLon].every(Number.isFinite))return[[lrLat!,ulLon!],[ulLat!,lrLon!]];
 return approximateBounds(Number(meta.radarLat),Number(meta.radarLon),Number(meta.rangeKm)||150);
}
function findDataset(file:{get(path:string):H5Node}):H5Node{
 for(const path of['dataset1/data1/data','dataset1/data2/data','dataset2/data1/data']){try{const node=file.get(path);if(node?.value&&node?.shape?.length===2)return node}catch{}}
 throw new Error('Kein unterstütztes Reflektivitätsraster im HDF5 gefunden.');
}
function renderDataset(file:{get(path:string):H5Node},dataset:H5Node):HTMLCanvasElement{
 const shape=dataset.shape??[],height=Number(shape[0]),width=Number(shape[1]);if(!width||!height||width*height>12_000_000)throw new Error('Ungültige PX250-Rastergröße.');
 const what=(()=>{for(const path of['dataset1/data1/what','dataset1/data2/what','dataset2/data1/what']){try{const n=file.get(path);if(n)return n}catch{}}return undefined})(),gain=scalar(attr(what,'gain'))??0.5,offset=scalar(attr(what,'offset'))??-32.5,nodata=scalar(attr(what,'nodata'))??65535,undetect=scalar(attr(what,'undetect'))??0,quantity=text(attr(what,'quantity')).toUpperCase();
 const source=dataset.value as ArrayLike<number>;if(!source||source.length<width*height)throw new Error('PX250-Raster ist unvollständig.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Canvas nicht verfügbar.');const image=context.createImageData(width,height),pixels=image.data;
 for(let i=0;i<width*height;i++){const raw=Number(source[i]);let rgba:[number,number,number,number];if(!Number.isFinite(raw)||raw===nodata||raw===undetect)rgba=[0,0,0,0];else{const value=raw*gain+offset;rgba=colour(quantity.includes('RATE')?10*Math.log10(Math.max(.01,value)*200):value)}const p=i*4;pixels[p]=rgba[0];pixels[p+1]=rgba[1];pixels[p+2]=rgba[2];pixels[p+3]=rgba[3]}
 context.putImageData(image,0,0);return canvas;
}
export default function Px250Overlay({meta,opacity,onStatus}:{meta:Px250Meta;opacity:number;onStatus?:(status:Status,message?:string)=>void}){
 const[overlay,setOverlay]=useState<OverlayState|null>(null);
 useEffect(()=>{let alive=true,objectUrl='';setOverlay(null);onStatus?.('loading');(async()=>{if(!meta.fileUrl)throw new Error(meta.reason||'Keine PX250-Datei verfügbar.');const response=await fetch(meta.fileUrl,{cache:'no-store'});if(!response.ok)throw new Error(`PX250-Datei HTTP ${response.status}`);const buffer=await response.arrayBuffer();const hdf5=await import('jsfive');const file=new hdf5.File(buffer,meta.fileUrl);const dataset=findDataset(file);const canvas=renderDataset(file,dataset);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PX250-PNG konnte nicht erzeugt werden.')),'image/png'));if(!alive)return;objectUrl=URL.createObjectURL(blob);setOverlay({url:objectUrl,bounds:boundsFromFile(file,meta)});onStatus?.('ready')})().catch(error=>{if(alive)onStatus?.('error',error instanceof Error?error.message:String(error))});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[meta.fileUrl,meta.reason,meta.radarLat,meta.radarLon,meta.rangeKm,onStatus]);
 return overlay?<ImageOverlay url={overlay.url} bounds={overlay.bounds} opacity={opacity} zIndex={390}/>:null;
}
