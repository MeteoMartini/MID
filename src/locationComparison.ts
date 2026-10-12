import {mapHours,type Weather,type Hour,type EnsembleDay,type Location,type OfficialAlert} from './weather';
export type CompareProfile='dry'|'outdoor'|'mild';
export type PlaceForecast={id:string;label:string;location:Location;weather?:Weather;ensemble?:EnsembleDay[];alerts?:OfficialAlert[];warningError?:string;error?:string;loading?:boolean;fetchedAt?:number};
export type ComparisonRow={place:PlaceForecast;distance:number;hours:Hour[];coverage:number;complete:boolean;stale:boolean;dryHours:number;dryStart?:number;suitable:number;rain:number|null;probability:number|null;gust:number|null;min:number|null;max:number|null;spread:number|null;warnings:OfficialAlert[];priority:number;change:boolean};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export function distanceKm(a:Location,b:Location){const r=Math.PI/180,d=(b.latitude-a.latitude)*r,l=(b.longitude-a.longitude)*r,q=Math.sin(d/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(l/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)))}
export function comparisonHours(w:Weather){return mapHours(w).map((h,i)=>({...h,precipitation:finite(w.hourly.precipitation?.[i])?h.precipitation:NaN,probability:!w._mid_core_proxy?.fallback&&w._mid_core_proxy?.precipitationProbabilityAvailable!==false&&finite(w.hourly.precipitation_probability?.[i])?h.probability:NaN,temperature:finite(w.hourly.temperature_2m?.[i])?h.temperature:NaN,gust:finite(w.hourly.wind_gusts_10m?.[i])?h.gust:NaN}))}
export function comparePlace(place:PlaceForecast,origin:Location,start:number,count:number,profile:CompareProfile='dry'):ComparisonRow{
 const source=place.weather?comparisonHours(place.weather):[],slots=Array.from({length:count},(_,i)=>source.find(h=>h.epoch===start+i*3600000)),hours=slots.filter((h):h is Hour=>Boolean(h)),valid=slots.filter(h=>h&&[h.temperature,h.gust,h.precipitation,h.probability].every(finite)).length;
 const stale=Boolean(place.weather?._mid_core_proxy?.stale)||(place.weather?._mid_core_proxy?.ageMs??0)>3*3600000;
 let longest=0,run=0,dryStart:number|undefined,bestStart:number|undefined,suitable=0;
 for(const h of slots){const dry=Boolean(h&&finite(h.precipitation)&&h.precipitation<.1&&finite(h.probability)&&h.probability<=30);if(dry){if(!run)dryStart=h!.epoch;run++;if(run>longest){longest=run;bestStart=dryStart}}else run=0;if(h&&dry&&finite(h.gust)&&h.gust<=20&&finite(h.temperature)&&h.temperature>=8&&h.temperature<=26)suitable++}
 const aggregate=(key:'precipitation'|'probability'|'gust'|'temperature',mode:'sum'|'max'|'min')=>slots.every(h=>h&&finite(h[key]))?mode==='sum'?hours.reduce((a,h)=>a+h[key],0):Math[mode](...hours.map(h=>h[key])):null;
 const rain=aggregate('precipitation','sum'),probability=aggregate('probability','max'),gust=aggregate('gust','max'),min=aggregate('temperature','min'),max=aggregate('temperature','max');
 const ensHours=place.ensemble?.flatMap(d=>d.temperatureHours??[]).filter(h=>h.epoch>=start&&h.epoch<start+count*3600000&&h.memberCount>=2&&finite(h.p25)&&finite(h.p75)&&h.p75>=h.p25)??[];
 const spread=ensHours.length===count&&new Set(ensHours.map(h=>h.epoch)).size===count?Math.max(...ensHours.map(h=>h.p75-h.p25)):null;
 const warnings=(place.alerts??[]).filter(a=>{const onset=Date.parse(a.onset||a.effective||''),expires=Date.parse(a.expires||'');return (!Number.isFinite(expires)||expires>start)&&(!Number.isFinite(onset)||onset<start+count*3600000)});
 const complete=valid===count&&!stale,change=hours.some((h,i)=>i>0&&finite(h.temperature)&&finite(hours[i-1].temperature)&&Math.abs(h.temperature-hours[i-1].temperature)>=3)||Boolean(probability!==null&&probability>=60);
 const priority=warnings.length?Math.max(...warnings.map(a=>({yellow:3,orange:4,red:5,purple:6,unknown:3}[a.level]))):!complete?2:spread!==null&&spread>=4||change?1:0;
 return {place,distance:distanceKm(origin,place.location),hours,coverage:valid,complete,stale,dryHours:longest,dryStart:bestStart,suitable:profile==='mild'?slots.filter(h=>h&&finite(h.temperature)&&h.temperature>=15&&h.temperature<=25&&finite(h.precipitation)&&h.precipitation<.1&&finite(h.probability)&&h.probability<=30).length:suitable,rain,probability,gust,min,max,spread,warnings,priority,change};
}
export function rankPlaces(rows:ComparisonRow[],profile:CompareProfile){return [...rows].sort((a,b)=>Number(b.complete)-Number(a.complete)||(a.complete&&b.complete?(profile==='dry'?b.dryHours-a.dryHours:b.suitable-a.suitable)||(a.rain??Infinity)-(b.rain??Infinity):0)||a.distance-b.distance||a.place.label.localeCompare(b.place.label,'de'))}

export const PLACE_SORT_OPTIONS=[['settings','Reihenfolge der Einstellungen'],['name','Ortsname A–Z'],['warnings','Warnlage zuerst'],['temperatureAsc','Temperatur: kühl zuerst'],['temperatureDesc','Temperatur: warm zuerst'],['rain','Niederschlagsmenge: wenig zuerst'],['gust','Böen: schwach zuerst'],['distance','Entfernung: nah zuerst']] as const;
export type PlaceSort=typeof PLACE_SORT_OPTIONS[number][0];
export function sortPlaceOverview(rows:ComparisonRow[],sort:PlaceSort):ComparisonRow[]{
 if(sort==='settings')return [...rows];
 const indexed=rows.map((row,index)=>({row,index}));
 const metric=(r:ComparisonRow)=>sort==='temperatureAsc'||sort==='temperatureDesc'?r.max:sort==='rain'?r.rain:sort==='gust'?r.gust:r.distance;
 return indexed.sort((a,b)=>{
  const x=a.row,y=b.row;
  if(sort==='name')return x.place.label.localeCompare(y.place.label,'de',{numeric:true,sensitivity:'base'})||a.index-b.index;
  if(sort==='warnings')return y.priority-x.priority||a.index-b.index;
  const xv=metric(x),yv=metric(y),validX=xv!==null&&Number.isFinite(xv)&&!x.stale&&!x.place.error&&!x.place.loading,validY=yv!==null&&Number.isFinite(yv)&&!y.stale&&!y.place.error&&!y.place.loading;
  return Number(validY)-Number(validX)||(validX&&validY?(sort==='temperatureDesc'?-1:1)*(xv!-yv!):0)||a.index-b.index;
 }).map(item=>item.row);
}
