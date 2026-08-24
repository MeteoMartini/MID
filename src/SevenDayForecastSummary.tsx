import {useMemo} from 'react';
import {dayPrecipitationAssessment,dayWeatherCharacter,precipitationPeriodAssessment,type ClimateDay,type Day,type Hour} from './weather';
import {summarizeDwdWarnings} from './dwdWarnings';
import {followingNightIsTropical} from './forecastNight';
import {dayPeriodHoursForDate,followingNightHoursForDate} from './forecastPeriods';
import {DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD,significantHourlyThunderRisk} from './detailThunderRisk';

function dateOnlyUtc(value:string){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12)):new Date(Number.NaN)}
function formatDateOnly(value:string,options:Intl.DateTimeFormatOptions){const date=dateOnlyUtc(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{...options,timeZone:'UTC'}).format(date):value}

type SevenDayWeatherRegime='sunny'|'mixed'|'cloudy'|'wet'|'storm'|'snow';
type SevenDayThermalClass='extreme-hot'|'very-hot'|'hot'|'summer'|'ice'|'frost'|'above-normal'|'below-normal'|'neutral';
type SevenDayWeatherPoint={index:number;day:Day;regime:SevenDayWeatherRegime;sunHours:number;sunShare:number;dayPrecipitation:number;dayProbability:number;precipitationDurationHours:number;showery:boolean;thunderRiskPercent:number;thunderDirect:boolean;followingNightFamily:ReturnType<typeof precipitationPeriodAssessment>['family'];followingNightDurationHours:number;followingNightProbability:number;followingNightDominant:boolean;thermal:SevenDayThermalClass;climateDelta:number;tropicalNight:boolean;hazards:ReturnType<typeof summarizeDwdWarnings>};
type SevenDayWeatherSegment={regime:SevenDayWeatherRegime;start:number;end:number;points:SevenDayWeatherPoint[]};
// DWD-Kenntage: Sommertag ab 25 °C, Heißer Tag ab 30 °C, sehr heiß ab 35 °C, extrem heiß ab 40 °C, Tropennacht ab Tmin 20 °C und Eistag bei Tmax < 0 °C.
const SEVEN_DAY_TREND_WEIGHTS=[1.8,1.5,1.25,1,.82,.68,.55] as const;
function sevenDayWeight(index:number){return SEVEN_DAY_TREND_WEIGHTS[Math.min(index,SEVEN_DAY_TREND_WEIGHTS.length-1)]??.5}
function sevenDayClockMinutes(value?:string){const match=String(value||'').match(/T(\d{2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):Number.NaN}
function sevenDayDaylightHours(day:Day){const sunrise=sevenDayClockMinutes(day.sunrise),sunset=sevenDayClockMinutes(day.sunset);if(Number.isFinite(sunrise)&&Number.isFinite(sunset)){const minutes=sunset>=sunrise?sunset-sunrise:sunset+1440-sunrise;if(minutes>0)return minutes/60}return 12}
function sevenDayThermalClass(day:Day,climate?:ClimateDay){
 const max=Number(day.max),min=Number(day.min),delta=climate&&Number.isFinite(climate.maxMean)?max-climate.maxMean:Number.NaN;
 if(max>=40)return'extreme-hot';
 if(max>=35)return'very-hot';
 if(max>=30)return'hot';
 if(max>=25)return'summer';
 if(max<0)return'ice';
 if(min<0)return'frost';
 if(Number.isFinite(delta)&&delta>=4.5)return'above-normal';
 if(Number.isFinite(delta)&&delta<=-4.5)return'below-normal';
 return'neutral';
}
function sevenDayPoint(day:Day,nextDay:Day|undefined,dayHours:Hour[],allHours:Hour[],index:number,climate:ClimateDay|undefined,elevation:number):SevenDayWeatherPoint{
 const calendarDayHours=allHours.filter(hour=>hour.time.startsWith(day.date)).sort((a,b)=>a.epoch-b.epoch);
 dayHours=dayPeriodHoursForDate(day.date,dayHours.length?dayHours:calendarDayHours.length?calendarDayHours:allHours);
 // Für „Heute“ muss die 7-Tage-Kurzinterpretation den vollständigen lokalen Kalendertag 00–24 Uhr berücksichtigen.
 // So verschwinden bereits am Morgen/Vormittag gefallene bzw. prognostizierte Niederschläge nach Überschreiten von „Jetzt“ nicht aus dem Tagestrend.
 const fullCurrentDayAssessment=index===0&&calendarDayHours.length?precipitationPeriodAssessment(calendarDayHours):null,dayAssessment=fullCurrentDayAssessment??dayPrecipitationAssessment(day,dayHours),precipitationSignalHours=index===0&&calendarDayHours.length?calendarDayHours:dayHours,followingNightHours=followingNightHoursForDate(day.date,allHours).filter(hour=>index>0||hour.epoch>=Date.now()-30*60000),followingNightAssessment=precipitationPeriodAssessment(followingNightHours),trendHours=[...dayHours,...followingNightHours].sort((a,b)=>a.epoch-b.epoch),character=dayWeatherCharacter(day,dayHours),codes=precipitationSignalHours.map(hour=>hour.code).filter(Number.isFinite).map(value=>Math.round(Number(value))),has=(values:number[])=>codes.some(code=>values.includes(code)),text=`${character.label} ${character.secondary||''}`.toLocaleLowerCase('de-DE'),sunHours=day.sunshineDuration==null?Number.NaN:Math.max(0,Number(day.sunshineDuration))/3600,sunShare=Number.isFinite(sunHours)?Math.max(0,Math.min(1,sunHours/Math.max(1,sevenDayDaylightHours(day)))):0,dayPrecipitation=Math.max(dayAssessment.amount,index===0?Math.max(0,Number(day.precipitation)||0):0),dayProbability=Math.max(dayAssessment.maxProbability,index===0?Math.max(0,Math.min(100,Number(day.probability)||0)):0),currentDayPrecipitationRelevant=index===0&&(dayPrecipitation>=.1||dayAssessment.durationHours>=.25||dayAssessment.activeIntervals>0),showery=dayAssessment.showery&&(dayAssessment.dominant||currentDayPrecipitationRelevant),wetDominant=dayAssessment.dominant||currentDayPrecipitationRelevant,hazards=summarizeDwdWarnings(trendHours,elevation),hourlyThunderRisks=dayHours.map(hour=>significantHourlyThunderRisk(hour)).filter((risk):risk is NonNullable<ReturnType<typeof significantHourlyThunderRisk>>=>Boolean(risk)),thunderRiskPercent=Math.max(0,...hourlyThunderRisks.map(risk=>risk.percent)),thunderDirect=dayHours.some(hour=>[95,96,97,99].includes(Math.round(Number(hour.code)))),stormy=thunderRiskPercent>=DETAIL_THUNDER_RISK_DISPLAY_THRESHOLD||thunderDirect,snowy=has([71,73,75,77,85,86])&&wetDominant,sunnyText=/sonnig|heiter|wolkenlos/.test(text),denseCloudText=/stark bewölkt|meist bewölkt|bedeckt|trüb/.test(text),mixedText=/sonne und wolken|wechselnd bewölkt|aufgelockert|teils bewölkt|zeitweise wolkig|später wolkig/.test(text);
 let regime:SevenDayWeatherRegime;
 if(snowy)regime='snow';else if(stormy)regime='storm';else if(wetDominant)regime='wet';else if(sunnyText&&denseCloudText||mixedText)regime='mixed';else if(denseCloudText)regime='cloudy';else if(sunnyText)regime='sunny';else if(codes.includes(0)||codes.includes(1))regime=sunShare>=.35?'sunny':'mixed';else if(codes.includes(2))regime='mixed';else if(codes.includes(3))regime='cloudy';else regime=sunShare>=.65?'sunny':sunShare>=.3?'mixed':'cloudy';
 return{index,day,regime,sunHours,sunShare,dayPrecipitation,dayProbability,precipitationDurationHours:dayAssessment.durationHours,showery,thunderRiskPercent,thunderDirect,followingNightFamily:followingNightAssessment.family,followingNightDurationHours:followingNightAssessment.durationHours,followingNightProbability:followingNightAssessment.maxProbability,followingNightDominant:followingNightAssessment.dominant,thermal:sevenDayThermalClass(day,climate),climateDelta:climate&&Number.isFinite(climate.maxMean)?Number(day.max)-climate.maxMean:Number.NaN,tropicalNight:followingNightIsTropical(day,nextDay,allHours),hazards};
}
function sevenDayThermalPhrase(segment:SevenDayWeatherSegment){
 const points=segment.points,totalWeight=points.reduce((sum,point)=>sum+sevenDayWeight(point.index),0),score=(classes:SevenDayThermalClass[])=>points.reduce((sum,point)=>sum+(classes.includes(point.thermal)?sevenDayWeight(point.index):0),0),first=points[0],last=points[points.length-1],risingHeat=points.length>=2&&Number(first.day.max)<30&&Number(last.day.max)>=30&&Number(last.day.max)-Number(first.day.max)>=4,tropicalNights=points.filter(point=>point.tropicalNight).length,nightSuffix=tropicalNights===1?' mit einer möglichen Tropennacht':tropicalNights>1?' mit möglichen Tropennächten':'';
 if(points.some(point=>point.thermal==='extreme-hot'))return`extrem heiß${nightSuffix}`;
 if(points.some(point=>point.thermal==='very-hot')&&score(['very-hot','extreme-hot'])/totalWeight>=.22)return`sehr heiß${nightSuffix}`;
 if(risingHeat)return`zunehmend heiß${nightSuffix}`;
 if(score(['hot','very-hot','extreme-hot'])/totalWeight>=.42)return`heiß${nightSuffix}`;
 if(score(['summer','hot','very-hot','extreme-hot'])/totalWeight>=.48)return`sommerlich warm${nightSuffix}`;
 if(score(['ice'])/totalWeight>=.35)return'mit Dauerfrost';
 if(score(['frost','ice'])/totalWeight>=.5)return'mit Nachtfrost';
 const climatePoints=points.filter(point=>Number.isFinite(point.climateDelta)),climateWeight=climatePoints.reduce((sum,point)=>sum+sevenDayWeight(point.index),0),weightedDelta=climateWeight?climatePoints.reduce((sum,point)=>sum+point.climateDelta*sevenDayWeight(point.index),0)/climateWeight:Number.NaN;
 if(weightedDelta>=4.5)return'deutlich wärmer als im Klimamittel';
 if(weightedDelta<=-4.5)return'deutlich kühler als im Klimamittel';
 return'';
}
function sevenDaySegmentDescription(segment:SevenDayWeatherSegment){
 const points=segment.points,totalPrecip=points.reduce((sum,point)=>sum+point.dayPrecipitation,0),showeryScore=points.reduce((sum,point)=>sum+(point.showery?sevenDayWeight(point.index):0),0),weight=points.reduce((sum,point)=>sum+sevenDayWeight(point.index),0),thermal=sevenDayThermalPhrase(segment),maxThunderRisk=Math.max(0,...points.map(point=>point.thunderRiskPercent)),directThunder=points.some(point=>point.thunderDirect);
 let base='';
 if(segment.regime==='snow')base='winterlich mit Schnee';
 else if(segment.regime==='storm')base=directThunder||maxThunderRisk>=70?'wechselhaft mit Gewittern':maxThunderRisk>=50?'wechselhaft mit erhöhtem Gewitterrisiko':'wechselhaft mit Gewitterrisiko';
 else if(segment.regime==='wet')base=showeryScore>=weight*.45&&totalPrecip<10?'wechselhaft mit Schauern':totalPrecip>=8?'regnerisch':'zeitweise regnerisch';
 else if(segment.regime==='cloudy')base='überwiegend bewölkt, aber meist trocken';
 else if(segment.regime==='mixed')base='wechselnd bewölkt mit sonnigen Abschnitten und überwiegend trocken';
 else base='heiter bis sonnig und trocken';
 if(!thermal)return base;
 if(thermal.startsWith('mit '))return`${base} ${thermal}`;
 if(segment.regime==='sunny')return`heiter bis sonnig und ${thermal}`;
 if(segment.regime==='cloudy')return`überwiegend bewölkt, aber meist trocken; dabei ${thermal}`;
 return`${base}, dabei ${thermal}`;
}
function sevenDayWeekday(day:Day){return formatDateOnly(day.date,{weekday:'long'})}
function sevenDayClause(segment:SevenDayWeatherSegment,forecastDays:Day[],index:number,total:number){
 const description=sevenDaySegmentDescription(segment),startDay=forecastDays[segment.start],endDay=forecastDays[segment.end];
 if(index===0){
  if(segment.start===0&&segment.end===0)return`Heute ${description}`;
  if(segment.start===0&&segment.end===1)return`Heute und morgen ${description}`;
  if(segment.end<=3)return`Bis ${sevenDayWeekday(endDay)} ${description}`;
  return`Zunächst ${description}`;
 }
 if(segment.start===1)return segment.start===segment.end?`Morgen ${description}`:`Ab morgen ${description}`;
 if(segment.start===segment.end)return`Am ${sevenDayWeekday(startDay)} ${description}`;
 if(index===total-1)return`Ab ${sevenDayWeekday(startDay)} ${description}`;
 return`Danach ${description}`;
}
function sevenDaySegmentScore(segment:SevenDayWeatherSegment){const base=segment.points.reduce((sum,point)=>sum+sevenDayWeight(point.index),0),hazard=Math.max(0,...segment.points.flatMap(point=>point.hazards.map(signal=>signal.level))),weather=['wet','storm','snow'].includes(segment.regime)?1.4:0,thermal=segment.points.some(point=>['extreme-hot','very-hot','hot','ice'].includes(point.thermal))?1:0;return base+hazard*1.2+weather+thermal}
function sevenDaySegmentSignificant(segment:SevenDayWeatherSegment){return['wet','storm','snow'].includes(segment.regime)||segment.points.some(point=>point.hazards.some(signal=>signal.level>=2)||['extreme-hot','very-hot','ice'].includes(point.thermal))||sevenDaySegmentScore(segment)>=1.8}
function selectSevenDaySegments(segments:SevenDayWeatherSegment[]){
 if(segments.length<=3)return segments;
 const selected=[segments[0]];
 if(segments[0].end<2&&segments[1])selected.push(segments[1]);
 const remaining=segments.filter(segment=>!selected.includes(segment)).filter(sevenDaySegmentSignificant).sort((a,b)=>sevenDaySegmentScore(b)-sevenDaySegmentScore(a)||a.start-b.start);
 if(remaining[0])selected.push(remaining[0]);
 return selected.sort((a,b)=>a.start-b.start).slice(0,3);
}
function sevenDayHazardPhrase(title:string){const value=String(title||'').trim();if(!value)return'';return /^(Schwere|Orkanartige|Extreme|Starke|Leichte|Mäßige)\b/.test(value)?value.charAt(0).toLocaleLowerCase('de-DE')+value.slice(1):value}
function sevenDayHazardClause(points:SevenDayWeatherPoint[]){
 const candidates=points.flatMap(point=>point.hazards.filter(signal=>signal.level>=2).map(signal=>({point,signal}))).sort((a,b)=>b.signal.level-a.signal.level||a.point.index-b.point.index||sevenDayWeight(b.point.index)-sevenDayWeight(a.point.index));
 const candidate=candidates[0];if(!candidate)return'';
 const prefix=candidate.point.index===0?'Heute':candidate.point.index===1?'Morgen':`Am ${sevenDayWeekday(candidate.point.day)}`,title=sevenDayHazardPhrase(candidate.signal.title);
 return`${prefix} ${title} möglich`;
}
function sevenDayFollowingNightClause(points:SevenDayWeatherPoint[]){
 const candidate=points.find(point=>point.followingNightDominant&&point.followingNightFamily!=='none'&&point.followingNightDurationHours>=.5);if(!candidate)return'';
 const event=candidate.followingNightFamily==='thunder'?'Gewitter':candidate.followingNightFamily==='showers'?'Schauer':candidate.followingNightFamily==='snow'?'Schnee':candidate.followingNightFamily==='drizzle'?'Sprühregen':'Regen',plural=candidate.followingNightFamily==='thunder'||candidate.followingNightFamily==='showers',nextDate=new Date(`${candidate.day.date}T12:00:00Z`);nextDate.setUTCDate(nextDate.getUTCDate()+1);const nextWeekday=new Intl.DateTimeFormat('de-DE',{weekday:'long',timeZone:'UTC'}).format(nextDate),prefix=candidate.index===0?'In der kommenden Nacht':`In der Nacht zum ${nextWeekday}`;
 return`${prefix} ${plural?'sind':'ist'} ${event} möglich`;
}
export function buildSevenDayForecastSummary(days:Day[],hours:Hour[],climate:ClimateDay[]=[],elevation=0){
 const forecastDays=days.slice(0,7);if(!forecastDays.length)return'';
 const climateMap=new Map(climate.map(day=>[day.date,day])),points=forecastDays.map((day,index)=>{const allDayHours=hours.filter(hour=>hour.time.startsWith(day.date)),futureHours=index===0?allDayHours.filter(hour=>hour.epoch>=Date.now()-30*60000):allDayHours,dayHours=dayPeriodHoursForDate(day.date,futureHours.length?futureHours:allDayHours),fallbackDayHours=dayHours.length?dayHours:dayPeriodHoursForDate(day.date,allDayHours);return sevenDayPoint(day,forecastDays[index+1],fallbackDayHours,hours,index,climateMap.get(day.date),elevation)}),segments:SevenDayWeatherSegment[]=[];
 for(const point of points){const current=segments[segments.length-1];if(current?.regime===point.regime){current.end=point.index;current.points.push(point)}else segments.push({regime:point.regime,start:point.index,end:point.index,points:[point]})}
 const effectiveSegments=selectSevenDaySegments(segments),clauses=effectiveSegments.map((segment,index)=>sevenDayClause(segment,forecastDays,index,effectiveSegments.length)),hazardClause=sevenDayHazardClause(points),followingNightClause=hazardClause?'':sevenDayFollowingNightClause(points),supplementalClause=hazardClause||followingNightClause,weatherClauses=supplementalClause?clauses.slice(0,2):clauses.slice(0,3),text=[...weatherClauses,supplementalClause].filter(Boolean).join('. ');
 return`${text}.`;
}
export function SevenDayForecastSummary({days,hours,climate,elevation}:{days:Day[];hours:Hour[];climate:ClimateDay[];elevation:number}){const summary=useMemo(()=>buildSevenDayForecastSummary(days,hours,climate,elevation),[days,hours,climate,elevation]);if(!summary)return null;return <aside className="seven-day-forecast-summary" aria-label="Kurzinterpretation der nächsten sieben Tage"><small>7-Tage-Trend</small><strong>{summary}</strong></aside>}
