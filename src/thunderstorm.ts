import type {Hour,RadarNowcast,Station,ThunderstormNowcast,WindUnit} from './weather';

export type ThunderInfoLevel='yellow'|'orange'|'red'|'purple';
export type ThunderInfoFactTone='neutral'|'motion'|'rain'|'hail'|'wind'|'lightning';
export type ThunderInfoStatusKind='at-site'|'near'|'approaching'|'passing'|'surrounding'|'model';
export type ThunderInfoDetail={label:string;value:string};
export type ThunderInfoFact={label:string;value:string;tone?:ThunderInfoFactTone;prominent?:boolean};
export type ThunderInfoStatus={kind:ThunderInfoStatusKind;label:string;detail:string};
// Kompatibilitätsvertrag: export type ThunderInfoContext={timezone?:string;currentPlaceName?:string;forecastPlaceName?:string}
export type ThunderInfoContext={timezone?:string;currentPlaceName?:string;forecastPlaceName?:string;windUnit?:WindUnit};
export type ThunderInfo={
 level:ThunderInfoLevel;
 headline:string;
 summary:string;
 source:string;
 status?:ThunderInfoStatus;
 details?:ThunderInfoDetail[];
 quickFacts?:ThunderInfoFact[];
 detailLead?:string;
 advisory?:string;
};

const SEVERITY_LABELS=['schwach','moderat','stark','extrem'] as const;
function severityLevel(severity:number,hailFlag:number,heavyRainFlag:number,gustFlag=0):ThunderInfoLevel{
 const score=Math.max(Number(severity)||0,Number(hailFlag)||0,Number(heavyRainFlag)||0,Number(gustFlag)||0);
 return score>=3?'purple':score>=2?'red':score>=1?'orange':'yellow';
}
function severityText(value:number){return SEVERITY_LABELS[Math.max(0,Math.min(3,Math.round(Number(value)||0)))]}
function trendText(value:number){return value>=2?'schnell anwachsend':value===1?'anwachsend':value<=-2?'schnell abschwächend':value===-1?'abschwächend':'stabil'}
function compassWord(value:number|undefined){if(!Number.isFinite(Number(value)))return'';const labels=['nördlich','nordöstlich','östlich','südöstlich','südlich','südwestlich','westlich','nordwestlich'];return labels[Math.round((((Number(value)%360)+360)%360)/45)%8]}
function compassShort(value:number|undefined){if(!Number.isFinite(Number(value)))return'–';const labels=['N','NO','O','SO','S','SW','W','NW'];return`${Math.round(Number(value))}° ${labels[Math.round((((Number(value)%360)+360)%360)/45)%8]}`}
function decimal(value:number|undefined,digits=1){return Number.isFinite(Number(value))?new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(Number(value)):'–'}
function zulu(value?:string){if(!value)return'–';const date=new Date(value);return Number.isFinite(date.getTime())?`${date.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'})} ${date.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})}Z`:'–'}
function coordinate(lat:number|undefined,lon:number|undefined){return Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))?`${decimal(lat,3)}° N · ${decimal(lon,3)}° E`:'–'}
function flagText(value:number|undefined,none='kein Signal'){const number=Number(value);return Number.isFinite(number)&&number>0?`Stufe ${Math.round(number)}`:none}
function joinGerman(parts:string[]){if(parts.length<2)return parts[0]??'';return`${parts.slice(0,-1).join(', ')} und ${parts.at(-1)}`}
function stationRainText(station:Station|null){const rain=Number(station?.precipitation);if(!Number.isFinite(rain)||rain<.1)return'';return `${station?.provider?.includes('DWD')?'DWD-Station':'Station'} bestätigt Niederschlag`}
function selectedWindSpeed(kmh:number,unit:WindUnit='kmh'){if(!Number.isFinite(kmh))return'–';if(unit==='kn')return`${Math.round(kmh/1.852)} kt`;if(unit==='ms')return`${decimal(kmh/3.6,1)} m/s`;if(unit==='mph')return`${Math.round(kmh/1.609344)} mph`;return`${Math.round(kmh)} km/h`}
function gustSignalText(flag:number|undefined,unit:WindUnit='kmh'){const value=Math.round(Number(flag)||0),speed=value>=3?105:value===2?90:value===1?75:0,formatted=speed?selectedWindSpeed(speed,unit):'';return value>=3?`orkanartige Böen, teils über ${formatted} möglich`:value===2?`schwere Sturmböen bis etwa ${formatted} möglich`:value===1?`stürmische Böen bis etwa ${formatted} möglich`:'kein markantes Böensignal'}
function gustHeadlineText(flag:number|undefined){const value=Math.round(Number(flag)||0);return value>=3?'orkanartige Böen':value===2?'schwere Sturmböen':value===1?'stürmische Böen':''}
function hailSignalText(cell:NonNullable<ThunderstormNowcast['nearest']>){if(cell.areaLargeHail>0||cell.hailFlag>=2)return'größerer Hagel möglich';if(cell.areaHail>0||cell.hailFlag>=1)return'Hagel möglich';return'kein Hagelsignal'}
function hailHeadlineText(cell:NonNullable<ThunderstormNowcast['nearest']>){if(cell.areaLargeHail>0||cell.hailFlag>=2)return'größerer Hagel';if(cell.areaHail>0||cell.hailFlag>=1)return'Hagel';return''}
function heavyRainSignalText(flag:number|undefined){const value=Math.round(Number(flag)||0);return value>=3?'extremer Starkregen möglich':value===2?'heftiger Starkregen möglich':value===1?'Starkregen möglich':'kein Starkregensignal'}
function heavyRainHeadlineText(flag:number|undefined){const value=Math.round(Number(flag)||0);return value>=3?'extremem Starkregen':value===2?'heftigem Starkregen':value===1?'Starkregen':''}
function lightningActivityText(rate:number|undefined){const value=Number(rate);if(!Number.isFinite(value)||value<=0)return'keine Blitzaktivität im Zellobjekt';const activity=value>=30?'hoch':value>=15?'mäßig':'gering';return `${Math.round(value)} Blitze/5 min · Aktivität ${activity}`}
function normalizedPlace(value:string|undefined){return String(value||'').trim().replace(/\s+/g,' ')}
function samePlace(a:string|undefined,b:string|undefined){const normalized=(value:string|undefined)=>normalizedPlace(value).toLocaleLowerCase('de-DE').replace(/[^a-zäöüß0-9]/g,'');const left=normalized(a),right=normalized(b);return Boolean(left&&right&&(left===right||left.includes(right)||right.includes(left)))}
function namedCoordinate(placeName:string|undefined,lat:number|undefined,lon:number|undefined){const place=normalizedPlace(placeName),coords=coordinate(lat,lon);return place?`${place} · ${coords}`:coords}
function localForecastClock(cell:NonNullable<ThunderstormNowcast['nearest']>,arrival:number,timezone?:string){
 let epoch=Date.parse(String(cell.forecastTime||''));
 if(!Number.isFinite(epoch)&&Number.isFinite(arrival)&&arrival>=0)epoch=Date.now()+arrival*60000;
 if(!Number.isFinite(epoch))return'';
 try{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone||undefined}).format(new Date(epoch))}catch{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(epoch))}
}
function locationFocusText(cell:NonNullable<ThunderstormNowcast['nearest']>,locationName:string,currentDistance:number,atSite:boolean,currentPlaceName?:string){
 const direction=compassWord(cell.siteBearingDeg),place=normalizedPlace(currentPlaceName),placeText=place&&!samePlace(place,locationName)?`bei ${place}`:'';
 const relative=atSite?`unmittelbar bei ${locationName}`:Number.isFinite(currentDistance)?`${Math.max(1,Math.round(currentDistance))} km${direction?` ${direction}`:''} von ${locationName}`:`in der Nähe von ${locationName}`;
 return[placeText,relative].filter(Boolean).join(' · ');
}
function approachWindowText(cell:NonNullable<ThunderstormNowcast['nearest']>,locationName:string,approaching:boolean,movingAway:boolean,arrival:number,currentDistance:number,forecastDistance:number,effectiveDistance:number,uncertainty:number,context:ThunderInfoContext){
 const clock=localForecastClock(cell,arrival,context.timezone),when=clock?`gegen ${clock} Uhr`:Number.isFinite(arrival)&&arrival>0?`in etwa ${Math.round(arrival)} min`:'zum berechneten Prognosezeitpunkt',forecastPlace=normalizedPlace(context.forecastPlaceName),placeSuffix=forecastPlace&&!samePlace(forecastPlace,locationName)?` · Zellzentrum dann bei ${forecastPlace}`:'',withinUncertainty=Number.isFinite(forecastDistance)&&Number.isFinite(uncertainty)&&forecastDistance<=uncertainty,siteHitPossible=withinUncertainty||(Number.isFinite(effectiveDistance)&&effectiveDistance<=.5);
 if(approaching){
  if(siteHitPossible)return`Möglicher Standorttreffer in ${locationName} ${when}${placeSuffix}`;
  return Number.isFinite(forecastDistance)?`Nächste Annäherung an ${locationName} ${when} auf ca. ${Math.max(0,Math.round(forecastDistance))} km${placeSuffix}`:`Nächste Annäherung an ${locationName} ${when}${placeSuffix}`;
 }
 if(movingAway)return`Nächste Annäherung an ${locationName} voraussichtlich bereits erfolgt; Zellzentrum zieht vorbei${Number.isFinite(forecastDistance)?` und ist anschließend ca. ${Math.round(forecastDistance)} km entfernt und damit nicht näher`:''}`;
 if(Number.isFinite(currentDistance)&&currentDistance<=25)return`Zellzentrum aktuell ca. ${Math.max(1,Math.round(currentDistance))} km entfernt; keine nähere Passage von ${locationName} berechnet`;
 return`Keine belastbare Annäherung an ${locationName} berechnet`;
}
function threatHeadline(nearNow:boolean,atSite:boolean,approaching:boolean,movingAway:boolean){return atSite?'Gewitterzelle unmittelbar am Standort':nearNow?'Gewitterzelle nahe':approaching?'Gewitterzelle nähert sich':movingAway?'Gewitterzelle zieht voraussichtlich vorbei':'Gewitterzelle im Umfeld'}
function impactHeadline(cell:NonNullable<ThunderstormNowcast['nearest']>){
 const severity=Math.max(Number(cell.severity)||0,Number(cell.hailFlag)||0,Number(cell.heavyRainFlag)||0,Number(cell.gustFlag)||0);
 const base=severity>=3?'Sehr starkes Gewitter':severity>=2?'Starkes Gewitter':severity>=1?'Kräftiges Gewitter':'Gewitter';
 const rain=heavyRainHeadlineText(cell.heavyRainFlag),possible=[hailHeadlineText(cell),gustHeadlineText(cell.gustFlag)].filter(Boolean);
 if(rain)return`${base} mit ${rain}${possible.length?`; ${joinGerman(possible)} möglich`:''}`;
 if(possible.length)return`${base}; ${joinGerman(possible)} möglich`;
 return base;
}
function movementStatus(cell:NonNullable<ThunderstormNowcast['nearest']>,locationName:string,currentDistance:number,forecastDistance:number,effectiveDistance:number,uncertainty:number,arrival:number,nearNow:boolean,atSite:boolean,approaching:boolean,movingAway:boolean,context:ThunderInfoContext):ThunderInfoStatus{
 if(atSite)return{kind:'at-site',label:'Am Standort',detail:`Zellzentrum unmittelbar bei ${locationName}`};
 if(approaching)return{kind:'approaching',label:'Nähert sich',detail:approachWindowText(cell,locationName,true,false,arrival,currentDistance,forecastDistance,effectiveDistance,uncertainty,context)};
 if(nearNow)return{kind:'near',label:'In unmittelbarer Nähe',detail:approachWindowText(cell,locationName,false,false,arrival,currentDistance,forecastDistance,effectiveDistance,uncertainty,context)};
 if(movingAway)return{kind:'passing',label:'Zieht voraussichtlich vorbei',detail:approachWindowText(cell,locationName,false,true,arrival,currentDistance,forecastDistance,effectiveDistance,uncertainty,context)};
 return{kind:'surrounding',label:'Im Umfeld',detail:approachWindowText(cell,locationName,false,false,arrival,currentDistance,forecastDistance,effectiveDistance,uncertainty,context)};
}
function motionFact(cell:NonNullable<ThunderstormNowcast['nearest']>){
 const direction=Number.isFinite(Number(cell.motionDirectionDeg))?`nach ${compassShort(cell.motionDirectionDeg)}`:'Richtung nicht belastbar';
 return cell.speedKmh>0?`${direction} · ${Math.round(cell.speedKmh)} km/h`:direction;
}

export function combineThunderstormInformation(nowcast:ThunderstormNowcast|null,hours:Hour[],radar:RadarNowcast|null,station:Station|null,locationName='Standort',context:ThunderInfoContext={}):ThunderInfo|null{
 const cell=nowcast?.nearest;
 if(nowcast?.available&&cell&&cell.relevanceDistanceKm<=80){
  const currentDistanceRaw=Number(cell.currentDistanceKm),currentDistance=Number.isFinite(currentDistanceRaw)?Math.max(0,currentDistanceRaw):Number.NaN,forecastDistance=Number(cell.forecastDistanceKm),effectiveDistance=Number(cell.forecastEffectiveDistanceKm),uncertainty=Number(cell.forecastUncertaintyKm),arrival=Number(cell.arrivalMinutes),nearNow=Number.isFinite(currentDistance)&&currentDistance<=25,atSite=Number.isFinite(currentDistance)&&currentDistance<1,centerGetsCloser=Number.isFinite(currentDistance)&&Number.isFinite(forecastDistance)&&forecastDistance+2<currentDistance,approaching=Boolean(cell.isApproaching&&centerGetsCloser&&Number.isFinite(forecastDistance)&&(Number.isFinite(arrival)&&arrival>=0&&arrival<=90||Boolean(cell.forecastTime))),movingAway=Boolean(!approaching&&!nearNow&&Number.isFinite(currentDistance)&&Number.isFinite(forecastDistance)&&forecastDistance>currentDistance+2),direction=compassWord(cell.siteBearingDeg),status=movementStatus(cell,locationName,currentDistance,forecastDistance,effectiveDistance,uncertainty,arrival,nearNow,atSite,approaching,movingAway,context),legacyHeadline=threatHeadline(nearNow,atSite,approaching,movingAway),headline=impactHeadline(cell),position=locationFocusText(cell,locationName,currentDistance,atSite,context.currentPlaceName);
  const positionText=atSite?`Aktuell unmittelbar bei ${locationName}`:Number.isFinite(currentDistance)?`Aktuell ${Math.max(1,Math.round(currentDistance))} km${direction?` ${direction}`:''} von ${locationName}`:`Aktuelle Entfernung zu ${locationName} nicht belastbar verfügbar`;
  const approachText=approaching&&Number.isFinite(forecastDistance)?`; größte berechnete Annäherung des Zellzentrums ${localForecastClock(cell,arrival,context.timezone)?`gegen ${localForecastClock(cell,arrival,context.timezone)} Uhr `:''}auf ca. ${Math.max(0,Math.round(forecastDistance))} km`:approaching?`; mögliche Annäherung in etwa ${Math.round(arrival)} min`:movingAway&&Number.isFinite(forecastDistance)?`; Zellzentrum in der Prognose anschließend ca. ${Math.round(forecastDistance)} km entfernt und damit nicht näher`:'';
  const summary=`${positionText}${approachText}. ${motionFact(cell)}. ${lightningActivityText(cell.lightningRate)}; Zelltrend ${trendText(cell.trend)}.`;
  const quickFacts:ThunderInfoFact[]=[
   {label:'Zellposition',value:position,tone:'motion',prominent:true},
   {label:'Zug',value:motionFact(cell),tone:'motion',prominent:true}
  ];
  if(cell.heavyRainFlag>0)quickFacts.push({label:'Starkregen',value:heavyRainSignalText(cell.heavyRainFlag),tone:'rain',prominent:true});
  if(cell.hailFlag>0||cell.areaHail>0)quickFacts.push({label:'Hagel',value:hailSignalText(cell),tone:'hail',prominent:true});
  if((cell.gustFlag??0)>0)quickFacts.push({label:'Windböen',value:gustSignalText(cell.gustFlag,context.windUnit),tone:'wind',prominent:true});
  if(cell.lightningRate>0)quickFacts.push({label:'Blitzaktivität',value:lightningActivityText(cell.lightningRate),tone:'lightning',prominent:false});
  const forecastClock=localForecastClock(cell,arrival,context.timezone),details:ThunderInfoDetail[]=[
   {label:'Bezugsort',value:locationName},
   {label:'Bewertung für den Bezugsort',value:status.detail},
   {label:'Zellkennung',value:cell.id},
   {label:'Aktuelle Zellposition',value:namedCoordinate(context.currentPlaceName,cell.latitude,cell.longitude)},
   {label:'Aktuelle Entfernung / Richtung',value:atSite?`unter 1 km · ${compassShort(cell.siteBearingDeg)}`:Number.isFinite(currentDistance)?`${decimal(currentDistance)} km · ${compassShort(cell.siteBearingDeg)}`:'–'},
   {label:'Zellstufe / Trend',value:`${severityText(cell.severity)} · ${trendText(cell.trend)}`},
   {label:'Zellverlagerung',value:Number.isFinite(Number(cell.motionDirectionDeg))||cell.speedKmh>0?`nach ${compassShort(cell.motionDirectionDeg)} · ${Math.round(cell.speedKmh||0)} km/h`:'nicht belastbar verfügbar'},
   {label:'Prognostizierte Position',value:namedCoordinate(context.forecastPlaceName,cell.forecastLatitude,cell.forecastLongitude)},
   {label:'Zeit der nächsten Annäherung',value:forecastClock?`${forecastClock} Uhr Ortszeit · ${zulu(cell.forecastTime)}`:zulu(cell.forecastTime)},
   {label:'Abstand der prognostizierten Position',value:Number.isFinite(forecastDistance)?`${decimal(forecastDistance)} km`:'–'},
   {label:'Wirksamer Mindestabstand',value:Number.isFinite(effectiveDistance)?`${decimal(effectiveDistance)} km${Number.isFinite(uncertainty)?` · Unsicherheitsradius ${decimal(uncertainty)} km`:''}`:'–'},
   {label:'Blitzaktivität',value:cell.lightningRate>0?`${Math.round(cell.lightningRate)} Blitze je 5 min`:'kein Blitzsignal im Zellobjekt'},
   {label:'Hagel',value:`${flagText(cell.hailFlag)}${cell.areaHail>0?` · Hagelfläche ${decimal(cell.areaHail)} km²`:''}${cell.areaLargeHail>0?` · Großhagelfläche ${decimal(cell.areaLargeHail)} km²`:''}`},
   {label:'Starkregen',value:flagText(cell.heavyRainFlag)},
   {label:'Böen',value:(cell.gustFlag??0)>0?gustSignalText(cell.gustFlag,context.windUnit):flagText(cell.gustFlag)},
   {label:'Datenstand',value:`${zulu(nowcast.observedAt)}${Number.isFinite(Number(nowcast.ageMinutes))?` · ${Math.max(0,Math.round(Number(nowcast.ageMinutes)))} min alt`:''}`},
   {label:'Erkannte Zellen',value:`${nowcast.cellsFound} insgesamt · ${nowcast.nearbyCells.length} im 80-km-Umfeld`}
  ];
  return{
   level:severityLevel(cell.severity,cell.hailFlag,cell.heavyRainFlag,cell.gustFlag),
   headline,
   summary,
   status,
   source:`DWD KONRAD3D · 5-minütig${Number.isFinite(Number(nowcast.ageMinutes))?` · ${Math.max(0,Math.round(Number(nowcast.ageMinutes)))} min alt`:''} · keine amtliche Warnung`,
   quickFacts,
   detailLead:`${legacyHeadline}. ${status.label}: ${status.detail}. Die farblich hervorgehobenen Kernauswirkungen beruhen auf den aktuellen KONRAD3D-Signalen.`,
   advisory:'Hinweis: Es handelt sich um eine automatische KONRAD3D-/Radar-/Modellanalyse und nicht um eine amtliche Warnung. Lokal können Intensität, Zugbahn und Auswirkungen kurzfristig abweichen.',
   details
  };
 }
 const now=Date.now(),next=hours.filter(hour=>hour.epoch>=now-30*60000&&hour.epoch<=now+3*3600000),thunder=next.find(hour=>[95,96,97,98,99].includes(Math.round(hour.code))),highCape=Math.max(0,...next.map(hour=>Number(hour.cape)||0)),radarRate=Number(radar?.currentRate||0),stationRain=stationRainText(station),combinedConvectiveSignal=radarRate>=8&&highCape>=750;
 if(!thunder&&!combinedConvectiveSignal)return null;
 const severe=Boolean(thunder&&[96,97,98,99].includes(Math.round(thunder.code)))||highCape>=1800||radarRate>=25,extra=[thunder?'Best Match signalisiert Gewitter':'starkes Radarecho mit erhöhter Konvektionsenergie',radarRate>=8?`Radarecho ${Math.round(radarRate)} mm/h`:'',highCape>=750?`CAPE ${Math.round(highCape)} J/kg`:'',stationRain].filter(Boolean).join(' · '),quickFacts:ThunderInfoFact[]=[{label:'Zeitraum',value:'nächste 3 Stunden',tone:'motion',prominent:true},{label:'Radarintensität',value:radarRate>=.05?`${decimal(radarRate)} mm/h`:'kein Standortecho',tone:'rain',prominent:true},{label:'Konvektionsenergie',value:highCape>0?`${Math.round(highCape)} J/kg`:'nicht verfügbar',tone:'lightning',prominent:true},{label:'KONRAD3D',value:nowcast?.summary||'keine relevante aktuelle Zelle',tone:'neutral',prominent:false}],status:ThunderInfoStatus={kind:'model',label:'Modellsignal',detail:`Keine nah relevante aktuelle KONRAD3D-Zelle bei ${locationName}`};
 return{level:severe?'orange':'yellow',headline:severe?'Deutliches Gewittersignal':'Gewittersignal',summary:`In den kommenden drei Stunden bei ${locationName}: ${extra}.`,source:'Modell-, Radar- und Stationsabgleich · keine amtliche Warnung',status,quickFacts,detailLead:'Es liegt derzeit keine nah relevante KONRAD3D-Zelle vor. Die Information basiert daher vor allem auf Modell-, Radar- und gegebenenfalls Stationssignalen.',advisory:'Hinweis: Es handelt sich um eine automatische Vorabinformation und nicht um eine amtliche Warnung.',details:[{label:'Bezugsort',value:locationName},{label:'Radarintensität',value:radarRate>=.05?`${decimal(radarRate)} mm/h`:'kein Standortecho'},{label:'Konvektionsenergie',value:highCape>0?`${Math.round(highCape)} J/kg`:'nicht verfügbar'},{label:'KONRAD3D',value:nowcast?.summary||'keine relevante aktuelle Zelle'}]};
}
