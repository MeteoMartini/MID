import type {Weather} from './weather';
import {NextLocalSolarEclipse,NextLunarEclipse,Observer,SearchLocalSolarEclipse,SearchLunarEclipse} from 'astronomy-engine';

const RAD=Math.PI/180;
const DAY_MS=86400000;
const J1970=2440588;
const J2000=2451545;
const E=RAD*23.4397;
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

function toJulian(date:Date){return date.valueOf()/DAY_MS-.5+J1970}
function fromJulian(j:number){return new Date((j+.5-J1970)*DAY_MS)}
function toDays(date:Date){return toJulian(date)-J2000}
function rightAscension(l:number,b:number){return Math.atan2(Math.sin(l)*Math.cos(E)-Math.tan(b)*Math.sin(E),Math.cos(l))}
function declination(l:number,b:number){return Math.asin(Math.sin(b)*Math.cos(E)+Math.cos(b)*Math.sin(E)*Math.sin(l))}
function siderealTime(d:number,lw:number){return RAD*(280.16+360.9856235*d)-lw}
function solarMeanAnomaly(d:number){return RAD*(357.5291+.98560028*d)}
function eclipticLongitude(m:number){const c=RAD*(1.9148*Math.sin(m)+.02*Math.sin(2*m)+.0003*Math.sin(3*m)),p=RAD*102.9372;return m+c+p+Math.PI}
function julianCycle(d:number,lw:number){return Math.round(d-.0009-lw/(2*Math.PI))}
function approxTransit(ht:number,lw:number,n:number){return .0009+(ht+lw)/(2*Math.PI)+n}
function solarTransitJ(ds:number,m:number,l:number){return J2000+ds+.0053*Math.sin(m)-.0069*Math.sin(2*l)}
function hourAngle(h:number,phi:number,d:number){const value=(Math.sin(h)-Math.sin(phi)*Math.sin(d))/(Math.cos(phi)*Math.cos(d));return Math.acos(Math.max(-1,Math.min(1,value)))}
function setJ(h:number,lw:number,phi:number,dec:number,n:number,m:number,l:number){const w=hourAngle(h,phi,dec),a=approxTransit(w,lw,n);return solarTransitJ(a,m,l)}

function zonedParts(date:Date,timezone:string):ZonedDateParts{
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);
 return{year:value('year'),month:value('month'),day:value('day'),hour:value('hour'),minute:value('minute'),second:value('second')};
}
function zonedDateToUtc(year:number,month:number,day:number,hour:number,minute:number,second:number,timezone:string){
 const desired=Date.UTC(year,month-1,day,hour,minute,second);let guess=desired;
 for(let i=0;i<4;i++){const parts=zonedParts(new Date(guess),timezone),actual=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second),difference=desired-actual;if(Math.abs(difference)<1000)break;guess+=difference}
 return new Date(guess);
}
function localDateParts(date:Date,timezone:string){const parts=zonedParts(date,timezone);return{year:parts.year,month:parts.month,day:parts.day}}
function shiftDate(parts:{year:number;month:number;day:number},days:number){const date=new Date(Date.UTC(parts.year,parts.month-1,parts.day+days));return{year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()}}

function sunTimesForDate(parts:{year:number;month:number;day:number},lat:number,lon:number,timezone:string){
 const sample=zonedDateToUtc(parts.year,parts.month,parts.day,12,0,0,timezone),lw=RAD*-lon,phi=RAD*lat,d=toDays(sample),n=julianCycle(d,lw),ds=approxTransit(0,lw,n),m=solarMeanAnomaly(ds),l=eclipticLongitude(m),dec=declination(l,0),jNoon=solarTransitJ(ds,m,l);
 const pair=(altitudeDegrees:number)=>{const altitude=RAD*altitudeDegrees,ratio=(Math.sin(altitude)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec));if(!Number.isFinite(ratio)||ratio<-1||ratio>1)return{rise:undefined,set:undefined};const jSet=setJ(altitude,lw,phi,dec,n,m,l),jRise=jNoon-(jSet-jNoon);return{rise:Number.isFinite(jRise)?fromJulian(jRise):undefined,set:Number.isFinite(jSet)?fromJulian(jSet):undefined}};
 const horizon=pair(-.833),civil=pair(-6),nautical=pair(-12),astronomical=pair(-18),blueOuter=pair(-8),blueInner=pair(-4),golden=pair(6);
 return{sunrise:horizon.rise,sunset:horizon.set,solarNoon:Number.isFinite(jNoon)?fromJulian(jNoon):undefined,civilDawn:civil.rise,civilDusk:civil.set,nauticalDawn:nautical.rise,nauticalDusk:nautical.set,astronomicalDawn:astronomical.rise,astronomicalDusk:astronomical.set,blueHourMorningStart:blueOuter.rise,blueHourMorningEnd:blueInner.rise,blueHourEveningStart:blueInner.set,blueHourEveningEnd:blueOuter.set,goldenHourMorningEnd:golden.rise,goldenHourEveningStart:golden.set};
}
function dayLengthSeconds(sunrise?:Date,sunset?:Date){if(!sunrise||!sunset)return Number.NaN;const seconds=(sunset.getTime()-sunrise.getTime())/1000;return seconds>0&&seconds<DAY_MS/1000?seconds:Number.NaN}

function moonCoords(d:number){const l=RAD*(218.316+13.176396*d),m=RAD*(134.963+13.064993*d),f=RAD*(93.272+13.22935*d),longitude=l+RAD*6.289*Math.sin(m),latitude=RAD*5.128*Math.sin(f),distance=385001-20905*Math.cos(m);return{ra:rightAscension(longitude,latitude),dec:declination(longitude,latitude),dist:distance}}
function moonAltitude(date:Date,lat:number,lon:number){const lw=RAD*-lon,phi=RAD*lat,d=toDays(date),coords=moonCoords(d),hour=siderealTime(d,lw)-coords.ra,altitude=Math.asin(Math.sin(phi)*Math.sin(coords.dec)+Math.cos(phi)*Math.cos(coords.dec)*Math.cos(hour)),refraction=RAD*.017/Math.tan(altitude+RAD*10.26/(altitude+RAD*5.10));return altitude+(Number.isFinite(refraction)?refraction:0)}
function moonTimesForDate(parts:{year:number;month:number;day:number},lat:number,lon:number,timezone:string){
 const start=zonedDateToUtc(parts.year,parts.month,parts.day,0,0,0,timezone),next=shiftDate(parts,1),end=zonedDateToUtc(next.year,next.month,next.day,0,0,0,timezone),step=10*60*1000,horizon=RAD*.133;
 let previousTime=start.getTime(),previous=moonAltitude(start,lat,lon)-horizon,rise:Date|undefined,set:Date|undefined,min=previous,max=previous;
 for(let time=previousTime+step;time<=end.getTime();time+=step){const current=moonAltitude(new Date(time),lat,lon)-horizon;min=Math.min(min,current);max=Math.max(max,current);if(!rise&&previous<0&&current>=0){const ratio=Math.max(0,Math.min(1,-previous/(current-previous)));rise=new Date(previousTime+(time-previousTime)*ratio)}if(!set&&previous>=0&&current<0){const ratio=Math.max(0,Math.min(1,previous/(previous-current)));set=new Date(previousTime+(time-previousTime)*ratio)}previous=current;previousTime=time}
 return{moonrise:rise,moonset:set,alwaysUp:!rise&&!set&&min>0,alwaysDown:!rise&&!set&&max<0};
}
function moonIllumination(date:Date){const d=toDays(date),sunM=solarMeanAnomaly(d),sunL=eclipticLongitude(sunM),sun={dec:declination(sunL,0),ra:rightAscension(sunL,0)},moon=moonCoords(d),sunDistance=149598000,phi=Math.acos(Math.sin(sun.dec)*Math.sin(moon.dec)+Math.cos(sun.dec)*Math.cos(moon.dec)*Math.cos(sun.ra-moon.ra)),incidence=Math.atan2(sunDistance*Math.sin(phi),moon.dist-sunDistance*Math.cos(phi)),angle=Math.atan2(Math.cos(sun.dec)*Math.sin(sun.ra-moon.ra),Math.sin(sun.dec)*Math.cos(moon.dec)-Math.cos(sun.dec)*Math.sin(moon.dec)*Math.cos(sun.ra-moon.ra)),fraction=(1+Math.cos(incidence))/2,phase=.5+.5*incidence*(angle<0?-1:1)/Math.PI;return{fraction:Math.max(0,Math.min(1,fraction)),phase:(phase%1+1)%1}}

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
  const observer=new Observer(lat,lon,Math.max(0,Number.isFinite(height)?height:0));
  let eclipse=SearchLocalSolarEclipse(new Date(at.getTime()-12*3600000),observer);
  for(let index=0;index<8;index++){
   const peak=eclipse.peak.time.date,start=eclipse.partial_begin.time.date,end=eclipse.partial_end.time.date;
   if(peak.getTime()>at.getTime()&&eclipse.peak.altitude>0){
    const kind=eclipseKind(eclipse.kind),labels=eclipseLabels('solar',kind);
    return{type:'solar',kind,...labels,start,peak,end,obscuration:Math.max(0,Math.min(1,eclipse.obscuration)),altitude:eclipse.peak.altitude};
   }
   eclipse=NextLocalSolarEclipse(eclipse.peak.time,observer);
  }
 }catch{}
 return undefined;
}
function nextVisibleLunarEclipse(at:Date,lat:number,lon:number):AstronomyEclipseEvent|undefined{
 try{
  let eclipse=SearchLunarEclipse(new Date(at.getTime()-12*3600000));
  for(let index=0;index<12;index++){
   const peak=eclipse.peak.date,altitude=moonAltitude(peak,lat,lon)/RAD;
   if(peak.getTime()>at.getTime()&&altitude>0){
    const kind=eclipseKind(eclipse.kind),labels=eclipseLabels('lunar',kind),halfMinutes=Math.max(0,eclipse.sd_penum);
    return{type:'lunar',kind,...labels,start:new Date(peak.getTime()-halfMinutes*60000),peak,end:new Date(peak.getTime()+halfMinutes*60000),obscuration:kind==='penumbral'?undefined:Math.max(0,Math.min(1,eclipse.obscuration)),altitude};
   }
   eclipse=NextLunarEclipse(eclipse.peak);
  }
 }catch{}
 return undefined;
}
const eclipseCache=new Map<string,{expires:number;event?:AstronomyEclipseEvent}>();
function nextEclipseForLocation(at:Date,lat:number,lon:number,height:number){
 const bucket=Math.floor(at.getTime()/(15*60*1000)),key=`${lat.toFixed(3)}:${lon.toFixed(3)}:${Math.round(height/25)}:${bucket}`,cached=eclipseCache.get(key);
 if(cached&&cached.expires>Date.now())return cached.event;
 const solar=nextVisibleSolarEclipse(at,lat,lon,height),lunar=nextVisibleLunarEclipse(at,lat,lon),event=!solar?lunar:!lunar?solar:solar.peak.getTime()<=lunar.peak.getTime()?solar:lunar;
 eclipseCache.clear();eclipseCache.set(key,{expires:Date.now()+15*60*1000,event});
 return event;
}
function moonDescriptor(phase:number){
 const icon=phase<.0625||phase>=.9375?'🌑':phase<.1875?'🌒':phase<.3125?'🌓':phase<.4375?'🌔':phase<.5625?'🌕':phase<.6875?'🌖':phase<.8125?'🌗':'🌘';
 const age=phase*MOON_CYCLE_DAYS;
 const phaseName=age<.5||age>=MOON_CYCLE_DAYS-.5?'Neumond':Math.abs(age-MOON_CYCLE_DAYS/4)<.5?'Erstes Viertel':Math.abs(age-MOON_CYCLE_DAYS/2)<.5?'Vollmond':Math.abs(age-MOON_CYCLE_DAYS*.75)<.5?'Letztes Viertel':phase<.25?'Zunehmende Sichel':phase<.5?'Zunehmender Mond':phase<.75?'Abnehmender Mond':'Abnehmende Sichel';
 return{icon,phaseName,age};
}

export function astronomySummary(w:Weather,at=new Date()):AstronomySummary{
 const timezone=w.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',today=localDateParts(at,timezone),yesterday=shiftDate(today,-1),sunToday=sunTimesForDate(today,w.latitude,w.longitude,timezone),sunYesterday=sunTimesForDate(yesterday,w.latitude,w.longitude,timezone),dayLength=dayLengthSeconds(sunToday.sunrise,sunToday.sunset),previousLength=dayLengthSeconds(sunYesterday.sunrise,sunYesterday.sunset),moonTimes=moonTimesForDate(today,w.latitude,w.longitude,timezone),illumination=moonIllumination(at),descriptor=moonDescriptor(illumination.phase),daysUntilNewMoon=((1-illumination.phase)%1)*MOON_CYCLE_DAYS,daysUntilFullMoon=((.5-illumination.phase+1)%1)*MOON_CYCLE_DAYS,nextEclipse=nextEclipseForLocation(at,w.latitude,w.longitude,Number(w.elevation)||0);
 return{...sunToday,dayLengthSeconds:dayLength,dayLengthChangeSeconds:Number.isFinite(dayLength)&&Number.isFinite(previousLength)?dayLength-previousLength:Number.NaN,moonrise:moonTimes.moonrise,moonset:moonTimes.moonset,moonAlwaysUp:moonTimes.alwaysUp,moonAlwaysDown:moonTimes.alwaysDown,moonIcon:descriptor.icon,moonPhase:descriptor.phaseName,moonIllumination:illumination.fraction,moonAgeDays:descriptor.age,moonPhaseFraction:illumination.phase,daysUntilNewMoon,daysUntilFullMoon,nextEclipse,timezone};
}

export function formatAstronomyTime(value:Date|undefined,timezone:string){return value?new Intl.DateTimeFormat('de-DE',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(value):'–'}
export function formatDuration(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return'–';const totalMinutes=Math.round(seconds/60),hours=Math.floor(totalMinutes/60),minutes=totalMinutes%60;return`${hours} h ${String(minutes).padStart(2,'0')} min`}
export function formatDayLengthChange(seconds:number){if(!Number.isFinite(seconds))return'–';const minutes=Math.round(Math.abs(seconds)/60);if(minutes===0)return'±0 min';return`${seconds>0?'+':'−'}${minutes} min`}
