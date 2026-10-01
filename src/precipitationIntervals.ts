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
 * Slotbeginn. Zeitlich akkumulierte Felder (Niederschlagsmenge/-komponenten und
 * Sonnenscheindauer), Niederschlagswahrscheinlichkeit sowie der daraus abgeleitete
 * Niederschlags-Wettercode werden auf den sichtbaren Vorwärtsslot normalisiert.
 */
function precipitationCode(code:number){return [50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,99].includes(Math.round(Number(code)||0))}
function drySkyCode(hour:Hour){
 const code=Math.round(Number(hour.code)||0);
 if(code===45||code===48||!precipitationCode(code))return code;
 const visibility=Number(hour.visibility),humidity=Number(hour.humidity),temperature=Number(hour.temperature),cloudValue=hour.cloud,cloudRaw=cloudValue===null||cloudValue===undefined||String(cloudValue).trim()===''?Number.NaN:Number(cloudValue),cloud=Number.isFinite(cloudRaw)?Math.max(0,Math.min(100,cloudRaw)):Number.NaN;
 if(Number.isFinite(visibility)&&visibility<=1000&&Number.isFinite(humidity)&&humidity>=92)return Number.isFinite(temperature)&&temperature<=0?48:45;
 // Fehlende Wolkenbeobachtung ist kein Klarhimmel-Signal. Der neutrale
 // Bewölkungs-Code verhindert, dass ein trockener Intervallschutz die Lage
 // gleichzeitig als "klar" behauptet.
 if(!Number.isFinite(cloud))return 2;
 // Trockenwettercodes bleiben vierstufig; die Grenzen werden aus den gerundeten
 // DWD-Oktas abgeleitet: 0/8 -> 0, 1–3/8 -> 1, 4–6/8 -> 2, 7–8/8 -> 3.
 if(cloud<6.25)return 0;
 if(cloud<43.75)return 1;
 if(cloud<81.25)return 2;
 return 3;
}

export function precipitationPresentationHours(hours:Hour[]):Hour[]{
 const sorted=[...hours].filter(hour=>Number.isFinite(Number(hour.epoch))).sort((a,b)=>a.epoch-b.epoch);
 if(sorted.length<2)return [...hours];
 const byEpoch=new Map(sorted.map(hour=>[hour.epoch,hour] as const));
 const mapped=new Map<number,Hour>();
 for(let index=0;index<sorted.length;index++){
  const state=sorted[index]!,next=sorted[index+1],gap=next?next.epoch-state.epoch:NaN;
  if(!next||!Number.isFinite(gap)||gap<MIN_GAP_MS||gap>MAX_GAP_MS){mapped.set(state.epoch,{...state,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:null,code:drySkyCode(state)});continue}
  const sample={...state,precipitation:Math.max(0,Number(next.precipitation)||0),rain:Math.max(0,Number(next.rain)||0),showers:Math.max(0,Number(next.showers)||0),snowfall:Math.max(0,Number(next.snowfall)||0),probability:Math.max(0,Math.min(100,Number(next.probability)||0)),sunshineDuration:next.sunshineDuration??null,code:Number(next.code)};
  const parts=precipitationParts(sample);
  mapped.set(state.epoch,{...sample,code:parts.type==='none'?drySkyCode(state):parts.displayCode});
 }
 return hours.map(hour=>mapped.get(hour.epoch)??byEpoch.get(hour.epoch)??hour);
}

const QUARTER_MIN_GAP_MS=10*60000;
const QUARTER_MAX_GAP_MS=20*60000;
/** 15-Minuten-Akkumulationen für Niederschlag und Sonnenschein werden analog vom Roh-Intervallende auf den sichtbaren Slotbeginn gelegt. */
export function precipitationPresentationMinutes15(minutes:Minute15[]):Minute15[]{
 const sorted=[...minutes].filter(sample=>Number.isFinite(Number(sample.epoch))).sort((a,b)=>a.epoch-b.epoch);
 if(sorted.length<2)return [...minutes];
 const mapped=new Map<number,Minute15>();
 for(let index=0;index<sorted.length;index++){
  const state=sorted[index]!,next=sorted[index+1],gap=next?next.epoch-state.epoch:NaN;
  if(!next||!Number.isFinite(gap)||gap<QUARTER_MIN_GAP_MS||gap>QUARTER_MAX_GAP_MS){mapped.set(state.epoch,{...state,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:null,code:0});continue}
  const sample={...state,precipitation:Math.max(0,Number(next.precipitation)||0),rain:Math.max(0,Number(next.rain)||0),showers:Math.max(0,Number(next.showers)||0),snowfall:Math.max(0,Number(next.snowfall)||0),probability:Math.max(0,Math.min(100,Number(next.probability)||0)),sunshineDuration:next.sunshineDuration??null,code:Number(next.code)};
  const parts=precipitationParts(sample);
  mapped.set(state.epoch,{...sample,code:parts.type==='none'?0:parts.displayCode});
 }
 return minutes.map(sample=>mapped.get(sample.epoch)??sample);
}

export type CanonicalPrecipitationTimelineSlot={
 startEpoch:number;
 endEpoch:number;
 sample:Hour|Minute15;
};
export type CanonicalPrecipitationTimelinePeriod={
 startEpoch:number;
 endEpoch:number;
 samples:(Hour|Minute15)[];
};
export type CanonicalPrecipitationTimeline={
 source:'15-min'|'hourly';
 resolutionMinutes:15|60;
 slots:CanonicalPrecipitationTimelineSlot[];
 periods:CanonicalPrecipitationTimelinePeriod[];
 horizonEndEpoch:number;
};

/**
 * Gemeinsame Kurzfrist-Zeitsemantik für alle sichtbaren Niederschlagsaussagen.
 *
 * Open-Meteo liefert Akkumulationen am Intervallende. Für die Darstellung werden
 * sie zuerst mit denselben Presentation-Helpern auf den sichtbaren Vorwärtsslot
 * gelegt, die auch 24-h-Profil, Widgets und Prognose verwenden. Ein fehlender
 * Wert oder eine reine Wahrscheinlichkeit erzeugt dabei ausdrücklich keine
 * künstliche Niederschlagsdauer.
 *
 * Wenn die finalisierte 15-Minuten-Reihe den gesamten gewünschten Horizont
 * abdeckt, ist sie kanonisch. Andernfalls wird vollständig auf die ebenfalls
 * normalisierte Stundenreihe zurückgefallen; Auflösungen werden nicht innerhalb
 * eines einzelnen Zeitraums vermischt.
 */
export function canonicalPrecipitationTimeline(minutes15:Minute15[],hours:Hour[],now=Date.now(),horizonHours=6):CanonicalPrecipitationTimeline{
 const safeHorizonHours=Math.max(1,Math.min(24,Number(horizonHours)||6)),horizonEndEpoch=now+safeHorizonHours*HOUR_MS;
 const finiteSorted=<T extends Hour|Minute15>(values:T[])=>[...values].filter(value=>Number.isFinite(Number(value.epoch))).sort((left,right)=>Number(left.epoch)-Number(right.epoch));
 const rawMinutes=finiteSorted(minutes15),rawHours=finiteSorted(hours),minuteCoverageEnd=rawMinutes.length?Number(rawMinutes.at(-1)!.epoch):Number.NaN,minuteCoverageStart=rawMinutes.length?Number(rawMinutes[0]!.epoch)-15*60000:Number.NaN;
 const useMinutes=rawMinutes.length>=2&&Number.isFinite(minuteCoverageStart)&&minuteCoverageStart<=now&&minuteCoverageEnd>=horizonEndEpoch;
 const source:'15-min'|'hourly'=useMinutes?'15-min':'hourly',resolutionMinutes:15|60=useMinutes?15:60,stepMs=resolutionMinutes*60000,raw=useMinutes?rawMinutes:rawHours,presented=useMinutes?precipitationPresentationMinutes15(rawMinutes):precipitationPresentationHours(rawHours),coverageEnd=raw.length?Number(raw.at(-1)!.epoch):Number.NaN;
 const slots:CanonicalPrecipitationTimelineSlot[]=presented
  .filter(sample=>{const start=Number(sample.epoch),end=start+stepMs;return Number.isFinite(start)&&end>now-stepMs&&start<horizonEndEpoch&&(!Number.isFinite(coverageEnd)||end<=coverageEnd+1000)})
  .sort((left,right)=>Number(left.epoch)-Number(right.epoch))
  .map(sample=>({startEpoch:Number(sample.epoch),endEpoch:Number(sample.epoch)+stepMs,sample}));
 const isWet=(sample:Hour|Minute15)=>{const parts=precipitationParts(sample);return parts.type!=='none'&&(parts.total>=.01||Math.max(0,Number(sample.snowfall)||0)>=.01)};
 const periods:CanonicalPrecipitationTimelinePeriod[]=[];
 for(const slot of slots){
  if(!isWet(slot.sample))continue;
  const previous=periods.at(-1),tolerance=Math.max(1000,stepMs*.1);
  if(previous&&slot.startEpoch<=previous.endEpoch+tolerance){previous.endEpoch=Math.max(previous.endEpoch,slot.endEpoch);previous.samples.push(slot.sample)}
  else periods.push({startEpoch:slot.startEpoch,endEpoch:slot.endEpoch,samples:[slot.sample]});
 }
 return{source,resolutionMinutes,slots,periods,horizonEndEpoch};
}

export function precipitationSlotEndEpoch(hour:Pick<Hour,'epoch'>){return Number(hour.epoch)+HOUR_MS}

export function precipitationSlotLabel(hour:Pick<Hour,'time'>){
 const start=String(hour.time).slice(11,16),raw=String(hour.time);
 const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
 if(!match)return start;
 const stamp=Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))+HOUR_MS,date=new Date(stamp);
 return `${start}–${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;
}
