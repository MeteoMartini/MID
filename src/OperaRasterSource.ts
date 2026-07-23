import type {OperaRasterFrame} from './CompositeData';
import type {RadarNowcast,RadarNowcastQuality} from './weather';

type H5Node={value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>};
type Projection={lat0:number;lon0:number;x0:number;y0:number;a:number;e2:number;authalicRadius?:number};
export type OperaRaster={values:ArrayLike<number>;width:number;height:number;gain:number;offset:number;nodata:number;undetect:number;quantity:string;projection:Projection;minX:number;maxY:number;xScale:number;yScale:number};
export type OperaRasterPoint={covered:boolean;dbz?:number;rate:number;column?:number;row?:number};
export type OperaRasterSample={covered:boolean;currentRate:number;currentDbz?:number;localRate:number;nearbyRate:number;nearestWetKm?:number;validPixels:number;wetPixels:number};

const rasterCache=new Map<string,Promise<OperaRaster>>();
const MAX_CACHE=2;

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
function getNode(file:{get(path:string):H5Node},path:string){try{return file.get(path)}catch{return undefined}}
function findDataset(file:{get(path:string):H5Node}){
 for(let datasetIndex=1;datasetIndex<=5;datasetIndex++)for(let dataIndex=1;dataIndex<=5;dataIndex++){
  const base=`dataset${datasetIndex}/data${dataIndex}`,dataset=getNode(file,`${base}/data`),what=getNode(file,`${base}/what`),quantity=text(attr(what,'quantity')).toUpperCase();
  if(dataset?.value&&dataset.shape?.length===2&&(quantity.includes('DBZH')||quantity==='DBZ'||quantity.includes('RATE')))return{dataset,what,quantity};
 }
 throw new Error('Kein unterstütztes OPERA-Reflektivitätsraster im HDF5 gefunden.');
}
function param(definition:string,name:string,fallback:number){const match=definition.match(new RegExp(`(?:^|\\s)\\+${name}=([^\\s]+)`,'i')),result=match?Number(match[1]):NaN;return Number.isFinite(result)?result:fallback}
function projectionFrom(where:H5Node|undefined):Projection{
 const definition=text(attr(where,'projdef','projection_definition','proj4')),ellipsoid=(definition.match(/(?:^|\s)\+ellps=([^\s]+)/i)?.[1]||'WGS84').toUpperCase(),a=param(definition,'a',param(definition,'R',6378137));
 const inverseFlattening=ellipsoid==='GRS80'?298.257222101:ellipsoid==='WGS84'?298.257223563:Infinity,e2=Number.isFinite(inverseFlattening)?2/inverseFlattening-1/(inverseFlattening*inverseFlattening):0,authalicRadius=param(definition,'R',NaN);
 return{lat0:param(definition,'lat_0',55),lon0:param(definition,'lon_0',10),x0:param(definition,'x_0',1950000),y0:param(definition,'y_0',2100000),a,e2,authalicRadius:Number.isFinite(authalicRadius)?authalicRadius:undefined};
}
function q(phi:number,e2:number){if(e2<=0)return 2*Math.sin(phi);const e=Math.sqrt(e2),sin=Math.sin(phi),denominator=1-e2*sin*sin;return(1-e2)*(sin/denominator-(1/(2*e))*Math.log((1-e*sin)/(1+e*sin)))}
export function forwardOperaLaea(latDegrees:number,lonDegrees:number,projection:Projection):[number,number]|null{
 const radians=Math.PI/180,phi=latDegrees*radians,lambda=lonDegrees*radians,phi0=projection.lat0*radians,lambda0=projection.lon0*radians,delta=lambda-lambda0;
 if(Number.isFinite(projection.authalicRadius)){const radius=projection.authalicRadius!,denominator=1+Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(delta);if(denominator<=1e-12)return null;const k=Math.sqrt(2/denominator);return[projection.x0+radius*k*Math.cos(phi)*Math.sin(delta),projection.y0+radius*k*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(delta))]}
 const qp=q(Math.PI/2,projection.e2),beta=Math.asin(Math.max(-1,Math.min(1,q(phi,projection.e2)/qp))),beta0=Math.asin(Math.max(-1,Math.min(1,q(phi0,projection.e2)/qp))),rq=projection.a*Math.sqrt(qp/2),m0=Math.cos(phi0)/Math.sqrt(1-projection.e2*Math.sin(phi0)**2),d=projection.a*m0/(rq*Math.cos(beta0)),denominator=1+Math.sin(beta0)*Math.sin(beta)+Math.cos(beta0)*Math.cos(beta)*Math.cos(delta);
 if(denominator<=1e-12)return null;const b=rq*Math.sqrt(2/denominator);return[projection.x0+b*d*Math.cos(beta)*Math.sin(delta),projection.y0+(b/d)*(Math.cos(beta0)*Math.sin(beta)-Math.sin(beta0)*Math.cos(beta)*Math.cos(delta))];
}
export function operaRateFromDbz(dbz:number){if(!Number.isFinite(dbz)||dbz<5)return 0;const z=10**(dbz/10);return Math.max(0,Math.min(400,(z/200)**(1/1.6)))}
function decodedValue(raster:OperaRaster,column:number,row:number):{covered:boolean;dbz?:number;rate:number}{
 if(column<0||column>=raster.width||row<0||row>=raster.height)return{covered:false,rate:0};
 const raw=Number(raster.values[row*raster.width+column]);
 if(!Number.isFinite(raw)||raw===raster.nodata)return{covered:false,rate:0};
 if(raw===raster.undetect)return{covered:true,rate:0};
 const value=raw*raster.gain+raster.offset,dbz=raster.quantity.includes('RATE')?10*Math.log10(200*Math.max(.0001,value)**1.6):value;
 return{covered:true,dbz,rate:raster.quantity.includes('RATE')?Math.max(0,Math.min(400,value)):operaRateFromDbz(dbz)};
}
export function operaRasterPoint(raster:OperaRaster,lat:number,lon:number):OperaRasterPoint{
 const projected=forwardOperaLaea(lat,lon,raster.projection);if(!projected)return{covered:false,rate:0};
 const column=Math.floor((projected[0]-raster.minX)/raster.xScale),row=Math.floor((raster.maxY-projected[1])/raster.yScale),value=decodedValue(raster,column,row);
 return{...value,column,row};
}
async function decode(url:string):Promise<OperaRaster>{
 const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`OPERA-HDF5 HTTP ${response.status}`);const buffer=await response.arrayBuffer();if(buffer.byteLength<1000)throw new Error('OPERA-HDF5-Datei ist unvollständig.');
 const hdf5=await import('jsfive'),file=new hdf5.File(buffer,url),where=getNode(file,'where'),{dataset,what,quantity}=findDataset(file),shape=dataset.shape??[],height=Number(shape[0]),width=Number(shape[1]);
 if(!width||!height||width*height>25_000_000)throw new Error('Ungültige OPERA-Rastergröße.');const values=dataset.value as ArrayLike<number>;if(!values||values.length<width*height)throw new Error('OPERA-Raster ist unvollständig.');
 const xScale=Math.abs(scalar(attr(where,'xscale','x_scale'))??1000),yScale=Math.abs(scalar(attr(where,'yscale','y_scale'))??1000),llX=scalar(attr(where,'LL_x','ll_x')),urY=scalar(attr(where,'UR_y','ur_y')),urX=scalar(attr(where,'UR_x','ur_x')),llY=scalar(attr(where,'LL_y','ll_y')),minX=llX??(urX!==undefined?urX-width*xScale:0),maxY=urY??(llY!==undefined?llY+height*yScale:height*yScale);
 return{values,width,height,gain:scalar(attr(what,'gain'))??0.5,offset:scalar(attr(what,'offset'))??-32.5,nodata:scalar(attr(what,'nodata'))??255,undetect:scalar(attr(what,'undetect'))??0,quantity,projection:projectionFrom(where),minX,maxY,xScale,yScale};
}
function abortable<T>(promise:Promise<T>,signal?:AbortSignal):Promise<T>{
 if(!signal)return promise;if(signal.aborted)return Promise.reject(signal.reason??new DOMException('Vorgang abgebrochen.','AbortError'));
 return new Promise<T>((resolve,reject)=>{const abort=()=>reject(signal.reason??new DOMException('Vorgang abgebrochen.','AbortError'));signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value)},error=>{signal.removeEventListener('abort',abort);reject(error)})});
}
export function loadOperaRasterData(url:string,signal?:AbortSignal){
 let promise=rasterCache.get(url);if(!promise){promise=decode(url).catch(error=>{rasterCache.delete(url);throw error});rasterCache.set(url,promise);while(rasterCache.size>MAX_CACHE){const oldest=rasterCache.keys().next().value as string|undefined;if(!oldest)break;rasterCache.delete(oldest)}}return abortable(promise,signal);
}
export function sampleOperaRaster(raster:OperaRaster,lat:number,lon:number,radiusKm=30):OperaRasterSample{
 const point=operaRasterPoint(raster,lat,lon);if(point.column===undefined||point.row===undefined)return{covered:false,currentRate:0,localRate:0,nearbyRate:0,validPixels:0,wetPixels:0};
 const radiusX=Math.max(1,Math.ceil(radiusKm*1000/raster.xScale)),radiusY=Math.max(1,Math.ceil(radiusKm*1000/raster.yScale)),localRadiusKm=2.2;let validPixels=0,wetPixels=0,localRate=0,nearbyRate=0,nearestWetKm=Infinity;
 for(let dy=-radiusY;dy<=radiusY;dy++)for(let dx=-radiusX;dx<=radiusX;dx++){
  const distanceKm=Math.hypot(dx*raster.xScale,dy*raster.yScale)/1000;if(distanceKm>radiusKm)continue;const value=decodedValue(raster,point.column+dx,point.row+dy);if(!value.covered)continue;validPixels++;if(value.rate>=.05){wetPixels++;nearbyRate=Math.max(nearbyRate,value.rate);nearestWetKm=Math.min(nearestWetKm,distanceKm);if(distanceKm<=localRadiusKm)localRate=Math.max(localRate,value.rate)}
 }
 const centreNeighbourhoodValid=[[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]].filter(([dx,dy])=>decodedValue(raster,point.column!+dx,point.row!+dy).covered).length,covered=point.covered||centreNeighbourhoodValid>=3;
 return{covered,currentRate:point.rate,currentDbz:point.dbz,localRate,nearbyRate,nearestWetKm:Number.isFinite(nearestWetKm)?nearestWetKm:undefined,validPixels,wetPixels};
}
function qualityForAge(ageMinutes:number):RadarNowcastQuality{return ageMinutes<=12?'high':ageMinutes<=25?'medium':'low'}
function probabilityFor(sample:OperaRasterSample,ageMinutes:number){let probability=5;if(sample.currentRate>=.05)probability=98;else if(sample.localRate>=.05)probability=88;else if((sample.nearestWetKm??Infinity)<=5)probability=72;else if((sample.nearestWetKm??Infinity)<=10)probability=58;else if((sample.nearestWetKm??Infinity)<=20)probability=38;else if((sample.nearestWetKm??Infinity)<=30)probability=22;if(ageMinutes>15)probability=Math.max(5,Math.round(probability*Math.max(.55,1-(ageMinutes-15)/60)));return probability}
function rateLabel(rate:number){if(rate>=50)return'extrem';if(rate>=20)return'sehr stark';if(rate>=8)return'stark';if(rate>=2.5)return'mäßig';if(rate>=.5)return'leicht';if(rate>=.1)return'sehr leicht';return'kaum messbar'}
export async function analyseOperaRasterNowcast(frames:OperaRasterFrame[],lat:number,lon:number,signal?:AbortSignal):Promise<RadarNowcast>{
 const sorted=frames.filter(frame=>Number.isFinite(Date.parse(frame.time))).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time)),now=Date.now(),latest=[...sorted].reverse().find(frame=>Date.parse(frame.time)<=now+7*60000)??sorted.at(-1);if(!latest)throw new Error('OPERA-CIRRUS-Metadaten enthalten keinen Rasterstand.');
 const latestTime=Date.parse(latest.time),ageMinutes=Math.max(0,(now-latestTime)/60000);if(ageMinutes>40||ageMinutes<-10)throw new Error('Der aktuelle OPERA-CIRRUS-Stand ist zeitlich nicht plausibel.');
 const latestRaster=await loadOperaRasterData(latest.fileUrl,signal),sample=sampleOperaRaster(latestRaster,lat,lon);if(!sample.covered)throw new Error('Der Standort liegt in einer OPERA-NoData-Zone.');
 let previousSample:OperaRasterSample|undefined,previousTime:number|undefined,arrivalMinutes:number|undefined,arrivalKind:RadarNowcast['arrivalKind'],arrivalStartAt:string|undefined,arrivalEndAt:string|undefined;
 if(sample.currentRate<.05&&sample.nearestWetKm!==undefined&&sample.nearestWetKm<=30){const previous=[...sorted].reverse().find(frame=>Date.parse(frame.time)<=latestTime-9*60000);if(previous){try{previousTime=Date.parse(previous.time);previousSample=sampleOperaRaster(await loadOperaRasterData(previous.fileUrl,signal),lat,lon);const previousDistance=previousSample.nearestWetKm,currentDistance=sample.nearestWetKm;if(previousSample.covered&&previousDistance!==undefined&&currentDistance!==undefined){const elapsed=Math.max(5,(latestTime-previousTime)/60000),approachKm=previousDistance-currentDistance,speed=approachKm/elapsed;if(speed>=.08){arrivalMinutes=Math.max(5,Math.min(180,Math.round(currentDistance/speed)));arrivalKind='approximate';arrivalStartAt=new Date(latestTime+Math.max(0,arrivalMinutes-10)*60000).toISOString();arrivalEndAt=new Date(latestTime+(arrivalMinutes+15)*60000).toISOString()}else if(currentDistance<=5){arrivalMinutes=10;arrivalKind='nearby';arrivalStartAt=new Date(latestTime+5*60000).toISOString();arrivalEndAt=new Date(latestTime+25*60000).toISOString()}}}catch(error){if(signal?.aborted)throw error}}
 }
 const probability=probabilityFor(sample,ageMinutes),peakRate=Math.max(sample.localRate,sample.nearbyRate),rateUncertain=sample.currentRate<.05&&peakRate>=.05;let summary:string;
 if(sample.currentRate>=.05)summary=`Niederschlag im echten OPERA-CIRRUS-Raster am Standort erkannt: ${rateLabel(sample.currentRate)}.`;
 else if(arrivalMinutes!==undefined)summary=`Ein OPERA-Radarecho nähert sich im 1-km-Raster; ein Standorttreffer bleibt unsicher (grob ${arrivalMinutes} Minuten).`;
 else if(sample.nearestWetKm!==undefined)summary=`Niederschlagsfeld im OPERA-Raster etwa ${Math.max(1,Math.round(sample.nearestWetKm))} km vom Standort entfernt; Zugrichtung noch nicht belastbar.`;
 else summary='Im aktuellen OPERA-CIRRUS-Raster kein messbares Echo am Standort oder im 30-km-Umkreis.';
 return{source:'opera',provider:'EUMETNET OPERA CIRRUS DBZH · 1 km / 5 min',quality:qualityForAge(ageMinutes),radarProbability:probability,currentRate:sample.currentRate,rawCurrentRate:sample.currentRate,peakRate,rateApproximate:true,rateUncertain,arrivalMinutes,arrivalKind,arrivalStartAt,arrivalEndAt,observedAt:new Date(latestTime).toISOString(),summary,coverage:true,license:'EUMETNET OPERA composite products, CC BY 4.0',timeline:sorted.map(frame=>frame.time),diagnostics:{product:'CIRRUS DBZH',nativeResolutionKm:1,temporalResolutionMinutes:5,method:'ODIM-HDF5-Rasterpixel und 30-km-Umfeld direkt im Browser ausgewertet',nearestWetKm:sample.nearestWetKm,localRate:sample.localRate,nearbyRate:sample.nearbyRate,validPixels:sample.validPixels,wetPixels:sample.wetPixels,previousNearestWetKm:previousSample?.nearestWetKm,previousTime:previousTime?new Date(previousTime).toISOString():undefined,motionResolved:arrivalMinutes!==undefined}};
}
