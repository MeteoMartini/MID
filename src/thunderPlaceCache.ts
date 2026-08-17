import {reverseLocation,type Location} from './weather';
import {isoAlpha3} from './iso3166';

export type ThunderPlaceNames={site?:string;current?:string;forecast?:string};
const THUNDER_PLACE_CACHE_KEY='mid:thunder-place-cache:v3';
const THUNDER_PLACE_CACHE_TTL=12*3600000;
export function thunderPlaceGridKey(latitude:number|undefined,longitude:number|undefined){if(!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude)))return'';return`${Math.round(Number(latitude)*25)/25}:${Math.round(Number(longitude)*25)/25}`}
export function appendIsoCountry(name:string,countryValue?:string){const place=String(name||'').trim(),country=isoAlpha3(countryValue);if(!place||!country||new RegExp(`,\\s*${country}$`,'i').test(place))return place;return`${place}, ${country}`}
export function conciseThunderPlace(location:Location){
 const city=String(location.city||'').trim(),name=String(location.name||'').trim(),locality=String(location.locality||'').trim(),admin2=String(location.admin2||'').trim(),admin1=String(location.admin1||'').trim(),country=String(location.country||'').trim(),normalise=(value:string)=>value.toLocaleLowerCase('de-DE').replace(/[^a-zäöüß0-9]/g,''),blocked=new Set([country,admin1].filter(Boolean).map(normalise)),looksGeneric=(value:string)=>/\b(kreis|county|district|bezirk|department|arrondissement|province|provincia|powiat|oblast|region|staat|land)\b/i.test(value),usable=(value:string)=>Boolean(value&&!value.includes('°')&&!blocked.has(normalise(value))&&!looksGeneric(value)),candidate=[city,admin2,name,locality].find(usable)||'';
 return candidate?appendIsoCountry(candidate,location.country_code||location.country):'';
}
export function readThunderPlaceCache(key:string){if(!key)return'';try{const cache=JSON.parse(localStorage.getItem(THUNDER_PLACE_CACHE_KEY)||'{}') as Record<string,{at:number;name:string}>,entry=cache[key];return entry&&Number.isFinite(entry.at)&&Date.now()-entry.at<=THUNDER_PLACE_CACHE_TTL?String(entry.name||''):''}catch{return''}}
function writeThunderPlaceCache(key:string,name:string){if(!key||!name)return;try{const raw=JSON.parse(localStorage.getItem(THUNDER_PLACE_CACHE_KEY)||'{}') as Record<string,{at:number;name:string}>,entries=Object.entries(raw).filter(([,entry])=>Number.isFinite(entry?.at)&&Date.now()-entry.at<=THUNDER_PLACE_CACHE_TTL).sort((a,b)=>b[1].at-a[1].at).slice(0,39);localStorage.setItem(THUNDER_PLACE_CACHE_KEY,JSON.stringify(Object.fromEntries([[key,{at:Date.now(),name}],...entries.filter(([entryKey])=>entryKey!==key)])))}catch{}}
export async function resolveThunderPlace(latitude:number|undefined,longitude:number|undefined,signal:AbortSignal){const key=thunderPlaceGridKey(latitude,longitude),cached=readThunderPlaceCache(key);if(cached)return cached;if(!key)return'';const location=await reverseLocation(Number(latitude),Number(longitude),undefined,signal),name=conciseThunderPlace(location);writeThunderPlaceCache(key,name);return name}
