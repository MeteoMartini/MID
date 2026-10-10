import type {NativeField,NativeIndex} from './nativeModelFields';
import type {SynopticField,SynopticIndex} from './nativeSynopticFields';
import type {WeatherMapMetadata} from './WeatherMapsData';
import {nearestUnifiedTime} from './unifiedMapCatalog';
import {mercatorY} from './precipitationTotals';
import {decodeNativeMapGzip} from './nativeMapCompression';
import type {SynopticFrame,SynopticModel} from './nativeSynopticFields';

export const CLOUD_WEATHER_LABEL='Wolken und signifikantes Wetter';
export const GDPS_CLOUD_LAYER='GDPS_15km_TotalCloudCover',GDPS_WEATHER_LAYER='GDPS_15km_PrecipType-Instant';
export type CloudWeatherData={run:string;time:string;model:string;resolutionKm?:number;lats:number[];lons:number[];cloud:(number|null)[];weather:(number|null)[]};
export const SIGNIFICANT_WEATHER_STYLES=[
 {label:'Nebel',color:'#f4e625',codes:[11,12,40,41,42,43,44,45,46,47]},
 {label:'Nebel · Reif',color:'#babc20',codes:[48,49]},
 {label:'Regen / Niesel · leicht',color:'#39ed24',codes:[50,51,58,60,61,80]},
 {label:'Regen / Niesel · mäßig',color:'#24be28',codes:[52,53,62,63]},
 {label:'Regen / Niesel · stark',color:'#117b24',codes:[54,55,64,65,82]},
 {label:'Regen / Schauer · mäßig / stark',color:'#24be28',codes:[59,81]},
 {label:'Schneeregen · leicht',color:'#ffc991',codes:[68,83]},
 {label:'Schneeregen · mäßig / stark',color:'#ed9b4c',codes:[69,84]},
 {label:'Schnee · leicht',color:'#52e3ef',codes:[70,71,77,78,85]},
 {label:'Schnee · mäßig',color:'#438ee9',codes:[72,73]},
 {label:'Schnee · stark',color:'#174dba',codes:[74,75]},
 {label:'Schneeschauer · mäßig / stark',color:'#174dba',codes:[86]},
 {label:'Eisnadeln',color:'#b8ecff',codes:[76]},
 {label:'Gefrierender Regen / Niesel · leicht',color:'#ff665f',codes:[56,66]},
 {label:'Gefrierender Regen / Niesel · mäßig / stark',color:'#e52132',codes:[57,67]},
 {label:'Gewitter · ohne Niederschlag',color:'#939393',codes:[17]},
 {label:'Gewitter · leicht / mäßig',color:'#eb4ff0',codes:[95]},
 {label:'Gewitter · stark',color:'#b71ac9',codes:[97]},
 {label:'Gewitter mit Hagel',color:'#ab14b9',codes:[96,99]},
 {label:'Graupel / Eiskörner',color:'#af87db',codes:[79,87,88]},
 {label:'Hagel',color:'#d55bcc',codes:[89,90]},
 {label:'Staub / Sand',color:'#b69a66',codes:[30,31,32,33,34,35]},
 {label:'Schneetreiben',color:'#b4d7f0',codes:[36,37,38,39]},
 {label:'Regen · Gewitter zuvor',color:'#24be28',codes:[91,92]},
 {label:'Schnee / Schneeregen / Hagel · Gewitter zuvor',color:'#52e3ef',codes:[93,94]},
 {label:'Gewitter mit Staub / Sand',color:'#b69a66',codes:[98]},
 {label:'Böen',color:'#c39a7d',codes:[18]},
 {label:'Trichterwolke / Tornado',color:'#9b7373',codes:[19]}
];
export function significantWeatherStyle(code:number|null|undefined){return typeof code==='number'&&Number.isInteger(code)?SIGNIFICANT_WEATHER_STYLES.find(s=>s.codes.includes(code)):undefined}
export function cloudWeatherDescription(code:number|null){return code===null?'Wetter nicht verfügbar':significantWeatherStyle(code)?.label??(code<=3?'Keine signifikante Erscheinung':`Wettercode ${code}`)}
export function cloudWeatherSources(native:NativeIndex|null,synoptic:SynopticIndex|null){
 const choices:{id:string;label:string}[]=[];
 if(synoptic?.models['icon-d2']?.cloudWeatherFrames?.length||native?.products.sigwx?.frames.some(w=>native.products.cloud?.frames.some(c=>c.time===w.time)))choices.push({id:'icon-d2',label:'DWD ICON-D2'});
 for(const id of ['icon-eu','icon']){const m=synoptic?.models[id];if(m?.cloudWeatherFrames?.length||m?.frames.some(f=>f.cloudWeather===true))choices.push({id,label:m!.label});}
 choices.push({id:'gdps',label:'ECCC GDPS Global'});return choices;
}
export function nativeCloudWeatherPair(cloud:NativeField,weather:NativeField):CloudWeatherData{
 if(cloud.kind!=='cloud'||weather.kind!=='sigwx'||cloud.run!==weather.run||cloud.time!==weather.time||cloud.lats.length!==weather.lats.length||cloud.lons.length!==weather.lons.length||cloud.lats.some((v,i)=>v!==weather.lats[i])||cloud.lons.some((v,i)=>v!==weather.lons[i]))throw Error('Wolken und Wetter benötigen denselben Lauf, Termin und Raster.');
 return {model:'icon-d2',run:cloud.run,time:cloud.time,lats:cloud.lats,lons:cloud.lons,cloud:cloud.values.map(v=>Number.isFinite(v)?v*cloud.scale:null),weather:weather.values.map(v=>Number.isFinite(v)?v*weather.scale:null)};
}
export function validateCloudWeatherField(d:any,id:string,model:SynopticModel,ref:SynopticFrame):CloudWeatherData{
 const axis=(a:any)=>Array.isArray(a)&&a.length>=10&&a.length<=2500&&a.every((v:any,i:number)=>Number.isFinite(v)&&(!i||v>a[i-1]&&Math.abs(v-a[i-1]-(a[1]-a[0]))<1e-5));
 if(d?.schema!=='mid.cloud-weather.field.v1'||d.model!==id||d.run!==model.run||d.time!==ref.time||d.cloudUnit!=='%'||d.weatherUnit!=='WMO 4677'||d.cloudScale!==.1||!axis(d.lats)||!axis(d.lons)||d.lats[0]<29.5||d.lats.at(-1)>70.5||d.lons[0]<-23.5||d.lons.at(-1)>62.5||!Number.isFinite(d.resolutionKm)||d.resolutionKm<1||d.resolutionKm>100)throw Error('Wolken-/Wetterfeld: Lauf, Termin oder Raster ungültig.');
 const n=d.lats.length*d.lons.length;if(!Array.isArray(d.cloud)||!Array.isArray(d.weather)||d.cloud.length!==n||d.weather.length!==n||d.cloud.some((v:any)=>v!==null&&(!Number.isInteger(v)||v<0||v>1000))||d.weather.some((v:any)=>v!==null&&(!Number.isInteger(v)||v<0||v>99))||d.cloud.filter((v:any,i:number)=>v!==null&&d.weather[i]!==null).length<n*.4)throw Error('Wolken-/Wetterwerte unvollständig oder ungültig.');
 return {...d,cloud:d.cloud.map((v:number|null)=>v===null?null:v*.1)};
}
export async function loadCloudWeatherField(base:string,id:string,model:SynopticModel,ref:SynopticFrame,signal:AbortSignal){const r=await fetch(base+ref.file,{signal});if(!r.ok)throw Error('Wolken-/Wetterfeld nicht erreichbar.');const bytes=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(bytes.byteLength!==ref.bytes||hash!==ref.sha256)throw Error('Wolken-/Wetterfeld-Prüfsumme ungültig.');return validateCloudWeatherField(JSON.parse(await decodeNativeMapGzip(bytes,ref.decodedBytes)),id,model,ref);}
export function synopticCloudWeather(field:SynopticField):CloudWeatherData{
 const c=field.cloudWeather;if(!c)throw Error('Keine bestätigten Wolken-/Wetterdaten für diesen Termin.');
 return {model:field.model,run:field.run,time:field.time,resolutionKm:field.resolutionKm,lats:field.lats,lons:field.lons,cloud:c.cloud.map(v=>v===null?null:v*c.cloudScale),weather:c.weather};
}
export function gdpsCloudWeatherCatalog(metadata:WeatherMapMetadata[]){
 const cloud=metadata.find(m=>m.layer===GDPS_CLOUD_LAYER),weather=metadata.find(m=>m.layer===GDPS_WEATHER_LAYER);
 if(!cloud||!weather||!cloud.styles?.some(s=>s.name==='CLOUD'&&s.rendering==='fill')||!weather.styles?.some(s=>s.name==='INSTPRECIPITATIONTYPE'&&s.rendering==='fill'))return null;
 const weatherTimes=new Set(weather.times),runs=new Set(weather.referenceTimes),times=cloud.times.filter(t=>weatherTimes.has(t)&&Date.parse(t)<=Date.now()+204*3600000).sort((a,b)=>Date.parse(a)-Date.parse(b));
 const run=cloud.referenceTimes.filter(r=>runs.has(r)).sort((a,b)=>Date.parse(a)-Date.parse(b)).at(-1);
 return run?{run,times:times.filter(t=>Date.parse(t)>=Date.parse(run))}:null;
}
export function gdpsCloudWeatherPlan(metadata:WeatherMapMetadata[],target:number){
 const catalog=gdpsCloudWeatherCatalog(metadata),time=nearestUnifiedTime(catalog?.times??[],target);
 return catalog&&time?{...catalog,time}:null;
}
export function cloudWeatherAt(data:CloudWeatherData,lat:number,lon:number){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<data.lats[0]||lat>data.lats.at(-1)!||lon<data.lons[0]||lon>data.lons.at(-1)!)return null;
 const row=Math.round((lat-data.lats[0])/(data.lats[1]-data.lats[0])),col=Math.round((lon-data.lons[0])/(data.lons[1]-data.lons[0])),i=row*data.lons.length+col;
 const cloud=data.cloud[i],weather=data.weather[i];return {cloud:typeof cloud==='number'&&Number.isFinite(cloud)?cloud:null,weather:typeof weather==='number'&&Number.isFinite(weather)?weather:null};
}
export function cloudWeatherRaster(data:CloudWeatherData){
 const canvas=document.createElement('canvas');canvas.width=Math.min(1600,data.lons.length);canvas.height=Math.min(1600,data.lats.length);const c=canvas.getContext('2d');if(!c)throw Error('Wolken-/Wetterdarstellung nicht verfügbar.');
 const image=c.createImageData(canvas.width,canvas.height),north=mercatorY(data.lats.at(-1)!),south=mercatorY(data.lats[0]);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const lat=(2*Math.atan(Math.exp(north-(y+.5)/canvas.height*(north-south)))-Math.PI/2)*180/Math.PI,lon=data.lons[0]+(x+.5)/canvas.width*(data.lons.at(-1)!-data.lons[0]),point=cloudWeatherAt(data,lat,lon);if(!point)continue;
  const p=(y*canvas.width+x)*4,style=significantWeatherStyle(point.weather);
  if(style){for(let j=0;j<3;j++)image.data[p+j]=parseInt(style.color.slice(1+j*2,3+j*2),16);image.data[p+3]=240;}
  else if(point.cloud!==null){const grey=Math.round(255-point.cloud*1.5);image.data[p]=image.data[p+1]=image.data[p+2]=grey;image.data[p+3]=215;}
 }
 c.putImageData(image,0,0);return canvas.toDataURL('image/png');
}
