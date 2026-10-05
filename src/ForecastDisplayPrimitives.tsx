// Extracted from App: canonical forecastPresentation implementation, shared by every consumer.
import {type ReactNode} from 'react';
import {formatDecimal} from './format';
import {hazards,wind,type Day,type Hour,type OfficialAlert,type WindUnit} from './weather';
import {dwdWindWarningLevelKt,formatDwdWarningCompactValue,formatDwdWarningDetail,formatDwdWarningDirection,summarizeDwdWarningsForDay,warningLeadLabel,type DwdWarningKind,type DwdWarningLevel} from './dwdWarnings';
import {WeatherPictogram} from './WeatherPictogram';
import {displayTimeZone,localTimeDisambiguationSuffix} from './timeDisplay';
import {type PeriodWeatherVisual} from './periodWeatherVisual';

type SkybarDisplayMode='band'|'squares';

function dateOnlyUtc(value:string){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12)):new Date(Number.NaN)}
function formatDateOnly(value:string,options:Intl.DateTimeFormatOptions){const date=dateOnlyUtc(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{...options,timeZone:'UTC'}).format(date):value}
function formatRawInZone(value:Date|number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){const date=typeof value==='number'?new Date(value):value;try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(date)}catch{return new Intl.DateTimeFormat('de-DE',options).format(date)}}
function formatInZone(value:Date|number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){return formatRawInZone(value,displayTimeZone(timeZone),options)}
function localDateInZone(timeZone?:string,at:Date|number=new Date()){const date=at instanceof Date?at:new Date(at);try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||undefined,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),get=(type:string)=>parts.find(x=>x.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return date.toISOString().slice(0,10)}}
function visibilityLabel(meters:number){if(!Number.isFinite(meters)||meters<0)return'–';const km=meters/1000;return km>=10?`${Math.round(km)} km`:`${new Intl.NumberFormat('de-DE',{minimumFractionDigits:km<1?2:1,maximumFractionDigits:km<1?2:1}).format(km)} km`}

function hazardValidityLabel(validFrom:string|undefined,validTo:string|undefined,timezone?:string){
 const start=Date.parse(String(validFrom??'')),end=Date.parse(String(validTo??''));if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return'';
 const now=Date.now(),time=(value:number)=>formatInZone(value,timezone,{hour:'2-digit',minute:'2-digit'}),date=(value:number)=>formatInZone(value,timezone,{day:'2-digit',month:'2-digit'}),dateKey=(value:number)=>formatInZone(value,timezone,{year:'numeric',month:'2-digit',day:'2-digit'}),startDate=dateKey(start),endDate=dateKey(end),today=dateKey(now),tomorrow=dateKey(now+24*60*60*1000),sameDate=startDate===endDate,active=start<=now&&end>now;
 const localSuffix=localTimeDisambiguationSuffix(),suffix=localSuffix?` ${localSuffix}`:'';
 if(!sameDate)return`${date(start)}, ${active?'jetzt':time(start)} – ${date(end)}, ${time(end)} Uhr${suffix}`;
 const dayPrefix=startDate===today?'':startDate===tomorrow?`Morgen, ${date(start)} · `:`${date(start)} · `;
 return`${dayPrefix}${active?'jetzt':time(start)}–${time(end)} Uhr${suffix}`;
}
function warningKindFromText(value:string):DwdWarningKind|undefined{const text=value.toLocaleLowerCase('de-DE');if(/schneeverweh/.test(text))return'snowdrift';if(/dauerregen/.test(text))return'continuousRain';if(/starkregen|heftig(?:er|e|es)?\s+regen|extrem.*regen/.test(text))return'heavyRain';if(/gewitter/.test(text))return'thunderstorm';if(/glatteis|glätte|eisregen|gefrier/.test(text))return'ice';if(/schnee/.test(text))return'snow';if(/frost/.test(text))return'frost';if(/nebel/.test(text))return'fog';if(/hitze|wärme/.test(text))return'heat';if(/orkan|sturm|wind|böe/.test(text))return'wind';return undefined}
function officialAlertKind(alert:OfficialAlert):DwdWarningKind|undefined{return warningKindFromText(`${alert.event??''} ${alert.headline??''}`)??warningKindFromText(alert.description??'')}
function uniqueNumbers(values:number[]){return[...new Set(values.filter(Number.isFinite).map(value=>Math.round(value*10)/10))].sort((a,b)=>a-b)}
function officialAlertMetric(alert:OfficialAlert,unit:WindUnit){const kind=officialAlertKind(alert),text=`${alert.headline??''} ${alert.description??''} ${alert.instruction??''}`,formatValue=(value:number)=>unit==='ms'?`${formatDecimal(value,0,0)} m/s`:unit==='kmh'?`${Math.round(value)} km/h`:unit==='mph'?`${Math.round(value)} mph`:`${Math.round(value)} kt`;if(kind==='wind'||kind==='snowdrift'){const directPattern=unit==='kmh'?/(\d+(?:[,.]\d+)?)\s*km\s*\/\s*h/gi:unit==='ms'?/(\d+(?:[,.]\d+)?)\s*m\s*\/\s*s/gi:unit==='kn'?/(\d+(?:[,.]\d+)?)\s*(?:kn|kt|knoten)\b/gi:null,directValues=directPattern?uniqueNumbers([...text.matchAll(directPattern)].map(match=>Number(match[1].replace(',','.')))):[];if(directValues.length){const primary=formatValue(directValues[0]),peak=formatValue(directValues.at(-1)!);return directValues.length>1&&primary!==peak?`bis ${primary} · Spitzen ${peak}`:`bis ${peak}`}let kmh=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*km\s*\/\s*h/gi)].map(match=>Number(match[1].replace(',','.'))));if(!kmh.length)kmh=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*m\s*\/\s*s/gi)].map(match=>Number(match[1].replace(',','.'))*3.6));if(!kmh.length)kmh=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*(?:kn|kt|knoten)\b/gi)].map(match=>Number(match[1].replace(',','.'))*KMH_PER_KT));if(!kmh.length)return'';const primary=wind(kmh[0]/KMH_PER_KT,unit),peak=wind(kmh.at(-1)!/KMH_PER_KT,unit);return kmh.length>1&&primary!==peak?`bis ${primary} · Spitzen ${peak}`:`bis ${peak}`}
 if(kind==='heavyRain'||kind==='continuousRain'){const values=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*mm\b/gi)].map(match=>Number(match[1].replace(',','.'))));if(!values.length)return'';return values.length>1?`${values[0]}–${values.at(-1)} mm`:`${values[0]} mm`}
 if(kind==='snow'){const values=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*cm\b/gi)].map(match=>Number(match[1].replace(',','.'))));if(!values.length)return'';return values.length>1?`${values[0]}–${values.at(-1)} cm`:`${values[0]} cm`}
 if(kind==='heat'||kind==='frost'){const values=uniqueNumbers([...text.matchAll(/(-?\d+(?:[,.]\d+)?)\s*°\s*C\b/gi)].map(match=>Number(match[1].replace(',','.'))));if(!values.length)return'';return values.length>1?`${values[0]} bis ${values.at(-1)} °C`:`${values[0]} °C`}
 if(kind==='fog'){const values=uniqueNumbers([...text.matchAll(/(\d+(?:[,.]\d+)?)\s*m\b(?!\s*\/)/gi)].map(match=>Number(match[1].replace(',','.'))));if(!values.length)return'';return`Sicht ≤ ${values[0]} m`}
 return''}
type AutomaticHazard=ReturnType<typeof hazards>[number];
type AutomaticHazardLevel=AutomaticHazard['level']|'clear';
const AUTOMATIC_HAZARD_LEVEL_RANK:Record<Exclude<AutomaticHazardLevel,'clear'>,number>={yellow:1,orange:2,red:3,purple:4};

function alertTime(value:string|undefined,timezone?:string){if(!value)return'';const d=new Date(value);if(!Number.isFinite(d.getTime()))return'';const text=formatInZone(d,timezone,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),suffix=localTimeDisambiguationSuffix();return suffix?`${text} ${suffix}`:text}
function officialAlertValidity(alert:OfficialAlert,timezone?:string){const start=alert.onset??alert.effective,end=alert.expires,startText=start?`ab ${alertTime(start,timezone)}`:'',endText=end?`bis ${alertTime(end,timezone)}`:'';return[alert.preliminary||/vorabinformation|vorwarnung/i.test(alert.headline)?'Vorabinformation':undefined,startText,endText].filter(Boolean).join(' · ')||'gültig'}
function officialAlertIsRelevant(alert:OfficialAlert,now=Date.now()){const end=Date.parse(String(alert.expires??''));return!Number.isFinite(end)||end>now}
function automaticHazardIsRelevant(item:AutomaticHazard,now=Date.now()){const end=Date.parse(String(item.validTo??''));return!Number.isFinite(end)||end>now}

type HazardBadgeLevel='yellow'|'orange'|'red'|'purple';
const KMH_PER_KT=1.852;
function hazardLevelClass(level:DwdWarningLevel):HazardBadgeLevel{return level===4?'purple':level===3?'red':level===2?'orange':'yellow'}
function dailyHazards(day:Day,hours:Hour[],elevation=0,unit:WindUnit='kn',minimumLevel:DwdWarningLevel=1){return summarizeDwdWarningsForDay(hours,day.date,elevation).filter(signal=>signal.level>=minimumLevel).map(signal=>({kind:signal.kind,stageRank:Number(signal.stageRank)||signal.level,symbol:signal.symbol,value:formatDwdWarningCompactValue(signal,unit),title:signal.title,detail:[warningLeadLabel(signal.validFrom),formatDwdWarningDetail(signal,unit),formatDwdWarningDirection(signal)].filter(Boolean).join(' '),level:hazardLevelClass(signal.level)}))}
type DailyHazardBadge=ReturnType<typeof dailyHazards>[number];
function highestDailyHazardsByKind(items:DailyHazardBadge[],limit=3){
 const best=new Map<DwdWarningKind,DailyHazardBadge>();
 for(const item of items){const current=best.get(item.kind);if(!current||item.stageRank>current.stageRank)best.set(item.kind,item)}
 return items.filter(item=>best.get(item.kind)===item).slice(0,limit);
}
function strongestDailyHazards(items:DailyHazardBadge[],limit=3){
 if(!items.length)return[];
 const strongestStage=Math.max(...items.map(item=>item.stageRank));
 return highestDailyHazardsByKind(items.filter(item=>item.stageRank===strongestStage),limit);
}
function automaticHazardSymbol(kind?:DwdWarningKind){return kind==='wind'?'💨':kind==='thunderstorm'?'⚡':kind==='heavyRain'?'☔':kind==='continuousRain'?'🌧':kind==='snow'?'❄':kind==='snowdrift'?'🌬':kind==='ice'?'🧊':kind==='frost'?'❄️':kind==='fog'?'🌫':kind==='heat'?'☀️':'⚠️'}
function automaticHazardOverlapsDay(item:AutomaticHazard,date:string,timezone?:string){
 const start=Date.parse(String(item.validFrom??'')),end=Date.parse(String(item.validTo??''));if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return false;
 const first=localDateInZone(timezone,start),last=localDateInZone(timezone,end-1);return date>=first&&date<=last;
}
function widgetAutomaticHazardsForDay(date:string,items:AutomaticHazard[],timezone?:string):DailyHazardBadge[]{return items.filter(item=>automaticHazardOverlapsDay(item,date,timezone)).map(item=>({kind:item.kind??'wind',stageRank:Number(item.stageRank)||AUTOMATIC_HAZARD_LEVEL_RANK[item.level],symbol:automaticHazardSymbol(item.kind),value:item.displayMetric||item.metric||'',title:item.title,detail:[item.displayText||item.text,hazardValidityLabel(item.validFrom,item.validTo,timezone)?`Fenster ${hazardValidityLabel(item.validFrom,item.validTo,timezone)}`:''].filter(Boolean).join(' · '),level:item.level}))}
function normalizeDegrees(deg:number){return((Number(deg)%360)+360)%360}
function windToDegrees(deg:number){return normalizeDegrees(deg+180)}
function windDirectionDescription(deg:number){const from=normalizeDegrees(deg),to=windToDegrees(deg);return`Wind aus ${Math.round(from)}°, nach ${Math.round(to)}°`}
function windDirectionWarningLevel(gust?:number){return dwdWindWarningLevelKt(Number(gust))}
function WindDirectionArrow({direction,gust,className=''}:{direction:number;gust?:number;className?:string}){const to=windToDegrees(direction),description=windDirectionDescription(direction),warningLevel=windDirectionWarningLevel(gust);return <span className={`wind-direction-arrow warning-${warningLevel} ${className}`.trim()} style={{transform:`rotate(${to.toFixed(1)}deg)`}} role="img" aria-label={description} title={description}>↑</span>}
function WeatherPeriodIcons({dayVisual,nightVisual,daySize=44,nightSize=25}:{dayVisual:PeriodWeatherVisual;nightVisual?:PeriodWeatherVisual;daySize?:number;nightSize?:number}){return <span className="weather-period-icons"><span className="weather-period-day"><WeatherPictogram code={dayVisual.code} intensity={dayVisual.intensity} phenomenon={dayVisual.phenomenon} day size={daySize} style={{width:daySize,height:daySize}} title={dayVisual.title} cloud={dayVisual.cloud} lowCloud={dayVisual.lowCloud} midCloud={dayVisual.midCloud} highCloud={dayVisual.highCloud}/></span>{nightVisual?.available&&<span className="weather-period-night"><WeatherPictogram code={nightVisual.code} intensity={nightVisual.intensity} phenomenon={nightVisual.phenomenon} day={false} size={nightSize} style={{width:nightSize,height:nightSize}} compact title={nightVisual.title} cloud={nightVisual.cloud} lowCloud={nightVisual.lowCloud} midCloud={nightVisual.midCloud} highCloud={nightVisual.highCloud}/></span>}</span>}
function Title({eye,title,children}:{eye:string;title:string;children?:ReactNode}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div>{children&&<div className="title-tools">{children}</div>}</header>}
export {formatInZone,formatRawInZone,formatDateOnly,dateOnlyUtc,Title,WindDirectionArrow,windToDegrees,normalizeDegrees,windDirectionDescription,windDirectionWarningLevel,visibilityLabel,officialAlertIsRelevant,officialAlertKind,warningKindFromText,automaticHazardIsRelevant,officialAlertValidity,alertTime,officialAlertMetric,uniqueNumbers,KMH_PER_KT,hazardValidityLabel,strongestDailyHazards,dailyHazards,hazardLevelClass,highestDailyHazardsByKind,widgetAutomaticHazardsForDay,automaticHazardOverlapsDay,localDateInZone,AUTOMATIC_HAZARD_LEVEL_RANK,automaticHazardSymbol,WeatherPeriodIcons};
export type {AutomaticHazard,SkybarDisplayMode,DailyHazardBadge,HazardBadgeLevel,AutomaticHazardLevel};
