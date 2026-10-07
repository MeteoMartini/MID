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
export function nativeIsobarFeatures(contours:{level:number;paths:number[][][]}[]){
 return {type:'FeatureCollection' as const,features:contours.flatMap(c=>c.paths.filter(path=>path.length>=2).map(path=>({
  type:'Feature' as const,properties:{level:c.level,label:`${Math.round(c.level)} hPa`},
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
