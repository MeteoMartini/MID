import type {Hour} from './weather';

const CIVIL_DAY_START_HOUR=7;
const CIVIL_DAY_END_HOUR=19;
const FOLLOWING_NIGHT_SPLIT_HOUR=12;

function clockHour(hour:Hour){
 const value=Number(hour.time.slice(11,13));
 return Number.isFinite(value)?value:Number.NaN;
}

function leapYear(year:number){return year%4===0&&(year%100!==0||year%400===0)}
function daysInMonth(year:number,month:number){return[31,leapYear(year)?29:28,31,30,31,30,31,31,30,31,30,31][month-1]??0}
export function addForecastDays(date:string,days:number){
 const match=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/),offset=Math.trunc(Number(days));
 if(!match||!Number.isFinite(offset))return date;
 let year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 if(month<1||month>12||day<1||day>daysInMonth(year,month))return date;
 const step=offset<0?-1:1;
 for(let remaining=Math.abs(offset);remaining>0;remaining--){day+=step;if(step>0&&day>daysInMonth(year,month)){day=1;month++;if(month>12){month=1;year++}}else if(step<0&&day<1){month--;if(month<1){month=12;year--}day=daysInMonth(year,month)}}
 return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
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
