import {Capacitor,type PluginListenerHandle} from '@capacitor/core';

export type MidRuntimePlatform='web'|'ios'|'android';
export type MidNativeAppState={isActive:boolean;platform:Exclude<MidRuntimePlatform,'web'>};
export type MidNativeUrlOpen={url:string;platform:Exclude<MidRuntimePlatform,'web'>};

let bridgeStarted=false;
let pendingNativeUrl='';
const listenerHandles:PluginListenerHandle[]=[];

export function midRuntimePlatform():MidRuntimePlatform{
 const platform=Capacitor.getPlatform();
 return platform==='ios'||platform==='android'?platform:'web';
}

export function isMidNativeRuntime(){return Capacitor.isNativePlatform()&&midRuntimePlatform()!=='web'}
export function takePendingMidNativeUrl(){const url=pendingNativeUrl;pendingNativeUrl='';return url}

export function prepareMidRuntimeDocument(){
 if(typeof document==='undefined')return;
 const platform=midRuntimePlatform();
 document.documentElement.dataset.midRuntime=platform;
 document.documentElement.classList.toggle('mid-native-runtime',platform!=='web');
}

async function syncNativeStatusBar(dark:boolean){
 if(!isMidNativeRuntime())return;
 const{StatusBar,Style}=await import('@capacitor/status-bar');
 await StatusBar.setOverlaysWebView({overlay:false}).catch(()=>undefined);
 await StatusBar.setStyle({style:dark?Style.Light:Style.Dark}).catch(()=>undefined);
}

export async function startMidNativeRuntimeBridge(){
 if(!isMidNativeRuntime()||bridgeStarted)return;
 bridgeStarted=true;
 const platform=midRuntimePlatform() as Exclude<MidRuntimePlatform,'web'>;
 const{App}=await import('@capacitor/app');
 const publishUrl=(url:string)=>{if(!url)return;pendingNativeUrl=url;window.dispatchEvent(new CustomEvent<MidNativeUrlOpen>('mid:native-url-open',{detail:{url,platform}}))};
 listenerHandles.push(await App.addListener('appStateChange',state=>{
  window.dispatchEvent(new CustomEvent<MidNativeAppState>('mid:native-app-state',{detail:{isActive:state.isActive,platform}}));
 }));
 listenerHandles.push(await App.addListener('appUrlOpen',event=>{
  publishUrl(event.url);
 }));
 const launch=await App.getLaunchUrl().catch(()=>undefined);
 if(launch?.url)publishUrl(launch.url);
 const themeListener=(event:Event)=>void syncNativeStatusBar(Boolean((event as CustomEvent<{dark?:boolean}>).detail?.dark));
 window.addEventListener('mid:theme-change',themeListener);
 await syncNativeStatusBar(document.documentElement.dataset.theme==='dark');
}

export async function markMidNativeRuntimeReady(){
 if(!isMidNativeRuntime())return;
 const{SplashScreen}=await import('@capacitor/splash-screen');
 await SplashScreen.hide().catch(()=>undefined);
}

export async function stopMidNativeRuntimeBridge(){
 await Promise.all(listenerHandles.splice(0).map(handle=>handle.remove().catch(()=>undefined)));
 bridgeStarted=false;
}
