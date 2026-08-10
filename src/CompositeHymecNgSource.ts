import type {LatLngBoundsExpression} from 'leaflet';
import {fetchWorkerJson} from './workerClient';
import {inverseProjectedPoint,projectWgs84,projectionFromDefinition,type RadarProjection} from './radarProjection';

export type HymecNgMeta={
 available:boolean;
 product?:'HymecNG';
 productName?:string;
 observedAt?:string;
 publishedAt?:string;
 fileUrl?:string;
 filename?:string;
 nativeResolutionM?:number;
 grid?:string;
 georeferencing?:string;
 provider?:string;
 license?:string;
 classificationVerified?:boolean;
 classificationNote?:string;
 ageMinutes?:number;
 fresh?:boolean;
 sourceRoot?:string;
 error?:string;
 reason?:string;
};

export type HymecNgClass={code:number;label:string;color:string;rgba:[number,number,number,number]};
export type HymecNgSample={label:string;color:string;code:number|null;latitude:number;longitude:number;observedAt?:string;inside:boolean};

type H5Node={value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>};
type H5File={get(path:string):H5Node};
type DatasetSelection={node:H5Node;what?:H5Node;quantity:string};
export type HymecNgRaster={
 projection:RadarProjection;
 width:number;
 height:number;
 xScale:number;
 yScale:number;
 minX:number;
 maxY:number;
 values:ArrayLike<number>;
 gain:number;
 offset:number;
 nodata:number;
 undetect:number;
 observedAt?:string;
 classificationVerified:boolean;
 bounds:LatLngBoundsExpression;
};

const hexToRgba=(hex:string,alpha=1):[number,number,number,number]=>{
 const value=hex.replace('#',''),full=value.length===3?value.split('').map(item=>item+item).join(''):value;
 return [parseInt(full.slice(0,2),16),parseInt(full.slice(2,4),16),parseInt(full.slice(4,6),16),alpha];
};

// DWD führt für HymecNG bzw. das Vorgängerprodukt HG 11 Niederschlagsklassen.
// MID bildet die aktuelle amtliche Klassensuite in derselben Reihenfolge ab, in der sie
// im offiziellen DWD-Produkt und in den MID-Quellfarben verwendet wird.
export const HYMEC_NG_CLASSES:HymecNgClass[]=[
 {code:1,label:'großer Hagel',color:'#b000d6',rgba:hexToRgba('#b000d6')},
 {code:2,label:'kleiner Hagel',color:'#d000f5',rgba:hexToRgba('#d000f5')},
 {code:3,label:'Graupel',color:'#ffd633',rgba:hexToRgba('#ffd633')},
 {code:4,label:'gefrierender Regen',color:'#ff1c00',rgba:hexToRgba('#ff1c00')},
 {code:5,label:'gefr. Sprühregen',color:'#d80000',rgba:hexToRgba('#d80000')},
 {code:6,label:'Schnee',color:'#ff21d1',rgba:hexToRgba('#ff21d1')},
 {code:7,label:'Schneeregen',color:'#ff70df',rgba:hexToRgba('#ff70df')},
 {code:8,label:'Regen',color:'#00c778',rgba:hexToRgba('#00c778')},
 {code:9,label:'Sprühregen',color:'#19dca4',rgba:hexToRgba('#19dca4')},
 {code:10,label:'nicht klassifizierbar',color:'#7f7f7f',rgba:hexToRgba('#7f7f7f',.92)},
 {code:0,label:'kein Niederschlag',color:'#c9c9c9',rgba:[0,0,0,0]}
];
export const HYMEC_NG_CLASS_LEGEND=HYMEC_NG_CLASSES.map(item=>({label:item.label,color:item.color,code:item.code}));
const HYMEC_NG_CLASS_BY_CODE=new Map<number,HymecNgClass>(HYMEC_NG_CLASSES.map(item=>[item.code,item]));
const UNKNOWN_CLASS:HymecNgClass={code:-1,label:'unbekannte HymecNG-Klasse',color:'#7f7f7f',rgba:[0,0,0,0]};
const rasterCache=new Map<string,Promise<HymecNgRaster>>();

function text(value:unknown):string{
 if(typeof value==='string')return value.replace(/\0/g,'').trim();
 if(value instanceof Uint8Array)return new TextDecoder().decode(value).replace(/\0/g,'').trim();
 if(ArrayBuffer.isView(value)){const view=value as unknown as ArrayLike<number>;return Array.from({length:view.length},(_,index)=>String.fromCharCode(Number(view[index])||0)).join('').replace(/\0/g,'').trim()}
 if(Array.isArray(value)&&value.every(item=>typeof item==='number'))return String.fromCharCode(...value).replace(/\0/g,'').trim();
 return String(value??'').replace(/\0/g,'').trim();
}
function scalar(value:unknown):number|undefined{
 if(ArrayBuffer.isView(value)){const view=value as unknown as ArrayLike<number>;value=view.length?view[0]:undefined}
 else if(Array.isArray(value))value=value[0];
 const result=Number(value);return Number.isFinite(result)?result:undefined;
}
function attr(node:H5Node|undefined,...names:string[]):unknown{
 const attrs=node?.attrs??{};
 for(const name of names){if(name in attrs)return attrs[name];const found=Object.keys(attrs).find(key=>key.toLowerCase()===name.toLowerCase());if(found)return attrs[found]}
 return undefined;
}
function safeGet(file:H5File,path:string){try{return file.get(path)}catch{return undefined}}
function findDataset(file:H5File):DatasetSelection{
 const candidates:DatasetSelection[]=[];
 for(let dataset=1;dataset<=4;dataset++)for(let data=1;data<=4;data++){
  const base=`dataset${dataset}/data${data}`,node=safeGet(file,`${base}/data`),what=safeGet(file,`${base}/what`);
  if(!node?.value||node.shape?.length!==2)continue;
  const quantity=text(attr(what,'quantity')).toUpperCase();
  candidates.push({node,what,quantity});
 }
 if(!candidates.length){const root=safeGet(file,'data');if(root?.value&&root.shape?.length===2)candidates.push({node:root,what:safeGet(file,'what'),quantity:text(attr(safeGet(file,'what'),'quantity')).toUpperCase()})}
 if(!candidates.length)throw new Error('HymecNG enthält kein unterstütztes zweidimensionales Raster.');
 const score=(candidate:DatasetSelection)=>/HCLASS|HYMEC|CLASS|HG/.test(candidate.quantity)?10:/RATE|DBZH|TH/.test(candidate.quantity)?-5:1;
 return candidates.sort((a,b)=>score(b)-score(a))[0];
}
function projectionFromFile(file:H5File):{where:H5Node;projection:RadarProjection}{
 const where=['where','dataset1/where','dataset1/data1/where'].map(path=>safeGet(file,path)).find(Boolean);
 if(!where)throw new Error('HymecNG-Georeferenzierung fehlt (where).');
 const raw=text(attr(where,'projdef','projection_definition','proj4'));
 if(!raw)throw new Error('HymecNG enthält keine explizite ODIM-Projektionsdefinition; MID verwendet keinen Legacy-/Kugel-Fallback.');
 const projection=projectionFromDefinition(raw);
 if(!projection)throw new Error(`HymecNG-Projektion wird nicht unterstützt: ${raw}`);
 return{where,projection};
}
function projectedCorner(where:H5Node,projection:RadarProjection,name:'UL'|'UR'|'LL'|'LR'):[number,number]|null{
 const x=scalar(attr(where,`${name}_x`,`${name.toLowerCase()}_x`)),y=scalar(attr(where,`${name}_y`,`${name.toLowerCase()}_y`));
 if(Number.isFinite(x)&&Number.isFinite(y))return[x!,y!];
 const lat=scalar(attr(where,`${name}_lat`,`${name.toLowerCase()}_lat`)),lon=scalar(attr(where,`${name}_lon`,`${name.toLowerCase()}_lon`));
 return Number.isFinite(lat)&&Number.isFinite(lon)?projectWgs84(lat!,lon!,projection):null;
}
function rasterGeometry(file:H5File,selection:DatasetSelection,observedAt:string|undefined,classificationVerified:boolean):HymecNgRaster{
 const {where,projection}=projectionFromFile(file),shape=selection.node.shape??[],height=Number(shape[0]),width=Number(shape[1]),values=selection.node.value as ArrayLike<number>;
 if(!width||!height||!values||values.length<width*height)throw new Error('HymecNG-Raster ist unvollständig.');
 const xScale=Math.abs(scalar(attr(where,'xscale','x_scale'))??1000),yScale=Math.abs(scalar(attr(where,'yscale','y_scale'))??1000),ul=projectedCorner(where,projection,'UL'),ur=projectedCorner(where,projection,'UR'),ll=projectedCorner(where,projection,'LL');
 let minX=ul?.[0]??ll?.[0],maxY=ul?.[1]??ur?.[1];
 if(!Number.isFinite(minX)&&Number.isFinite(ur?.[0]))minX=ur![0]-width*xScale;
 if(!Number.isFinite(maxY)&&Number.isFinite(ll?.[1]))maxY=ll![1]+height*yScale;
 if(!Number.isFinite(minX)||!Number.isFinite(maxY))throw new Error('HymecNG-Rasterursprung konnte nicht aus den ODIM-Koordinaten bestimmt werden.');
 const maxX=minX!+width*xScale,minY=maxY!-height*yScale,corners:[[number,number],[number,number],[number,number],[number,number]]=[[minX!,maxY!],[maxX,maxY!],[minX!,minY],[maxX,minY]],geo=corners.map(([x,y])=>inverseProjectedPoint(x,y,projection)).filter((point):point is [number,number]=>Boolean(point&&Number.isFinite(point[0])&&Number.isFinite(point[1])));
 if(geo.length!==4)throw new Error('HymecNG-Rastergrenzen konnten nicht nach WGS84 transformiert werden.');
 const lats=geo.map(point=>point[0]),lons=geo.map(point=>point[1]),bounds:LatLngBoundsExpression=[[Math.min(...lats),Math.min(...lons)],[Math.max(...lats),Math.max(...lons)]],gain=scalar(attr(selection.what,'gain'))??1,offset=scalar(attr(selection.what,'offset'))??0,nodata=scalar(attr(selection.what,'nodata'))??255,undetect=scalar(attr(selection.what,'undetect'))??0;
 return{projection,width,height,xScale,yScale,minX:minX!,maxY:maxY!,values,gain,offset,nodata,undetect,observedAt,classificationVerified,bounds};
}

export async function loadHymecNgMetadata(target?:string,signal?:AbortSignal):Promise<HymecNgMeta>{
 try{return await fetchWorkerJson<HymecNgMeta>('dwd-hymecng-meta',target?{target}:{},{purpose:'radar',timeoutMs:13000,signal,maxAgeMs:90_000,staleIfErrorMs:8*60_000,cacheKey:`dwd-hymecng-meta:${target||'latest'}`})}
 catch(error){return{available:false,error:error instanceof Error?error.message:String(error)}}
}

export function loadHymecNgRaster(meta:HymecNgMeta):Promise<HymecNgRaster>{
 if(!meta.fileUrl)return Promise.reject(new Error(meta.error||meta.reason||'Keine HymecNG-Datei verfügbar.'));
 const key=meta.fileUrl;
 const existing=rasterCache.get(key);if(existing)return existing;
 const promise=(async()=>{
  const response=await fetch(key,{cache:'no-store'});if(!response.ok)throw new Error(`HymecNG-Datei HTTP ${response.status}`);
  const buffer=await response.arrayBuffer();if(buffer.byteLength<1024)throw new Error('HymecNG-Datei ist unerwartet klein.');
  const hdf5=await import('jsfive'),file=new hdf5.File(buffer,key) as unknown as H5File,selection=findDataset(file);
  return rasterGeometry(file,selection,meta.observedAt,meta.classificationVerified===true);
 })().catch(error=>{rasterCache.delete(key);throw error});
 rasterCache.set(key,promise);return promise;
}

export function hymecNgClassForRaw(raw:number,raster:HymecNgRaster):HymecNgClass{
 if(!Number.isFinite(raw)||raw===raster.nodata)return HYMEC_NG_CLASS_BY_CODE.get(0)!;
 if(raw===raster.undetect)return HYMEC_NG_CLASS_BY_CODE.get(0)!;
 if(!raster.classificationVerified)return UNKNOWN_CLASS;
 // ODIM-HDF5 speichert Rasterwerte als Rohwert; die physikalische/Klassen-Codierung
 // entsteht erst aus gain und offset. Ein direktes Runden des Rohwerts kann deshalb
 // sämtliche HymecNG-Niederschlagsklassen unsichtbar machen.
 const code=Math.round(raw*raster.gain+raster.offset);
 return HYMEC_NG_CLASS_BY_CODE.get(code)||UNKNOWN_CLASS;
}

export type HymecNgRasterDiagnostics={sampled:number;knownPrecipitation:number;dry:number;unknown:number;unknownShare:number};
export function hymecNgRasterDiagnostics(raster:HymecNgRaster):HymecNgRasterDiagnostics{
 const length=Math.min(raster.values.length,raster.width*raster.height),step=Math.max(1,Math.floor(length/120000));
 let sampled=0,knownPrecipitation=0,dry=0,unknown=0;
 for(let index=0;index<length;index+=step){
  const raw=Number(raster.values[index]),classification=hymecNgClassForRaw(raw,raster);sampled++;
  if(classification.code<0)unknown++;else if(classification.code===0)dry++;else knownPrecipitation++;
 }
 const classified=Math.max(1,knownPrecipitation+unknown),unknownShare=unknown/classified;
 return{sampled,knownPrecipitation,dry,unknown,unknownShare};
}

export function hymecNgSourceIndex(raster:HymecNgRaster,latitude:number,longitude:number):number|null{
 const projected=projectWgs84(latitude,longitude,raster.projection);if(!projected)return null;
 const sourceX=Math.floor((projected[0]-raster.minX)/raster.xScale),sourceY=Math.floor((raster.maxY-projected[1])/raster.yScale);
 if(sourceX<0||sourceX>=raster.width||sourceY<0||sourceY>=raster.height)return null;
 return sourceY*raster.width+sourceX;
}

export async function sampleHymecNg(meta:HymecNgMeta,latitude:number,longitude:number):Promise<HymecNgSample>{
 const raster=await loadHymecNgRaster(meta),index=hymecNgSourceIndex(raster,latitude,longitude);
 if(index===null)return{label:'außerhalb HymecNG-Abdeckung',color:'#7f7f7f',code:null,latitude,longitude,observedAt:raster.observedAt,inside:false};
 const classification=hymecNgClassForRaw(Number(raster.values[index]),raster);
 return{label:classification.label,color:classification.color,code:classification.code,latitude,longitude,observedAt:raster.observedAt,inside:true};
}
