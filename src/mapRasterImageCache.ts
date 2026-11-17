/**
 * Bounded decoded-image reuse for immutable, explicitly timestamped WMS frames.
 *
 * This is a network/decode optimization only: it grants no meteorological source
 * validity, coverage, NoData or MapLibre GPU-ready status. Callers must still
 * verify their own original source times and the subsequent renderer 'render'
 * / isSourceLoaded barrier before displaying or re-labeling an image.
 *
 * Do not cache unversioned "latest" WMS snapshots, data/blob URLs, or products
 * missing an exact UTC TIME or viewport dimensions.
 */
export type MapImageLike = {readonly naturalWidth:number;readonly naturalHeight:number};
export type MapImageCacheOptions = {maxEntries?:number;maxBytes?:number;ttlMs?:number;now?:()=>number};

const DEFAULT_MAX_ENTRIES=8;
const DEFAULT_MAX_BYTES=8*1024*1024;
const DEFAULT_TTL_MS=120_000;
const SOURCE_LOAD_TIMEOUT_MS=20_000;
const EXACT_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/;

function oneParam(search:URLSearchParams,key:string):string|undefined{
 const values=[...search.entries()].filter(([k])=>k.toLowerCase()===key).map(([,v])=>v);
 return values.length===1?values[0]:undefined;
}

/** Full original WMS URL is the cache key: provider, layer, BBOX, dimensions, TIME
 * and query revision remain distinct. Never normalize away source identity.
 */
export function isDatedMapWmsFrame(url:string):boolean{
 if(!url||url.startsWith('data:')||url.startsWith('blob:'))return false;
 try{
  const parsed=new URL(url);
  if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)return false;
  if(oneParam(parsed.searchParams,'service')?.toUpperCase()!=='WMS'||
     oneParam(parsed.searchParams,'request')?.toUpperCase()!=='GETMAP')return false;
  const original=oneParam(parsed.searchParams,'time');
  if(!original||!EXACT_UTC.test(original)||!Number.isFinite(Date.parse(original)))return false;
  if(!oneParam(parsed.searchParams,'layers')?.trim()||
     !oneParam(parsed.searchParams,'bbox')?.trim())return false;
  const width=Number(oneParam(parsed.searchParams,'width'));
  const height=Number(oneParam(parsed.searchParams,'height'));
  if(!Number.isSafeInteger(width)||width<1||width>8192||
     !Number.isSafeInteger(height)||height<1||height>8192)return false;
  return true;
 }catch{return false}
}

type Resolved<T>={image:T;bytes:number;storedAt:number};
function decodedBytes(image:MapImageLike):number{
 const w=image.naturalWidth,h=image.naturalHeight;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1)return 0;
 const bytes=w*h*4;
 return Number.isSafeInteger(bytes)?bytes:0;
}

/** Injectable loader makes concurrent reuse and failure/eviction testable without
 * relying on DOM timing. The implementation does not trigger speculative prefetch.
 */
export function createMapImageCache<T extends MapImageLike>(
 loader:(url:string)=>Promise<T>, options:MapImageCacheOptions={}
){
 const maxEntries=Number.isSafeInteger(options.maxEntries)&&options.maxEntries!>0?options.maxEntries!:DEFAULT_MAX_ENTRIES;
 const maxBytes=Number.isSafeInteger(options.maxBytes)&&options.maxBytes!>0?options.maxBytes!:DEFAULT_MAX_BYTES;
 const ttlMs=Number.isFinite(options.ttlMs)&&options.ttlMs!>0?options.ttlMs!:DEFAULT_TTL_MS;
 const clock=options.now??Date.now;
 const ready=new Map<string,Resolved<T>>();
 const pending=new Map<string,Promise<T>>();
 let generation=0;
 function prune(at:number){
  for(const [key,item] of ready)if(!Number.isFinite(at)||at<item.storedAt||at-item.storedAt>ttlMs)ready.delete(key);
 }
 function trim(){
  let bytes=0;
  for(const item of ready.values())bytes+=item.bytes;
  while((ready.size>maxEntries||bytes>maxBytes)&&ready.size){
   const oldest=ready.keys().next().value as string;
   bytes-=ready.get(oldest)!.bytes;
   ready.delete(oldest);
  }
 }
 function load(url:string):Promise<T>{
  if(!isDatedMapWmsFrame(url))return loader(url);
  const at=clock();prune(at);
  const cached=ready.get(url);
  if(cached){
   ready.delete(url);ready.set(url,cached);
   return Promise.resolve(cached.image);
  }
  const shared=pending.get(url);
  if(shared)return shared;
  if(pending.size>=maxEntries)return loader(url);
  const fromGeneration=generation;
  const task=loader(url).then(image=>{
   const bytes=decodedBytes(image);
   if(fromGeneration===generation&&bytes>0&&bytes<=maxBytes){
    ready.delete(url);ready.set(url,{image,bytes,storedAt:clock()});
    trim();
   }
   return image;
  }).finally(()=>{if(pending.get(url)===task)pending.delete(url)});
  pending.set(url,task);
  return task;
 }
 return {
  load,
  clear:()=>{generation++;ready.clear();pending.clear()},
  stats:()=>{
   prune(clock());
   return {images:ready.size,bytes:[...ready.values()].reduce((sum,item)=>sum+item.bytes,0),pending:pending.size};
  }
 };
}

function loadBrowserImage(url:string):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const image=new Image();
  let completed=false;
  const finish=(failure?:Error)=>{
   if(completed)return;
   completed=true;
   clearTimeout(watchdog);
   image.onload=null;image.onerror=null;
   if(failure){image.removeAttribute('src');reject(failure)}
   else resolve(image);
  };
  const watchdog=setTimeout(()=>finish(new Error('Kartenbild: Ladezeitüberschreitung nach 20 Sekunden.')),SOURCE_LOAD_TIMEOUT_MS);
  image.onload=()=>image.naturalWidth&&image.naturalHeight?finish():finish(new Error('Kartenbild ohne dekodierbare Pixel.'));
  image.onerror=()=>finish(new Error('Kartenbild konnte nicht geladen werden.'));
  image.src=url;
  // A synchronously available browser-cache image may already be decoded.
  if(image.complete&&image.naturalWidth&&image.naturalHeight)queueMicrotask(()=>finish());
 });
}

/** Shared MapLibre ImageQuadLayer loader; all source readiness/crossfading stays
 * in the existing layer component. No new HTTP requests for revisited WMS TIME
 * and BBOX while this small, bounded in-memory entry remains fresh.
 */
const browserMapImages=createMapImageCache(loadBrowserImage);
export const loadMapImageForQuad=(url:string)=>browserMapImages.load(url);
