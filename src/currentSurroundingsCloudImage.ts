import {useEffect,useState} from 'react';
import {deferSurroundingsCloudRead} from './surroundingsCloudScheduler';
import {matchesSurroundingsCloudRequest,matchesSurroundingsCloudReference,MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS} from './surroundingsCloudOriginalGuard';
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
 requestLatitude?:number;
 requestLongitude?:number;
 requestTargetTime?:string; // Only for a clearly labelled, non-target reference image.
 originalTimes?:[string,string];
 sigwxTime?:string;
};
export type SurroundingsCloudResult={image:SurroundingsCloudImage|null;reference:SurroundingsCloudImage|null;loading:boolean;unavailable:boolean};
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
/** Choose a *different* source time solely for an explicitly labelled reference preview.
 * Missing exact 15-minute forecast targets remain NoData. No interpolation, WMO
 * category synthesis, nearest-future substitution, cross-run or stale reuse.
 */
export function chooseSurroundingsCloudReferences(
 models:Record<string,SynopticModel>,target:number
):Array<{modelId:string;model:SynopticModel;ref:SynopticFrame;independent:boolean}>{
 const candidates:Array<{modelId:string;model:SynopticModel;ref:SynopticFrame;independent:boolean}>=[];
 for(const modelId of MODEL_PRIORITY){
  const model=models[modelId];
  if(!model)continue;
  const eligible=[
   ...(model.cloudWeatherFrames??[]).map(ref=>({ref,independent:true})),
   ...model.frames.filter(ref=>ref.cloudWeather===true).map(ref=>({ref,independent:false}))
  ].filter(item=>{
   const time=Date.parse(item.ref.time);
   return Number.isFinite(time)&&time<target&&
    target-time<=MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS&&
    admissibleSurroundingsCloudTime(item.ref.time,model.run,target);
  }).sort((a,b)=>Date.parse(b.ref.time)-Date.parse(a.ref.time));
  if(eligible[0])candidates.push({modelId,model,...eligible[0]});
 }
 // Freshest confirmed *past* original first, then established model family.
 return candidates.sort((a,b)=>Date.parse(b.ref.time)-Date.parse(a.ref.time)||
  MODEL_PRIORITY.indexOf(a.modelId as typeof MODEL_PRIORITY[number])-
  MODEL_PRIORITY.indexOf(b.modelId as typeof MODEL_PRIORITY[number]));
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
    // A 15-minute selector is not a native 15-minute dataset.
    // Render only exact SHA-bound source frames. Missing slots remain NoData:
    // never create temporal cloud animation or borrow a WMO SigWx category.
    if(Date.parse(ref.time)!==now)continue;
    const exact=independent
     ?await loadCloudWeatherField(base,modelId,model,ref,signal)
     :synopticCloudWeather(await loadSynopticField(base,modelId,model,ref,signal));
    return displayCloudFrame(exact,model.label,lat,lon,now);
   }catch(error){if(signal.aborted)throw error}
  }
 }catch(error){if(signal.aborted)throw error}
 // Retain the established SHA-validated ICON-D2 paired original fields as a fallback.
 const {index,base}=await loadNativeIndex(signal);
 const cloudRefs=index.products.cloud?.frames??[],weatherRefs=index.products.sigwx?.frames??[];
 const paired=cloudRefs.filter(ref=>Date.parse(ref.time)===now&&weatherRefs.some(other=>other.time===ref.time)&&admissibleSurroundingsCloudTime(ref.time,index.run,now))
  .sort((a,b)=>Math.abs(Date.parse(a.time)-now)-Math.abs(Date.parse(b.time)-now));
 const ref=paired[0],weather=ref&&weatherRefs.find(other=>other.time===ref.time);
 if(!ref||!weather)throw new Error('Kein originales Wolken- und SigWx-Feld für genau diesen 15-Minuten-Termin vorhanden.');
 const [cloudField,weatherField]=await Promise.all([
  loadNativeField(index,base,ref,'cloud',signal),loadNativeField(index,base,weather,'sigwx',signal)
 ]);
 return displayCloudFrame(nativeCloudWeatherPair(cloudField,weatherField),'DWD ICON-D2',lat,lon,now);
}
/** Load a separate, bounded PREVIOUS original for contextual reference only.
 * Never return this as a frame for the requested 15-minute target.
 */
export async function loadSurroundingsCloudReference(
 lat:number,lon:number,target:number,signal:AbortSignal
):Promise<SurroundingsCloudImage>{
 try{
  const {index,base}=await loadEstablishedSynopticIndex(signal);
  for(const selected of chooseSurroundingsCloudReferences(index.models,target)){
   const {modelId,model,ref,independent}=selected;
   try{
    const original=independent
     ?await loadCloudWeatherField(base,modelId,model,ref,signal)
     :synopticCloudWeather(await loadSynopticField(base,modelId,model,ref,signal));
    if(Date.parse(original.time)!==Date.parse(ref.time))continue;
    return displayCloudFrame(original,model.label,lat,lon,target);
   }catch(error){if(signal.aborted)throw error}
  }
 }catch(error){if(signal.aborted)throw error}
 // Same-run native cloud/WW pair at a confirmed earlier original time.
 const {index,base}=await loadNativeIndex(signal);
 const cloudRefs=index.products.cloud?.frames??[],weatherRefs=index.products.sigwx?.frames??[];
 const earlier=cloudRefs.filter(ref=>{
  const time=Date.parse(ref.time);
  return Number.isFinite(time)&&time<target&&
   target-time<=MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS&&
   admissibleSurroundingsCloudTime(ref.time,index.run,target)&&
   weatherRefs.some(other=>other.time===ref.time);
 }).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
 for(const ref of earlier){
  const weather=weatherRefs.find(other=>other.time===ref.time);
  if(!weather)continue;
  try{
   const [cloudField,weatherField]=await Promise.all([
    loadNativeField(index,base,ref,'cloud',signal),
    loadNativeField(index,base,weather,'sigwx',signal)
   ]);
   return displayCloudFrame(nativeCloudWeatherPair(cloudField,weatherField),'DWD ICON-D2',lat,lon,target);
  }catch(error){if(signal.aborted)throw error}
 }
 throw new Error('Kein bestätigtes früheres Wolken-/SigWx-Original innerhalb von 45 Minuten verfügbar.');
}

export function useSurroundingsCloudImage(enabled:boolean,lat:number,lon:number,target:number):SurroundingsCloudResult{
 const [result,setResult]=useState<SurroundingsCloudResult>({image:null,reference:null,loading:enabled,unavailable:false});
 // Do not refetch a full validated model raster on every 30-second UI clock update.
 const targetBucket=Math.floor(target/(15*60000));
 useEffect(()=>{
  if(!enabled){setResult({image:null,reference:null,loading:false,unavailable:false});return}
  const controller=new AbortController();
  setResult(previous=>{
   const exact=previous.image&&Date.parse(previous.image.validTime)===target&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,target)
    ?previous.image:null;
   const reference=!exact&&previous.reference&&matchesSurroundingsCloudReference(previous.reference,lat,lon,target)
    ?previous.reference:null;
   return {image:exact,reference,loading:true,unavailable:false};
  });
  // Bucket changes limit network reloads; raster time uses the precise selected instant.
  const now=target;
  let requestTimeout:number|undefined; // window.setTimeout is a DOM timer, even with Node ambient types
  // Coalesce rapid UTC quarter-hour scrubs before initiating any SHA-bound
  // field download/raster decode. Replaced requests are never started.
  const cancelPending=deferSurroundingsCloudRead(()=>{
   if(controller.signal.aborted)return;
   requestTimeout=window.setTimeout(()=>{
    if(!controller.signal.aborted){
     setResult(previous=>({
      image:previous.image&&Date.parse(previous.image.validTime)===target&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,now)?previous.image:null,
      reference:previous.reference&&matchesSurroundingsCloudReference(previous.reference,lat,lon,target)?previous.reference:null,
      loading:false,unavailable:true
     }));
     controller.abort();
    }
   },18000);
   void loadVerifiedSurroundingsCloud(lat,lon,now,controller.signal).then(image=>{
    if(!controller.signal.aborted)setResult({image:{...image,requestLatitude:lat,requestLongitude:lon},reference:null,loading:false,unavailable:false});
   }).catch(async()=>{
    if(controller.signal.aborted)return;
    try{
     const reference=await loadSurroundingsCloudReference(lat,lon,now,controller.signal);
     if(!controller.signal.aborted)setResult({
      image:null,reference:{...reference,requestTargetTime:new Date(now).toISOString(),requestLatitude:lat,requestLongitude:lon},
      loading:false,unavailable:false
     });
    }catch{
     if(!controller.signal.aborted)setResult(previous=>({
      image:previous.image&&Date.parse(previous.image.validTime)===target&&admissibleSurroundingsCloudTime(previous.image.validTime,previous.image.run,now)?previous.image:null,
      reference:previous.reference&&matchesSurroundingsCloudReference(previous.reference,lat,lon,target)?previous.reference:null,
      loading:false,unavailable:true
     }));
    }
   }).finally(()=>{if(requestTimeout!==undefined)window.clearTimeout(requestTimeout)});
  });
  return()=>{
   cancelPending();
   if(requestTimeout!==undefined)window.clearTimeout(requestTimeout);
   controller.abort();
  };
 },[enabled,lat,lon,targetBucket]);
 // Hide stale image synchronously before the next useEffect (time or location).
 // A real failed refresh keeps its NoData/error status rather than claiming loading.
 const image=result.image&&matchesSurroundingsCloudRequest(result.image,lat,lon,target)?result.image:null;
 const reference=!image&&result.reference&&matchesSurroundingsCloudReference(result.reference,lat,lon,target)
  ?result.reference:null;
 return image===result.image&&reference===result.reference?result:{...result,image,reference};
}
