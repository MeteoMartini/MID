import {isMidNativeRuntime} from './runtimePlatform';

export type MidLocationPosition={
 coords:{
  latitude:number;
  longitude:number;
  altitude:number|null;
  accuracy:number;
  altitudeAccuracy:number|null;
  heading:number|null;
  speed:number|null;
 };
 timestamp:number;
 source:'native'|'browser';
};

export type MidLocationOptions={
 enableHighAccuracy?:boolean;
 timeout?:number;
 maximumAge?:number;
};

const DEFAULT_OPTIONS:Required<MidLocationOptions>={
 enableHighAccuracy:true,
 timeout:15_000,
 maximumAge:120_000
};

function normalizedCoordinates(coords:{latitude:number;longitude:number;accuracy:number;altitude?:number|null;altitudeAccuracy?:number|null;heading?:number|null;speed?:number|null}):MidLocationPosition['coords']{
 return {
  latitude:coords.latitude,
  longitude:coords.longitude,
  accuracy:coords.accuracy,
  altitude:coords.altitude??null,
  altitudeAccuracy:coords.altitudeAccuracy??null,
  heading:coords.heading??null,
  speed:coords.speed??null
 };
}

function browserCurrentPosition(options:Required<MidLocationOptions>):Promise<MidLocationPosition>{
 return new Promise((resolve,reject)=>{
  if(typeof navigator==='undefined'||!navigator.geolocation){
   reject(new Error('Standortermittlung nicht unterstützt.'));
   return;
  }
  navigator.geolocation.getCurrentPosition(
   position=>resolve({coords:normalizedCoordinates(position.coords),timestamp:position.timestamp,source:'browser'}),
   reject,
   options
  );
 });
}

function nativeFallbackAllowed(reason:unknown){
 const code=typeof reason==='object'&&reason!==null&&'code'in reason?String((reason as{code?:unknown}).code):'';
 return code!=='OS-PLUG-GLOC-0003'&&code!=='OS-PLUG-GLOC-0008';
}

/**
 * One-shot location adapter. It never starts a location watch or background
 * tracking. Browser/PWA keeps the existing navigator.geolocation behavior;
 * native runtimes use the Capacitor plugin and fall back to the browser API
 * only when the native bridge is unavailable or fails for a non-denial reason.
 */
export async function getMidCurrentPosition(input:MidLocationOptions={}):Promise<MidLocationPosition>{
 const options={...DEFAULT_OPTIONS,...input};
 if(!isMidNativeRuntime())return browserCurrentPosition(options);
 try{
  const{Geolocation}=await import('@capacitor/geolocation');
  let permission=await Geolocation.checkPermissions();
  if(permission.location==='prompt'||permission.location==='prompt-with-rationale'){
   permission=await Geolocation.requestPermissions({permissions:['location']});
  }
  if(permission.location!=='granted'){
   const denied=Object.assign(new Error('Standortberechtigung wurde nicht erteilt.'),{code:'OS-PLUG-GLOC-0003'});
   throw denied;
  }
  const position=await Geolocation.getCurrentPosition(options);
  return {coords:normalizedCoordinates(position.coords),timestamp:position.timestamp,source:'native'};
 }catch(reason){
  if(!nativeFallbackAllowed(reason))throw reason;
  return browserCurrentPosition(options);
 }
}
