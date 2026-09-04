import {precipitationParts} from './precipitation';
import type {Hour,Minute15} from './weather';

const HOUR_MS=60*60000;
const MIN_GAP_MS=45*60000;
const MAX_GAP_MS=75*60000;

/**
 * Provider-/Rechenkern-Semantik bleibt unverändert: Open-Meteo/DWD liefern
 * Stundenakkumulationen am Intervallende T für [T-1h,T]. Für eine menschlich
 * erwartbare Stundenprognose wird dagegen der sichtbare Slotbeginn T gezeigt
 * und die Akkumulation des unmittelbar folgenden Rohwerts T+1h zugeordnet.
 *
 * Punktwerte (Temperatur, Wind, Bewölkung, Druck …) bleiben am sichtbaren
 * Slotbeginn. Nur Niederschlagsmenge, -komponenten, -wahrscheinlichkeit und der
 * daraus abgeleitete Niederschlags-Wettercode werden zeitlich normalisiert.
 */
function precipitationCode(code:number){return [51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77,80,81,82,83,84,85,86,95,96,97,99].includes(Math.round(Number(code)||0))}
function drySkyCode(hour:Hour){
 const code=Math.round(Number(hour.code)||0);
 if(code===45||code===48||!precipitationCode(code))return code;
 const visibility=Number(hour.visibility),humidity=Number(hour.humidity),temperature=Number(hour.temperature),cloud=Math.max(0,Math.min(100,Number(hour.cloud)||0));
 if(Number.isFinite(visibility)&&visibility<=1000&&Number.isFinite(humidity)&&humidity>=92)return Number.isFinite(temperature)&&temperature<=0?48:45;
 if(cloud<12.5)return 0;
 if(cloud<37.5)return 1;
 if(cloud<75)return 2;
 return 3;
}

export function precipitationPresentationHours(hours:Hour[]):Hour[]{
 const sorted=[...hours].filter(hour=>Number.isFinite(Number(hour.epoch))).sort((a,b)=>a.epoch-b.epoch);
 if(sorted.length<2)return [...hours];
 const byEpoch=new Map(sorted.map(hour=>[hour.epoch,hour] as const));
 const mapped=new Map<number,Hour>();
 for(let index=0;index<sorted.length;index++){
  const state=sorted[index]!,next=sorted[index+1],gap=next?next.epoch-state.epoch:NaN;
  if(!next||!Number.isFinite(gap)||gap<MIN_GAP_MS||gap>MAX_GAP_MS){mapped.set(state.epoch,{...state,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:drySkyCode(state)});continue}
  const sample={...state,precipitation:Math.max(0,Number(next.precipitation)||0),rain:Math.max(0,Number(next.rain)||0),showers:Math.max(0,Number(next.showers)||0),snowfall:Math.max(0,Number(next.snowfall)||0),probability:Math.max(0,Math.min(100,Number(next.probability)||0)),code:Number(next.code)};
  const parts=precipitationParts(sample);
  mapped.set(state.epoch,{...sample,code:parts.type==='none'?drySkyCode(state):parts.displayCode});
 }
 return hours.map(hour=>mapped.get(hour.epoch)??byEpoch.get(hour.epoch)??hour);
}

const QUARTER_MIN_GAP_MS=10*60000;
const QUARTER_MAX_GAP_MS=20*60000;
/** 15-Minuten-Niederschlagsfelder werden analog vom Roh-Intervallende auf den sichtbaren Slotbeginn gelegt. */
export function precipitationPresentationMinutes15(minutes:Minute15[]):Minute15[]{
 const sorted=[...minutes].filter(sample=>Number.isFinite(Number(sample.epoch))).sort((a,b)=>a.epoch-b.epoch);
 if(sorted.length<2)return [...minutes];
 const mapped=new Map<number,Minute15>();
 for(let index=0;index<sorted.length;index++){
  const state=sorted[index]!,next=sorted[index+1],gap=next?next.epoch-state.epoch:NaN;
  if(!next||!Number.isFinite(gap)||gap<QUARTER_MIN_GAP_MS||gap>QUARTER_MAX_GAP_MS){mapped.set(state.epoch,{...state,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0});continue}
  const sample={...state,precipitation:Math.max(0,Number(next.precipitation)||0),rain:Math.max(0,Number(next.rain)||0),showers:Math.max(0,Number(next.showers)||0),snowfall:Math.max(0,Number(next.snowfall)||0),probability:Math.max(0,Math.min(100,Number(next.probability)||0)),code:Number(next.code)};
  const parts=precipitationParts(sample);
  mapped.set(state.epoch,{...sample,code:parts.type==='none'?0:parts.displayCode});
 }
 return minutes.map(sample=>mapped.get(sample.epoch)??sample);
}

export function precipitationSlotEndEpoch(hour:Pick<Hour,'epoch'>){return Number(hour.epoch)+HOUR_MS}

export function precipitationSlotLabel(hour:Pick<Hour,'time'>){
 const start=String(hour.time).slice(11,16),raw=String(hour.time);
 const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
 if(!match)return start;
 const stamp=Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))+HOUR_MS,date=new Date(stamp);
 return `${start}–${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;
}
