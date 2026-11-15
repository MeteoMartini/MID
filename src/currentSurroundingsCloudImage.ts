import {useEffect,useState} from 'react';
import {cloudWeatherRaster,nativeCloudWeatherPair,synopticCloudWeather,loadCloudWeatherField,type CloudWeatherData} from './cloudWeatherData';
import {loadEstablishedSynopticIndex,loadSynopticField,type SynopticFrame,type SynopticModel} from './nativeSynopticFields';
import {loadNativeIndex,loadNativeField} from './nativeModelFields';

export type SurroundingsCloudImage={
 url:string;
 bounds:[[number,number],[number,number]];
 model:string;
 run:string;
 validTime:string;
 temporalMethod:'original'|'cloud-linear';
 originalTimes?:[string,string];
 sigwxTime?:string;
};
export type SurroundingsCloudResult={image:SurroundingsCloudImage|null;loading:boolean;unavailable:boolean};
const HOUR=3600000,MAX_OFFSET=3*HOUR,MAX_RUN_AGE=24*HOUR;
const MODEL_PRIORITY=['icon-d2','icon-d2-ruc','icon-eu','icon'] as const;

/** Only a verified matching cloud/weather field within a meaningful current-weather window. */
export function admissibleSurroundingsCloudTime(validTime:string,run:string,now:number):boolean{
 const time=Date.parse(validTime),init=Date.parse(run);
 return Number.isFinite(time)&&Number.isFinite(init)&&Number.isFinite(now)&&
  time>=now-MAX_OFFSET&&time<=now+MAX_OFFSET&&
  init<=now+HOUR&&init>=now-MAX_RUN_AGE&&time>=init;
}
export function chooseSurroundingsCloudFrames(
 models:Record<string,SynopticModel>,now:number
):Array<{modelId:string;model:SynopticModel;ref:SynopticFrame;independent:boolean}>{
 const candidates:Array<{modelId:string;model:SynopticModel;ref:SynopticFrame;independent:boolean}>=[];
 for(const modelId of MODEL_PRIORITY){
  const model=models[modelId];
  if(!model)continue;
  const records=[
   ...(model.cloudWeatherFrames??[]).map(ref=>({ref,independent:true})),
   ...model.frames.filter(ref=>ref.cloudWeather===true).map(ref=>({ref,independent:false}))
  ].filter(item=>admissibleSurroundingsCloudTime(item.ref.time,model.run,now))
   .sort((a,b)=>Math.abs(Date.parse(a.ref.time)-now)-Math.abs(Date.parse(b.ref.time)-now));
  if(records[0])candidates.push({modelId,model,ref:records[0].ref,independent:records[0].independent});
 }
 // An exact UTC original outranks an interpolated product from a higher-priority model.
 // Within each class, preserve the established ICON family priority.
 return candidates.sort((a,b)=>Number(Date.parse(b.ref.time)===now)-Number(Date.parse(a.ref.time)===now));
}

/** The highest-priority exact original wins; otherwise preserve established source order. */
export function chooseSurroundingsCloudFrame(models:Record<string,SynopticModel>,now:number){
 return chooseSurroundingsCloudFrames(models,now)[0]??null;
}
function usableAtSite(data:CloudWeatherData,lat:number,lon:number):boolean{
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||data.lats.length<2||data.lons.length<2||
  lat<data.lats[0]||lat>data.lats.at(-1)!||lon<data.lons[0]||lon>data.lons.at(-1)!)return false;
 const row=Math.max(0,Math.min(data.lats.length-1,Math.round((lat-data.lats[0])/(data.lats[1]-data.lats[0]))));
 const col=Math.max(0,Math.min(data.lons.length-1,Math.round((lon-data.lons[0])/(data.lons[1]-data.lons[0]))));
 const idx=row*data.lons.length+col;
 return Number.isFinite(data.cloud[idx])||Number.isFinite(data.weather[idx]);
}
/** SHA-bound same-run temporal visualization. Only cloud fraction is continuous.
 * WMO 4677 categories are NEVER interpolated; abrupt cloud changes retain an original.
 */
export function interpolateVerifiedSurroundingsCloud(earlier:CloudWeatherData,later:CloudWeatherData,target:number):CloudWeatherData|null{
 const a=Date.parse(earlier.time),b=Date.parse(later.time);
 if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(target)||
  !(a<target&&target<b)||b-a>HOUR||b-a<15*60000||
  earlier.run!==later.run||earlier.model!==later.model||
  earlier.lats.length!==later.lats.length||earlier.lons.length!==later.lons.length||
  earlier.cloud.length!==later.cloud.length||earlier.weather.length!==later.weather.length||
  earlier.cloud.length!==earlier.lats.length*earlier.lons.length||
  earlier.lats.some((v,i)=>v!==later.lats[i])||earlier.lons.some((v,i)=>v!==later.lons[i]))return null;
 const ratio=(target-a)/(b-a),nearest=ratio<=.5?earlier:later;
 const cloud=earlier.cloud.map((v,i)=>{
  const next=later.cloud[i];if(v===null||next===null||!Number.isFinite(v)||!Number.isFinite(next))return null;
  if(v<0||v>100||next<0||next>100)return null;
  const w1=earlier.weather[i],w2=later.weather[i];
  if(Math.abs(next-v)>40||(w1!==null&&w2!==null&&w1!==w2))return nearest.cloud[i]??null;
  return Math.max(0,Math.min(100,Math.round((v+(next-v)*ratio)*10)/10));
 });
 return {...nearest,time:new Date(target).toISOString(),cloud,weather:[...nearest.weather]};
}

function displayCloudFrame(data:CloudWeatherData,label:string,lat:number,lon:number,now:number,temporal?:{originalTimes:[string,string];sigwxTime:string}):SurroundingsCloudImage{
 if(!admissibleSurroundingsCloudTime(data.time,data.run,now)||!usableAtSite(data,lat,lon))
  throw new Error('Für den gewählten Ort und Zeitpunkt kein verifiziertes Modellfeld verfügbar.');
 const url=cloudWeatherRaster(data,'pseudo');
 if(!url.startsWith('data:image/png'))throw new Error('Modellbild nicht bereit.');
 return {url,bounds:[[data.lats[0],data.lons[0]],[data.lats.at(-1)!,data.lons.at(-1)!]],model:label,run:data.run,validTime:data.time,temporalMethod:temporal?'cloud-linear':'original',...(temporal?temporal:{})};
}
export async function loadVerifiedSurroundingsCloud(lat:number,lon:number,now:number,signal:AbortSignal):Promise<SurroundingsCloudImage>{
 try{
  const {index,base}=await loadEstablishedSynopticIndex(signal);
  // A time-valid ICON-D2 field may be geographically invalid at the user's site.
  // Try the next SHA-verified model instead of falling back directly to native D2.
  for(const selected of chooseSurroundingsCloudFrames(index.models,now)){
   const {modelId,model,ref,independent}=selected;
   try{
    // Never interpolate when an exact SHA-verified original is available,
    // even if two adjacent original frames also exist.
    if(Date.parse(ref.time)===now){
     const exact=independent
      ?await loadCloudWeatherField(base,modelId,model,ref,signal)
      :synopticCloudWeather(await loadSynopticField(base,modelId,model,ref,signal));
     return displayCloudFrame(exact,model.label,lat,lon,now);
    }
    const siblings=[
     ...(model.cloudWeatherFrames??[]).map(item=>({ref:item,independent:true})),
     ...model.frames.filter(item=>item.cloudWeather===true).map(item=>({ref:item,independent:false}))
    ].filter(item=>item.independent===independent&&admissibleSurroundingsCloudTime(item.ref.time,model.run,now));
    const earlier=siblings.filter(item=>Date.parse(item.ref.time)<now).sort((a,b)=>Date.parse(b.ref.time)-Date.parse(a.ref.time))[0];
    const later=siblings.filter(item=>Date.parse(item.ref.time)>now).sort((a,b)=>Date.parse(a.ref.time)-Date.parse(b.ref.time))[0];
    if(earlier&&later&&Date.parse(later.ref.time)-Date.parse(earlier.ref.time)<=HOUR){
     try{
      const read=async(item:typeof earlier)=>item.independent
       ?loadCloudWeatherField(base,modelId,model,item.ref,signal)
       :synopticCloudWeather(await loadSynopticField(base,modelId,model,item.ref,signal));
      const [before,after]=await Promise.all([read(earlier),read(later)]);
      if(!usableAtSite(before,lat,lon)||!usableAtSite(after,lat,lon))throw Error('Unvollständige örtliche Interpolationsabdeckung.');
      const blend=interpolateVerifiedSurroundingsCloud(before,after,now);
      if(blend){
       const nearest=now-Date.parse(before.time)<=Date.parse(after.time)-now?before:after;
       return displayCloudFrame(blend,model.label,lat,lon,now,{originalTimes:[before.time,after.time],sigwxTime:nearest.time});
      }
     }catch(error){if(signal.aborted)throw error}
    }
    const field=independent
     ?await loadCloudWeatherField(base,modelId,model,ref,signal)
     :synopticCloudWeather(await loadSynopticField(base,modelId,model,ref,signal));
    return displayCloudFrame(field,model.label,lat,lon,now);
   }catch(error){if(signal.aborted)throw error}
  }
 }catch(error){if(signal.aborted)throw error}
 // Retain the established SHA-validated ICON-D2 paired original fields as a fallback.
 const {index,base}=await loadNativeIndex(signal);
 const cloudRefs=index.products.cloud?.frames??[],weatherRefs=index.products.sigwx?.frames??[];
 const paired=cloudRefs.filter(ref=>weatherRefs.some(other=>other.time===ref.time)&&admissibleSurroundingsCloudTime(ref.time,index.run,now))
  .sort((a,b)=>Math.abs(Date.parse(a.time)-now)-Math.abs(Date.parse(b.time)-now));
 const ref=paired[0],weather=ref&&weatherRefs.find(other=>other.time===ref.time);
 if(!ref||!weather)throw new Error('Kein gültiges Wolken- und SigWx-Feld verfügbar.');
 const [cloudField,weatherField]=await Promise.all([
  loadNativeField(index,base,ref,'cloud',signal),loadNativeField(index,base,weather,'sigwx',signal)
 ]);
 return displayCloudFrame(nativeCloudWeatherPair(cloudField,weatherField),'DWD ICON-D2',lat,lon,now);
}
export function useSurroundingsCloudImage(enabled:boolean,lat:number,lon:number,target:number):SurroundingsCloudResult{
 const [result,setResult]=useState<SurroundingsCloudResult>({image:null,loading:enabled,unavailable:false});
 // Do not refetch a full validated model raster on every 30-second UI clock update.
 const targetBucket=Math.floor(target/(15*60000));
 useEffect(()=>{
  if(!enabled){setResult({image:null,loading:false,unavailable:false});return}
  const controller=new AbortController();
  setResult(previous=>previous.image&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,target)
   ?{...previous,loading:true,unavailable:false}
   :{image:null,loading:true,unavailable:false});
  // Bucket changes limit network reloads; raster time uses the precise selected instant.
  const now=target;
  const timer=window.setTimeout(()=>{
   if(!controller.signal.aborted){
    setResult(previous=>previous.image&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,now)
     ?{...previous,loading:false,unavailable:true}:{image:null,loading:false,unavailable:true});
    controller.abort()
   }
  },18000);
  void loadVerifiedSurroundingsCloud(lat,lon,now,controller.signal).then(image=>{
   if(!controller.signal.aborted)setResult({image,loading:false,unavailable:false});
  }).catch(()=>{if(!controller.signal.aborted)setResult(previous=>previous.image&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,now)
    ?{...previous,loading:false,unavailable:true}:{image:null,loading:false,unavailable:true})})
  .finally(()=>window.clearTimeout(timer));
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[enabled,lat,lon,targetBucket]);
 return result;
}
