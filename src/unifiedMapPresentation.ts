import type {WeatherMapMetadata} from './WeatherMapsData';
import type {UnifiedMapSettings} from './unifiedMapCatalog';

/** Observation images keep their native rendering. Only the additional model layer changes. */
export function unifiedMapPresentation(settings:Pick<UnifiedMapSettings,'presentation'>,observations:boolean){
 return settings.presentation==='auto'?(observations?'lines':'fill'):settings.presentation;
}
/** Use only advertised provider styles, including level-specific restrictions. Never guess a WMS style. */
export function unifiedWmsLineStyle(metadata:WeatherMapMetadata|null,level:number|undefined){
 return metadata?.styles?.find(style=>{
  if(!/(?:isoline|windbarb)/i.test(style.name))return false;
  const restricted=style.name.match(/_(250|500|850)(?:hPa)?_isoline/i);
  return !restricted||Number(restricted[1])===level;
 })?.name;
}
/** Reconnect consecutive two-point wire segments into the original line strips.
 * Keeps all vertices/extrema without changing the published map-field schema.
 * Closed loops remain independent so unrelated touching contours are not joined.
 */
export function joinNativeContourSegments(paths:number[][][]){
 const strips:number[][][]=[];
 for(const path of paths){
  if(path.length<2)continue;
  const tail=strips[strips.length-1],last=tail?.[tail.length-1];
  if(last&&last[0]===path[0][0]&&last[1]===path[0][1]&&
     !(tail.length>2&&tail[0][0]===last[0]&&tail[0][1]===last[1])){
   for(let i=1;i<path.length;i++)tail.push(path[i]);
  }else strips.push([...path]);
 }
 return strips;
}
export function nativeIsobarFeatures(contours:{level:number;spacingKm?:number;paths:number[][][]}[]){
 return {type:'FeatureCollection' as const,features:contours.flatMap(c=>joinNativeContourSegments(c.paths).map(path=>({
  type:'Feature' as const,properties:{level:c.level,...(c.spacingKm!==undefined?{spacingKm:c.spacingKm}:{}),label:`${Math.round(c.level)} hPa`},
  geometry:{type:'LineString' as const,coordinates:path.map(([lat,lon])=>[lon,lat])}
 })))};
}

export function unifiedWmsFillStyle(metadata:WeatherMapMetadata|null,level?:number){
 return metadata?.styles?.find(style=>{
  if(!(style.rendering==='fill'||/(?:isoarea|lawa)/i.test(style.name))||/spread/i.test(style.name))return false;
  if(level===undefined)return true;
  if(/below500hPa/i.test(style.name))return level>500;
  const restricted=style.name.match(/_(250|500|850)hPa_/i);
  return !restricted||Number(restricted[1])===level;
 })?.name;
}
