import {useEffect,useState} from 'react';
import {cloudWeatherRaster,nativeCloudWeatherPair,synopticCloudWeather,loadCloudWeatherField,type CloudWeatherData} from './cloudWeatherData';
import {loadSynopticIndex,loadSynopticField,type SynopticFrame,type SynopticModel} from './nativeSynopticFields';
import {loadNativeIndex,loadNativeField} from './nativeModelFields';

export type SurroundingsCloudImage={
 url:string;
 bounds:[[number,number],[number,number]];
 model:string;
 run:string;
 validTime:string;
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
 return candidates;
}

/** The highest-priority candidate remains the default; the loader may retry other proven models. */
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
function displayCloudFrame(data:CloudWeatherData,label:string,lat:number,lon:number,now:number):SurroundingsCloudImage{
 if(!admissibleSurroundingsCloudTime(data.time,data.run,now)||!usableAtSite(data,lat,lon))
  throw new Error('Für den gewählten Ort und Zeitpunkt kein verifiziertes Modellfeld verfügbar.');
 const url=cloudWeatherRaster(data,'pseudo');
 if(!url.startsWith('data:image/png'))throw new Error('Modellbild nicht bereit.');
 return {url,bounds:[[data.lats[0],data.lons[0]],[data.lats.at(-1)!,data.lons.at(-1)!]],model:label,run:data.run,validTime:data.time};
}
export async function loadVerifiedSurroundingsCloud(lat:number,lon:number,now:number,signal:AbortSignal):Promise<SurroundingsCloudImage>{
 try{
  const {index,base}=await loadSynopticIndex(signal);
  // A time-valid ICON-D2 field may be geographically invalid at the user's site.
  // Try the next SHA-verified model instead of falling back directly to native D2.
  for(const selected of chooseSurroundingsCloudFrames(index.models,now)){
   const {modelId,model,ref,independent}=selected;
   try{
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
 const targetBucket=Math.floor(target/(30*60000));
 useEffect(()=>{
  if(!enabled){setResult({image:null,loading:false,unavailable:false});return}
  const controller=new AbortController();
  setResult({image:null,loading:true,unavailable:false});
  const now=targetBucket*30*60000;
  const timer=window.setTimeout(()=>{
   if(!controller.signal.aborted){setResult({image:null,loading:false,unavailable:true});controller.abort()}
  },18000);
  void loadVerifiedSurroundingsCloud(lat,lon,now,controller.signal).then(image=>{
   if(!controller.signal.aborted)setResult({image,loading:false,unavailable:false});
  }).catch(()=>{if(!controller.signal.aborted)setResult({image:null,loading:false,unavailable:true})})
  .finally(()=>window.clearTimeout(timer));
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[enabled,lat,lon,targetBucket]);
 return result;
}
