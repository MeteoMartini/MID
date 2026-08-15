import type {Weather} from './weather';
import {Body,Equator,Horizon,Illumination,MoonPhase,NextLocalSolarEclipse,NextLunarEclipse,Observer,SearchAltitude,SearchHourAngle,SearchLocalSolarEclipse,SearchLunarEclipse,SearchMoonPhase,SearchRiseSet} from 'astronomy-engine';

const DAY_MS=86400000;
const MOON_CYCLE_DAYS=29.530588853;

type ZonedDateParts={year:number;month:number;day:number;hour:number;minute:number;second:number};
export type AstronomyEclipseEvent={
 type:'solar'|'lunar';
 kind:'partial'|'annular'|'total'|'penumbral';
 label:string;
 compactLabel:string;
 icon:string;
 start:Date;
 peak:Date;
 end:Date;
 obscuration?:number;
 altitude:number;
};
export type AstronomySummary={
 sunrise?:Date;
 sunset?:Date;
 solarNoon?:Date;
 civilDawn?:Date;
 civilDusk?:Date;
 nauticalDawn?:Date;
 nauticalDusk?:Date;
 astronomicalDawn?:Date;
 astronomicalDusk?:Date;
 blueHourMorningStart?:Date;
 blueHourMorningEnd?:Date;
 blueHourEveningStart?:Date;
 blueHourEveningEnd?:Date;
 goldenHourMorningEnd?:Date;
 goldenHourEveningStart?:Date;
 dayLengthSeconds:number;
 dayLengthChangeSeconds:number;
 moonrise?:Date;
 moonset?:Date;
 moonAlwaysUp:boolean;
 moonAlwaysDown:boolean;
 moonIcon:string;
 moonPhase:string;
 moonIllumination:number;
 moonAgeDays:number;
 moonPhaseFraction:number;
 daysUntilNewMoon:number;
 daysUntilFullMoon:number;
 nextEclipse?:AstronomyEclipseEvent;
 timezone:string;
};

function zonedParts(date:Date,timezone:string):ZonedDateParts{
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);
 return{year:value('year'),month:value('month'),day:value('day'),hour:value('hour'),minute:value('minute'),second:value('second')};
}
function zonedDateToUtc(year:number,month:number,day:number,hour:number,minute:number,second:number,timezone:string){
 const desired=Date.UTC(year,month-1,day,hour,minute,second);let guess=desired;
 for(let i=0;i<5;i++){const parts=zonedParts(new Date(guess),timezone),actual=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second),difference=desired-actual;if(Math.abs(difference)<1000)break;guess+=difference}
 return new Date(guess);
}
function localDateParts(date:Date,timezone:string){const parts=zonedParts(date,timezone);return{year:parts.year,month:parts.month,day:parts.day}}
function shiftDate(parts:{year:number;month:number;day:number},days:number){const date=new Date(Date.UTC(parts.year,parts.month-1,parts.day+days));return{year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()}}
function localDayWindow(parts:{year:number;month:number;day:number},timezone:string){const next=shiftDate(parts,1),start=zonedDateToUtc(parts.year,parts.month,parts.day,0,0,0,timezone),end=zonedDateToUtc(next.year,next.month,next.day,0,0,0,timezone);return{start,end,limitDays:Math.max(1,(end.getTime()-start.getTime())/DAY_MS+.08)}}
function inWindow(value:Date|undefined,start:Date,end:Date){return value&&value.getTime()>=start.getTime()&&value.getTime()<end.getTime()?value:undefined}
function observerFor(lat:number,lon:number,height:number){return new Observer(lat,lon,Number.isFinite(height)?height:0)}
function bodyAltitude(body:Body,date:Date,observer:Observer,refraction:'normal'|null='normal'){
 try{const equ=Equator(body,date,observer,true,true),horizontal=Horizon(date,observer,equ.ra,equ.dec,refraction??undefined);return Number(horizontal.altitude)}catch{return Number.NaN}
}
function riseSetWithin(body:Body,observer:Observer,direction:1|-1,start:Date,end:Date,limitDays:number){try{return inWindow(SearchRiseSet(body,observer,direction,start,limitDays,0)?.date,start,end)}catch{return undefined}}
function altitudeWithin(body:Body,observer:Observer,direction:1|-1,altitude:number,start:Date,end:Date,limitDays:number){try{return inWindow(SearchAltitude(body,observer,direction,start,limitDays,altitude)?.date,start,end)}catch{return undefined}}

export function sunTimesForDate(parts:{year:number;month:number;day:number},lat:number,lon:number,height:number,timezone:string){
 const observer=observerFor(lat,lon,height),{start,end,limitDays}=localDayWindow(parts,timezone),noonEvent=(()=>{try{return SearchHourAngle(Body.Sun,observer,0,start,1).time.date}catch{return undefined}})();
 return{
  sunrise:riseSetWithin(Body.Sun,observer,1,start,end,limitDays),sunset:riseSetWithin(Body.Sun,observer,-1,start,end,limitDays),solarNoon:inWindow(noonEvent,start,end),
  civilDawn:altitudeWithin(Body.Sun,observer,1,-6,start,end,limitDays),civilDusk:altitudeWithin(Body.Sun,observer,-1,-6,start,end,limitDays),
  nauticalDawn:altitudeWithin(Body.Sun,observer,1,-12,start,end,limitDays),nauticalDusk:altitudeWithin(Body.Sun,observer,-1,-12,start,end,limitDays),
  astronomicalDawn:altitudeWithin(Body.Sun,observer,1,-18,start,end,limitDays),astronomicalDusk:altitudeWithin(Body.Sun,observer,-1,-18,start,end,limitDays),
  blueHourMorningStart:altitudeWithin(Body.Sun,observer,1,-8,start,end,limitDays),blueHourMorningEnd:altitudeWithin(Body.Sun,observer,1,-4,start,end,limitDays),
  blueHourEveningStart:altitudeWithin(Body.Sun,observer,-1,-4,start,end,limitDays),blueHourEveningEnd:altitudeWithin(Body.Sun,observer,-1,-8,start,end,limitDays),
  goldenHourMorningEnd:altitudeWithin(Body.Sun,observer,1,6,start,end,limitDays),goldenHourEveningStart:altitudeWithin(Body.Sun,observer,-1,6,start,end,limitDays)
 };
}

export type SolarDaylightLocation={latitude:number;longitude:number;elevation?:number;timezone?:string};
export type SolarDaylightWindow={sunrise?:Date;sunset?:Date;timezone:string};
const solarDaylightCache=new Map<string,SolarDaylightWindow>();
function solarDaylightCacheKey(parts:{year:number;month:number;day:number},location:SolarDaylightLocation,timezone:string){return`${parts.year}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')}|${Number(location.latitude).toFixed(5)}|${Number(location.longitude).toFixed(5)}|${Math.round(Number(location.elevation)||0)}|${timezone}`}
/**
 * Kanonische astronomische Tag/Nacht-Grenze für alle zeitbezogenen MID-Wettersymbole.
 * Tag beginnt exakt mit Sonnenaufgang und endet mit Sonnenuntergang. Bürgerliche
 * Dämmerung verändert die Symbolfamilie bewusst nicht.
 */
export function solarDaylightWindowAt(at:Date|number,location:SolarDaylightLocation):SolarDaylightWindow{
 const date=at instanceof Date?at:new Date(at),timezone=location.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 if(!Number.isFinite(date.getTime())||!Number.isFinite(Number(location.latitude))||!Number.isFinite(Number(location.longitude)))return{timezone};
 const parts=localDateParts(date,timezone),key=solarDaylightCacheKey(parts,location,timezone),cached=solarDaylightCache.get(key);if(cached)return cached;
 const times=sunTimesForDate(parts,Number(location.latitude),Number(location.longitude),Number(location.elevation)||0,timezone),window={sunrise:times.sunrise,sunset:times.sunset,timezone};
 solarDaylightCache.set(key,window);if(solarDaylightCache.size>96){const first=solarDaylightCache.keys().next().value;if(first)solarDaylightCache.delete(first)}return window;
}
export function astronomicalIsDayAt(at:Date|number,location:SolarDaylightLocation,fallback=false){const date=at instanceof Date?at:new Date(at),window=solarDaylightWindowAt(date,location),sunrise=window.sunrise?.getTime(),sunset=window.sunset?.getTime();return Number.isFinite(sunrise)&&Number.isFinite(sunset)&&Number(sunset)>Number(sunrise)?date.getTime()>=Number(sunrise)&&date.getTime()<Number(sunset):fallback}

function dayLengthSeconds(sunrise?:Date,sunset?:Date){if(!sunrise||!sunset)return Number.NaN;const seconds=(sunset.getTime()-sunrise.getTime())/1000;return seconds>0&&seconds<DAY_MS/1000?seconds:Number.NaN}
function moonTimesForDate(parts:{year:number;month:number;day:number},lat:number,lon:number,height:number,timezone:string){
 const observer=observerFor(lat,lon,height),{start,end,limitDays}=localDayWindow(parts,timezone),moonrise=riseSetWithin(Body.Moon,observer,1,start,end,limitDays),moonset=riseSetWithin(Body.Moon,observer,-1,start,end,limitDays),altitudeAtStart=bodyAltitude(Body.Moon,new Date(start.getTime()+1000),observer,'normal'),noCrossing=!moonrise&&!moonset;
 return{moonrise,moonset,alwaysUp:noCrossing&&Number.isFinite(altitudeAtStart)&&altitudeAtStart>0,alwaysDown:noCrossing&&Number.isFinite(altitudeAtStart)&&altitudeAtStart<=0};
}
function nextPhaseDays(targetLongitude:number,at:Date){try{const phase=SearchMoonPhase(targetLongitude,at,40);return phase?Math.max(0,(phase.date.getTime()-at.getTime())/DAY_MS):Number.NaN}catch{return Number.NaN}}
function previousNewMoon(at:Date){
 try{
  const start=new Date(at.getTime()-35*DAY_MS);let event=SearchMoonPhase(0,start,40),last:Date|undefined;
  for(let index=0;index<3&&event;index++){
   if(event.date.getTime()>at.getTime()+1000)break;
   last=event.date;event=SearchMoonPhase(0,new Date(event.date.getTime()+60000),40);
  }
  return last;
 }catch{return undefined}
}
function angularDistance(a:number,b:number){const value=Math.abs(((a-b+540)%360)-180);return Math.min(180,value)}

function eclipseKind(value:unknown):AstronomyEclipseEvent['kind']{
 const normalized=String(value??'').toLowerCase();
 if(normalized.includes('annular'))return'annular';
 if(normalized.includes('total'))return'total';
 if(normalized.includes('penumbral'))return'penumbral';
 return'partial';
}
function eclipseLabels(type:AstronomyEclipseEvent['type'],kind:AstronomyEclipseEvent['kind']){
 if(type==='solar'){
  if(kind==='total')return{label:'Totale Sonnenfinsternis',compactLabel:'Totale Sonnenfinsternis',icon:'🌑'};
  if(kind==='annular')return{label:'Ringförmige Sonnenfinsternis',compactLabel:'Ringförmige Sonnenfinsternis',icon:'⭕'};
  return{label:'Partielle Sonnenfinsternis',compactLabel:'Partielle Sonnenfinsternis',icon:'🌘'};
 }
 if(kind==='total')return{label:'Totale Mondfinsternis',compactLabel:'Totale Mondfinsternis',icon:'🌕'};
 if(kind==='penumbral')return{label:'Halbschatten-Mondfinsternis',compactLabel:'Halbschatten-Mondfinsternis',icon:'🌕'};
 return{label:'Partielle Mondfinsternis',compactLabel:'Partielle Mondfinsternis',icon:'🌕'};
}
function nextVisibleSolarEclipse(at:Date,lat:number,lon:number,height:number):AstronomyEclipseEvent|undefined{
 try{
  const observer=observerFor(lat,lon,height);let eclipse=SearchLocalSolarEclipse(new Date(at.getTime()-12*3600000),observer);
  for(let index=0;index<8;index++){
   const peak=eclipse.peak.time.date,start=eclipse.partial_begin.time.date,end=eclipse.partial_end.time.date;
   if(peak.getTime()>at.getTime()&&eclipse.peak.altitude>0){const kind=eclipseKind(eclipse.kind),labels=eclipseLabels('solar',kind);return{type:'solar',kind,...labels,start,peak,end,obscuration:Math.max(0,Math.min(1,eclipse.obscuration)),altitude:eclipse.peak.altitude}}
   eclipse=NextLocalSolarEclipse(eclipse.peak.time,observer);
  }
 }catch{}
 return undefined;
}
function nextVisibleLunarEclipse(at:Date,lat:number,lon:number,height:number):AstronomyEclipseEvent|undefined{
 try{
  const observer=observerFor(lat,lon,height);let eclipse=SearchLunarEclipse(new Date(at.getTime()-12*3600000));
  for(let index=0;index<12;index++){
   const peak=eclipse.peak.date,altitude=bodyAltitude(Body.Moon,peak,observer,'normal');
   if(peak.getTime()>at.getTime()&&altitude>0){const kind=eclipseKind(eclipse.kind),labels=eclipseLabels('lunar',kind),halfMinutes=Math.max(0,eclipse.sd_penum);return{type:'lunar',kind,...labels,start:new Date(peak.getTime()-halfMinutes*60000),peak,end:new Date(peak.getTime()+halfMinutes*60000),obscuration:kind==='penumbral'?undefined:Math.max(0,Math.min(1,eclipse.obscuration)),altitude}}
   eclipse=NextLunarEclipse(eclipse.peak);
  }
 }catch{}
 return undefined;
}
const eclipseCache=new Map<string,{expires:number;event?:AstronomyEclipseEvent}>();
function nextEclipseForLocation(at:Date,lat:number,lon:number,height:number){
 const bucket=Math.floor(at.getTime()/(15*60*1000)),key=`${lat.toFixed(3)}:${lon.toFixed(3)}:${Math.round(height/25)}:${bucket}`,cached=eclipseCache.get(key);if(cached&&cached.expires>Date.now())return cached.event;
 const solar=nextVisibleSolarEclipse(at,lat,lon,height),lunar=nextVisibleLunarEclipse(at,lat,lon,height),event=!solar?lunar:!lunar?solar:solar.peak.getTime()<=lunar.peak.getTime()?solar:lunar;eclipseCache.clear();eclipseCache.set(key,{expires:Date.now()+15*60*1000,event});return event;
}
function moonDescriptor(phaseDegrees:number,ageDays:number){
 const phase=((phaseDegrees%360)+360)%360/360,icon=phase<.0625||phase>=.9375?'🌑':phase<.1875?'🌒':phase<.3125?'🌓':phase<.4375?'🌔':phase<.5625?'🌕':phase<.6875?'🌖':phase<.8125?'🌗':'🌘',principalTolerance=6.2;
 const phaseName=angularDistance(phaseDegrees,0)<=principalTolerance?'Neumond':angularDistance(phaseDegrees,90)<=principalTolerance?'Erstes Viertel':angularDistance(phaseDegrees,180)<=principalTolerance?'Vollmond':angularDistance(phaseDegrees,270)<=principalTolerance?'Letztes Viertel':phase<.25?'Zunehmende Sichel':phase<.5?'Zunehmender Mond':phase<.75?'Abnehmender Mond':'Abnehmende Sichel';
 return{icon,phaseName,age:Number.isFinite(ageDays)?ageDays:phase*MOON_CYCLE_DAYS,phase};
}

export function astronomySummary(w:Weather,at=new Date()):AstronomySummary{
 const timezone=w.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',today=localDateParts(at,timezone),yesterday=shiftDate(today,-1),height=Number(w.elevation)||0,sunToday=sunTimesForDate(today,w.latitude,w.longitude,height,timezone),sunYesterday=sunTimesForDate(yesterday,w.latitude,w.longitude,height,timezone),dayLength=dayLengthSeconds(sunToday.sunrise,sunToday.sunset),previousLength=dayLengthSeconds(sunYesterday.sunrise,sunYesterday.sunset),moonTimes=moonTimesForDate(today,w.latitude,w.longitude,height,timezone),phaseDegrees=((MoonPhase(at)%360)+360)%360,illumination=Illumination(Body.Moon,at),previousNew=previousNewMoon(at),ageDays=previousNew?Math.max(0,(at.getTime()-previousNew.getTime())/DAY_MS):phaseDegrees/360*MOON_CYCLE_DAYS,descriptor=moonDescriptor(phaseDegrees,ageDays),daysUntilNewMoon=nextPhaseDays(0,at),daysUntilFullMoon=nextPhaseDays(180,at),nextEclipse=nextEclipseForLocation(at,w.latitude,w.longitude,height);
 return{...sunToday,dayLengthSeconds:dayLength,dayLengthChangeSeconds:Number.isFinite(dayLength)&&Number.isFinite(previousLength)?dayLength-previousLength:Number.NaN,moonrise:moonTimes.moonrise,moonset:moonTimes.moonset,moonAlwaysUp:moonTimes.alwaysUp,moonAlwaysDown:moonTimes.alwaysDown,moonIcon:descriptor.icon,moonPhase:descriptor.phaseName,moonIllumination:Math.max(0,Math.min(1,Number(illumination.phase_fraction))),moonAgeDays:descriptor.age,moonPhaseFraction:descriptor.phase,daysUntilNewMoon,daysUntilFullMoon,nextEclipse,timezone};
}

export function formatAstronomyTime(value:Date|undefined,timezone:string){return value?new Intl.DateTimeFormat('de-DE',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(value):'–'}
export function formatDuration(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return'–';const totalMinutes=Math.round(seconds/60),hours=Math.floor(totalMinutes/60),minutes=totalMinutes%60;return`${hours} h ${String(minutes).padStart(2,'0')} min`}
export function formatDayLengthChange(seconds:number){if(!Number.isFinite(seconds))return'–';const minutes=Math.round(Math.abs(seconds)/60);if(minutes===0)return'±0 min';return`${seconds>0?'+':'−'}${minutes} min`}
