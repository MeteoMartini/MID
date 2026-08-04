import type {Hour} from './weather';

const CIVIL_DAY_START_HOUR=7;
const CIVIL_DAY_END_HOUR=19;
const FOLLOWING_NIGHT_SPLIT_HOUR=12;

function clockHour(hour:Hour){
 const value=Number(hour.time.slice(11,13));
 return Number.isFinite(value)?value:Number.NaN;
}

export function addForecastDays(date:string,days:number){
 const base=new Date(`${date}T12:00:00Z`);
 if(Number.isNaN(base.getTime()))return date;
 base.setUTCDate(base.getUTCDate()+days);
 return base.toISOString().slice(0,10);
}

/**
 * Stunden des meteorologischen Tagesfensters. Astronomische Tagstunden haben
 * Vorrang; bei unvollständigem is_day-Signal dient 07–18 Uhr als ziviles
 * Fallback. Nachtstunden des Kalendertags werden bewusst ausgeschlossen.
 */
export function dayPeriodHoursForDate(date:string,allHours:Hour[]){
 const dated=allHours.filter(hour=>hour.time.slice(0,10)===date);
 const astronomical=dated.filter(hour=>hour.isDay===true);
 if(astronomical.length>=2)return astronomical;
 const civil=dated.filter(hour=>{const clock=clockHour(hour);return clock>=CIVIL_DAY_START_HOUR&&clock<CIVIL_DAY_END_HOUR});
 return civil.length?civil:astronomical;
}

/**
 * Die auf einen Prognosetag folgende Nacht: Abend nach dem Tagesfenster plus
 * Morgenstunden des Folgetags. So gehört z. B. Mittwochabend/Donnerstagmorgen
 * vollständig zum Nachtpiktogramm des Mittwochs.
 */
export function followingNightHoursForDate(date:string,allHours:Hour[]){
 const nextDate=addForecastDays(date,1);
 const astronomical=allHours.filter(hour=>{
  if(hour.isDay!==false)return false;
  const sampleDate=hour.time.slice(0,10),clock=clockHour(hour);
  if(!Number.isFinite(clock))return false;
  return sampleDate===date?clock>=FOLLOWING_NIGHT_SPLIT_HOUR:sampleDate===nextDate?clock<FOLLOWING_NIGHT_SPLIT_HOUR:false;
 });
 if(astronomical.length>=4)return astronomical;
 return allHours.filter(hour=>{
  const sampleDate=hour.time.slice(0,10),clock=clockHour(hour);
  if(!Number.isFinite(clock))return false;
  return sampleDate===date?clock>=CIVIL_DAY_END_HOUR:sampleDate===nextDate?clock<CIVIL_DAY_START_HOUR:false;
 });
}
