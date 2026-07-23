type H5Node={value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>};
type Projection={kind:'stere'|'laea';lat0:number;latTs:number;lon0:number;x0:number;y0:number;a:number;e2:number};
export type RadolanRaster={values:ArrayLike<number>;width:number;height:number;gain:number;offset:number;nodata:number;undetect:number;quantity:string;projection:Projection;minX:number;maxY:number;xScale:number;yScale:number};
export type RadolanPointSample={covered:boolean;amountMm:number;nearbyAmountMm:number;column?:number;row?:number};

const rasterCache=new Map<string,Promise<RadolanRaster>>();
const MAX_CACHE=84;

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
function attr(node:H5Node|undefined,...names:string[]):unknown{const attrs=node?.attrs??{};for(const name of names){if(name in attrs)return attrs[name];const found=Object.keys(attrs).find(key=>key.toLowerCase()===name.toLowerCase());if(found)return attrs[found]}return undefined}
function getNode(file:{get(path:string):H5Node},path:string){try{return file.get(path)}catch{return undefined}}
function findDataset(file:{get(path:string):H5Node}){
 for(let datasetIndex=1;datasetIndex<=6;datasetIndex++)for(let dataIndex=1;dataIndex<=6;dataIndex++){
  const base=`dataset${datasetIndex}/data${dataIndex}`,dataset=getNode(file,`${base}/data`),what=getNode(file,`${base}/what`),quantity=text(attr(what,'quantity')).toUpperCase();
  if(dataset?.value&&dataset.shape?.length===2&&(/ACRR|RATE|RR|PRECIP/.test(quantity)||!quantity))return{dataset,what,quantity:quantity||'ACRR'};
 }
 throw new Error('Kein unterstütztes RADOLAN-Niederschlagsraster im HDF5 gefunden.');
}
function param(definition:string,name:string,fallback:number){const match=definition.match(new RegExp(`(?:^|\\s)\\+${name}=([^\\s]+)`,'i')),result=match?Number(match[1]):NaN;return Number.isFinite(result)?result:fallback}
function projectionFrom(where:H5Node|undefined):Projection{
 const definition=text(attr(where,'projdef','projection_definition','proj4')),kind=/\+proj=laea\b/i.test(definition)?'laea':'stere',ellipsoid=(definition.match(/(?:^|\s)\+ellps=([^\s]+)/i)?.[1]||'SPHERE').toUpperCase(),a=param(definition,'a',param(definition,'R',6370040)),inverseFlattening=ellipsoid==='GRS80'?298.257222101:ellipsoid==='WGS84'?298.257223563:Infinity,e2=Number.isFinite(inverseFlattening)?2/inverseFlattening-1/(inverseFlattening*inverseFlattening):0;
 return{kind,lat0:param(definition,'lat_0',kind==='stere'?90:52),latTs:param(definition,'lat_ts',60),lon0:param(definition,'lon_0',10),x0:param(definition,'x_0',kind==='stere'?0:4321000),y0:param(definition,'y_0',kind==='stere'?0:3210000),a,e2};
}
function q(phi:number,e2:number){if(e2<=0)return 2*Math.sin(phi);const e=Math.sqrt(e2),sin=Math.sin(phi),denominator=1-e2*sin*sin;return(1-e2)*(sin/denominator-(1/(2*e))*Math.log((1-e*sin)/(1+e*sin)))}
function forward(latDegrees:number,lonDegrees:number,projection:Projection):[number,number]|null{
 const radians=Math.PI/180,phi=latDegrees*radians,lambda=lonDegrees*radians,lambda0=projection.lon0*radians,delta=lambda-lambda0;
 if(projection.kind==='stere'){
  const denominator=1+Math.sin(phi);if(denominator<=1e-9)return null;const scale=projection.a*(1+Math.sin(projection.latTs*radians)),rho=scale*Math.cos(phi)/denominator;
  return[projection.x0+rho*Math.sin(delta),projection.y0-rho*Math.cos(delta)];
 }
 const phi0=projection.lat0*radians,qp=q(Math.PI/2,projection.e2),beta=Math.asin(Math.max(-1,Math.min(1,q(phi,projection.e2)/qp))),beta0=Math.asin(Math.max(-1,Math.min(1,q(phi0,projection.e2)/qp))),rq=projection.a*Math.sqrt(qp/2),m0=Math.cos(phi0)/Math.sqrt(1-projection.e2*Math.sin(phi0)**2),d=projection.a*m0/(rq*Math.cos(beta0)),denominator=1+Math.sin(beta0)*Math.sin(beta)+Math.cos(beta0)*Math.cos(beta)*Math.cos(delta);if(denominator<=1e-12)return null;const b=rq*Math.sqrt(2/denominator);return[projection.x0+b*d*Math.cos(beta)*Math.sin(delta),projection.y0+(b/d)*(Math.cos(beta0)*Math.sin(beta)-Math.sin(beta0)*Math.cos(beta)*Math.cos(delta))];
}
function decoded(raster:RadolanRaster,column:number,row:number):{covered:boolean;amountMm:number}{
 if(column<0||column>=raster.width||row<0||row>=raster.height)return{covered:false,amountMm:0};const raw=Number(raster.values[row*raster.width+column]);if(!Number.isFinite(raw)||raw===raster.nodata)return{covered:false,amountMm:0};if(raw===raster.undetect)return{covered:true,amountMm:0};const physical=raw*raster.gain+raster.offset,amount=/RATE/.test(raster.quantity)?physical/12:physical;return{covered:true,amountMm:Math.max(0,Math.min(250,amount))};
}
export function sampleRadolanPoint(raster:RadolanRaster,lat:number,lon:number):RadolanPointSample{
 const projected=forward(lat,lon,raster.projection);if(!projected)return{covered:false,amountMm:0,nearbyAmountMm:0};const column=Math.floor((projected[0]-raster.minX)/raster.xScale),row=Math.floor((raster.maxY-projected[1])/raster.yScale),centre=decoded(raster,column,row);let nearby=0,valid=0,total=0;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const value=decoded(raster,column+dx,row+dy);if(!value.covered)continue;valid++;total+=value.amountMm;nearby=Math.max(nearby,value.amountMm)}
 const amountMm=centre.covered?centre.amountMm:valid?total/valid:0;return{covered:centre.covered||valid>=3,amountMm,nearbyAmountMm:nearby,column,row};
}
async function decodeRadolan(url:string):Promise<RadolanRaster>{
 const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`RADOLAN-YW HDF5 HTTP ${response.status}`);const buffer=await response.arrayBuffer();if(buffer.byteLength<1000)throw new Error('RADOLAN-YW-Datei ist unvollständig.');const hdf5=await import('jsfive'),file=new hdf5.File(buffer,url),where=getNode(file,'where'),{dataset,what,quantity}=findDataset(file),shape=dataset.shape??[],height=Number(shape[0]),width=Number(shape[1]);if(!width||!height||width*height>10_000_000)throw new Error('Ungültige RADOLAN-Rastergröße.');const values=dataset.value as ArrayLike<number>;if(!values||values.length<width*height)throw new Error('RADOLAN-Raster ist unvollständig.');const xScale=Math.abs(scalar(attr(where,'xscale','x_scale'))??1000),yScale=Math.abs(scalar(attr(where,'yscale','y_scale'))??1000),llX=scalar(attr(where,'LL_x','ll_x')),urY=scalar(attr(where,'UR_y','ur_y')),urX=scalar(attr(where,'UR_x','ur_x')),llY=scalar(attr(where,'LL_y','ll_y')),minX=llX??(urX!==undefined?urX-width*xScale:-543196.835),maxY=urY??(llY!==undefined?llY+height*yScale:-3622588.861);return{values,width,height,gain:scalar(attr(what,'gain'))??.01,offset:scalar(attr(what,'offset'))??0,nodata:scalar(attr(what,'nodata'))??65535,undetect:scalar(attr(what,'undetect'))??0,quantity,projection:projectionFrom(where),minX,maxY,xScale,yScale};
}
function abortable<T>(promise:Promise<T>,signal?:AbortSignal):Promise<T>{if(!signal)return promise;if(signal.aborted)return Promise.reject(signal.reason??new DOMException('Vorgang abgebrochen.','AbortError'));return new Promise<T>((resolve,reject)=>{const abort=()=>reject(signal.reason??new DOMException('Vorgang abgebrochen.','AbortError'));signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value)},error=>{signal.removeEventListener('abort',abort);reject(error)})})}
export async function loadAndSampleRadolan(url:string,lat:number,lon:number,signal?:AbortSignal):Promise<RadolanPointSample>{let promise=rasterCache.get(url);if(!promise){promise=decodeRadolan(url).catch(error=>{rasterCache.delete(url);throw error});rasterCache.set(url,promise);while(rasterCache.size>MAX_CACHE){const oldest=rasterCache.keys().next().value as string|undefined;if(!oldest)break;rasterCache.delete(oldest)}}return sampleRadolanPoint(await abortable(promise,signal),lat,lon)}
