import {applyEnsembleDailyPrecipitationProbability,bestMatchModelInfo,eventEnsembleForecast,forecast,label,localIsoEpoch,mapDays,mapHours,radarNowcast,station,stationFieldObservationUsable,thunderstormNowcast,type EventPrecipitationProbabilityAssessment,type Hour,type Location} from './weather'
import {applyForecastFusionDays,applyForecastFusionHours,applyHyperlocalForecastHours,finalizeForecastHours,forecastFusionLabel,loadForecastFusion,type ForecastFusionResult,type ForecastLocalAnchor} from './forecastFusion'
import {compactPrecipitationTypeLabel,precipitationParts} from './precipitation'
import {loadEventFlightHazards} from './eventAviation'
import {applyLocalTwinForecastFromReport,applyLocalTwinHours,buildForecastVerificationReport,readWeatherTwinSettings} from './forecastVerification'
import type {EventActivity,EventAdvice,EventEnvironment,EventPlan,EventStatus,EventSummary,EventTimelinePoint} from './eventCenter'
import {forecastLocalAnchorFromCurrent} from './forecastLocalAnchor'

export type BuildEventPlanOptions={
 location:Location
 eventDate:string
 eventStartTime:string
 eventEndTime:string
 eventEnvironment:EventEnvironment
 eventActivity:EventActivity
 eventTitle:string
 signal:AbortSignal
 forceFresh?:boolean
 canonical?:{
  initialLocation:Location
  hours:Hour[]
  fusion:ForecastFusionResult|null
  weatherTwinApplied:boolean
 }
}

function sameForecastLocation(a:Location,b:Location){const meanLat=(a.latitude+b.latitude)*Math.PI/360,dLat=(a.latitude-b.latitude)*111.32,dLon=(a.longitude-b.longitude)*111.32*Math.cos(meanLat);return Math.hypot(dLat,dLon)<=.35}
function parseMinuteStamp(value:string){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!match)return Number.NaN;return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))}
function eventWindowEndDate(date:string,startTime:string,endTime:string){return endTime<startTime?new Date(parseMinuteStamp(`${date}T00:00`)+86400000).toISOString().slice(0,10):date}
function unique<T>(values:(T|null|undefined)[]){return values.filter((value,index,array)=>value!=null&&array.indexOf(value)===index) as T[]}
function weatherSeverity(code:number|null){if(code==null)return 0;if([95,96,99].includes(code))return 6;if([71,73,75,77,85,86].includes(code))return 5;if([65,67,82].includes(code))return 4;if([63,66,81].includes(code))return 3;if([61,80,51,53,55,56,57].includes(code))return 2;if([45,48].includes(code))return 1;return 0}
function majorWeatherCode(codes:(number|null)[]){const ranked=unique(codes).sort((a,b)=>weatherSeverity(b)-weatherSeverity(a));return ranked[0]??null}
function mean(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null&&Number.isFinite(value));if(!usable.length)return null;return usable.reduce((sum,value)=>sum+value,0)/usable.length}
function maximum(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null&&Number.isFinite(value));return usable.length?Math.max(...usable):null}
function minimum(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null&&Number.isFinite(value));return usable.length?Math.min(...usable):null}
async function eventSourceWithin<T>(parent:AbortSignal,timeoutMs:number,load:(signal:AbortSignal)=>Promise<T>,fallback:T):Promise<T>{
 const controller=new AbortController(),abort=()=>controller.abort(parent.reason)
 if(parent.aborted){abort();throw parent.reason??new DOMException('Abgebrochen','AbortError')}
 parent.addEventListener('abort',abort,{once:true})
 let timer=0
 const timeout=new Promise<never>((_,reject)=>{timer=window.setTimeout(()=>{const reason=new DOMException('Zeitüberschreitung','TimeoutError');controller.abort(reason);reject(reason)},timeoutMs)})
 try{return await Promise.race([load(controller.signal),timeout])}catch(reason){if(parent.aborted)throw reason;return fallback}finally{window.clearTimeout(timer);parent.removeEventListener('abort',abort)}
}
function eventWeatherPart(point:EventTimelinePoint){return precipitationParts({time:point.time,precipitation:point.precipitation??0,rain:point.rain??0,showers:point.showers??0,snowfall:point.snowfall??0,probability:point.precipitationProbability??0,code:point.weatherCode??0,temperature:point.temperature??undefined,humidity:point.humidity??undefined,cloud:point.cloud??undefined,lowCloud:point.lowCloud??undefined,cape:point.cape??undefined,liftedIndex:point.liftedIndex??undefined,convectiveInhibition:point.convectiveInhibition??undefined,sunshineDuration:point.sunshineDuration??undefined,isDay:point.isDay})}
function summarizeTimeline(timeline:EventTimelinePoint[],fusion:ForecastFusionResult|null,eventProbability?:EventPrecipitationProbabilityAssessment|null,weatherTwinApplied=false):EventSummary{
 const temperatures=timeline.map(point=>point.temperature),apparents=timeline.map(point=>point.apparent),precipitationProbabilities=timeline.map(point=>point.precipitationProbability),winds=timeline.map(point=>point.wind),gusts=timeline.map(point=>point.gust),uvValues=timeline.map(point=>point.uv),visibilities=timeline.map(point=>point.visibility),parts=timeline.map(point=>({point,part:eventWeatherPart(point)})),wet=parts.filter(row=>row.part.type!=='none'),representative=(wet.length?wet:parts).sort((a,b)=>weatherSeverity(b.part.displayCode)-weatherSeverity(a.part.displayCode)||((b.point.precipitationProbability??0)+(b.point.precipitation??0)*8)-((a.point.precipitationProbability??0)+(a.point.precipitation??0)*8))[0],groups=new Set((fusion?.sources??[]).filter(source=>source.successful&&source.consensusRole!=='postprocessing').map(source=>source.independenceGroup||source.family))
 const probabilityWinner=[...wet].sort((a,b)=>(b.point.precipitationProbability??0)-(a.point.precipitationProbability??0)||b.part.total-a.part.total||weatherSeverity(b.part.displayCode)-weatherSeverity(a.part.displayCode))[0]
 const probabilityRows=timeline.map(point=>({probability:point.precipitationProbability==null?NaN:Number(point.precipitationProbability),minutes:Number(point.durationMinutes)})).filter(row=>Number.isFinite(row.probability)&&row.probability>=0&&Number.isFinite(row.minutes)&&row.minutes>0),coveredMinutes=probabilityRows.reduce((sum,row)=>sum+row.minutes,0),windowAverageProbability=coveredMinutes>0?probabilityRows.reduce((sum,row)=>sum+row.probability*row.minutes,0)/coveredMinutes:mean(precipitationProbabilities)
 const precipitationProbabilityRelevant=eventProbability?.probability??null
 const precipitationTypeLabel=probabilityWinner?compactPrecipitationTypeLabel(probabilityWinner.part.type):undefined,sunshineRows=timeline.filter(point=>point.sunshineDuration!=null&&Number.isFinite(point.sunshineDuration)&&Number(point.sunshineDuration)>=0),sunshineDurationTotal=sunshineRows.length?sunshineRows.reduce((sum,point)=>sum+Math.min(Math.max(1,Number(point.durationMinutes)||60)*60,Math.max(0,Number(point.sunshineDuration))),0):null
 return{hours:timeline.length,temperatureAvg:mean(temperatures),temperatureMin:minimum(temperatures),temperatureMax:maximum(temperatures),apparentAvg:mean(apparents),precipitationProbabilityMax:maximum(precipitationProbabilities),precipitationProbabilityRelevant,hourlyMeanProbability:windowAverageProbability,coverageComplete:timeline.length>0&&timeline.every(point=>[point.temperature,point.wind,point.gust,point.precipitation,point.weatherCode].every(value=>value!=null&&Number.isFinite(value))),precipitationProbabilitySignificant:eventProbability?.probabilitySignificant,precipitationProbabilitySource:eventProbability?'ensemble-members-dwd-event':'unavailable',precipitationProbabilityMemberCount:eventProbability?.memberCount,precipitationProbabilityModelFamilies:eventProbability?.modelFamilyCount,precipitationTypeLabel,precipitationTotal:timeline.every(point=>point.precipitation!=null&&Number.isFinite(point.precipitation))?timeline.reduce((sum,point)=>sum+Number(point.precipitation),0):null,sunshineDurationTotal,windMax:maximum(winds),gustMax:maximum(gusts),uvMax:maximum(uvValues),visibilityMin:minimum(visibilities),weatherCode:representative?.part.displayCode??majorWeatherCode(timeline.map(point=>point.weatherCode)),weatherLabel:representative?.part.type==='none'?label(representative.part.displayCode):representative?.part.weatherLabel,weatherSourceLabel:representative?.point.weatherSourceLabel,isDay:representative?.point.isDay,modelFamilyCount:groups.size||undefined,rapidCycleUsed:Boolean(fusion?.sources?.some(source=>source.successful&&source.rapidUpdate)),weatherTwinApplied}
}
function eventPrecipProbability(summary:EventSummary){return summary.precipitationProbabilitySource==='ensemble-members-dwd-event'?summary.precipitationProbabilityRelevant:null}
function evaluateEvent(summary:EventSummary,environment:EventEnvironment,activity:EventActivity):EventAdvice{
 const tips:string[]=[]
 const behavior:string[]=[]
 let severity=0;const incomplete=summary.coverageComplete===false||eventPrecipProbability(summary)==null;if(incomplete){severity=3;tips.push('Datengrundlage oder Ereigniswahrscheinlichkeit unvollständig; keine belastbare Entwarnung.');behavior.push('Vor Durchführung aktuelle Daten und amtliche Hinweise prüfen.')}
 const thunder=[95,96,99].includes(summary.weatherCode??-1)
 if(thunder){severity+=5;tips.push('Im Veranstaltungszeitraum besteht Gewitterpotenzial.');behavior.push(activity==='flight'?'Flugplanung gegen aktuelle METAR/TAF und amtliche Flugwetterberatung abgleichen.':'Bei Gewitter Aufenthalte im Freien vermeiden; geschützte Bereiche und eine belastbare Unterbrechungs- oder Ausweichmöglichkeit vorsehen.')}
 if((eventPrecipProbability(summary)??0)>=75||(summary.precipitationTotal??0)>=5){severity+=environment==='indoor'?1:3;tips.push('Im Veranstaltungszeitraum besteht eine hohe Wahrscheinlichkeit für Niederschlag.');behavior.push(environment==='indoor'?'Für An- und Abreise zusätzliche Zeitreserve berücksichtigen.':'Ausreichenden Witterungsschutz und eine witterungsgeschützte Ausweichmöglichkeit vorsehen.')}
 else if((eventPrecipProbability(summary)??0)>=40||(summary.precipitationTotal??0)>=1.5){severity+=environment==='indoor'?0:2;tips.push(summary.weatherLabel?.includes('Sprühregen')?'Zeitweise ist Sprühregen möglich.':'Zeitweise ist Niederschlag möglich.');behavior.push('Witterungsschutz bereithalten und den Ablauf bei Bedarf kurzfristig anpassen.')}
 if((summary.windMax??0)>=22||(summary.gustMax??0)>=34){severity+=environment==='indoor'?1:3;tips.push('Starker Wind beziehungsweise markante Böen können den Ablauf beeinträchtigen.');behavior.push(activity==='watersports'?'Gewässerzustand sowie zulässige Wind- und Materialgrenzen prüfen.':activity==='flight'?'Start-/Landephase und lokale Windgrenzen gesondert prüfen.':'Windempfindliche Aufbauten und Ausrüstung sichern; exponierte Bereiche besonders berücksichtigen.')}
 else if((summary.windMax??0)>=14||(summary.gustMax??0)>=24){severity+=1;tips.push('Zeitweise ist mäßiger bis frischer Wind möglich.');behavior.push(activity==='flight'?'Böen und lokale Windrichtung vor Abflug prüfen.':'Windwirkung bei Streckenwahl, Aufenthaltsort und Ausrüstung berücksichtigen.')}
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29){severity+=2;tips.push('Eine erhöhte Wärmebelastung ist möglich.');behavior.push('Ausreichende Trinkwasserversorgung sicherstellen, regelmäßige Erholungspausen vorsehen und längere Aufenthalte in direkter Sonne nach Möglichkeit vermeiden.')}
 if((summary.temperatureMin??summary.temperatureAvg??99)<=3){severity+=2;tips.push('Niedrige Temperaturen können zu Kältebelastung führen.');behavior.push('Geeigneten Kälteschutz vorsehen und ausreichende Aufwärmphasen ermöglichen.')}
 if((summary.uvMax??0)>=6&&environment!=='indoor'&&activity!=='flight'){severity+=1;tips.push('Eine erhöhte UV-Belastung ist möglich.');behavior.push('Geeigneten UV-Schutz verwenden und längere direkte Sonnenexposition begrenzen.')}
 if((summary.visibilityMin??99999)<1000){severity+=2;tips.push('Zeitweise kann die Sicht deutlich eingeschränkt sein.');behavior.push(activity==='flight'?'Sichtminima und Alternates gesondert prüfen.':'Für Anfahrt und Wegführung zusätzliche Sicherheits- und Zeitreserven berücksichtigen.')}
 if(activity==='cycling'||activity==='running'||activity==='hiking')behavior.push('Untergrundverhältnisse auf Nässe und erhöhte Rutschgefahr prüfen.')
 if(activity==='skiing')behavior.push('Bergwetter, Höhenwind und Schneefallgrenze zusätzlich prüfen.')
 if(activity==='golf'||activity==='tennis'||activity==='football')behavior.push('Eine kurzfristige Unterbrechung bei stärkeren Böen oder Schauern organisatorisch ermöglichen.')
 if(activity==='concert'||activity==='city')behavior.push('Dauer und Lage von Außenaufenthalten an die aktuelle Wetterentwicklung anpassen.')
 if(activity==='gym'||activity==='yoga'||environment==='indoor')behavior.push('Wetterbedingte Einschränkungen betreffen hier vor allem An- und Abreise.')
 if(activity==='watersports')behavior.push('Wassertemperatur, Gewässerstatus und lokale Hinweise ergänzend prüfen.')
 if(activity==='flight'&&summary.flightHazards){
  const flight=summary.flightHazards
  if(flight.overall==='caution')severity=Math.max(severity,7)
  else if(flight.overall==='watch')severity=Math.max(severity,4)
  for(const item of flight.items.filter(item=>item.level!=='none').slice(0,3))tips.push(`${item.label}: ${item.detail}.`)
  behavior.push('Vereisung, Turbulenz/CAT, Wolkenuntergrenze und Sicht gegen aktuelle Flugwetterprodukte verifizieren.')
 }
 const status:EventStatus=severity>=6?'caution':severity>=3?'watch':'good'
 if(!tips.length)tips.push(activity==='flight'?'Keine markante flugmeteorologische Einschränkung im MID-Screening.':'Keine markante Wettereinschränkung im Zeitfenster.')
 if(!behavior.length)behavior.push('Nach aktuellem Stand sind keine besonderen wetterbedingten Maßnahmen erforderlich; die Wetterentwicklung bis zum Termin weiter beobachten.')
 const headline=incomplete&&severity<6?'Datengrundlage unvollständig':activity==='flight'?status==='good'?'Flugmeteorologisch unauffällig':status==='watch'?'Flugmeteorologische Einschränkungen prüfen':'Flugmeteorologisch kritisch':status==='good'?'Günstige Bedingungen':status==='watch'?'Einzelne Einschränkungen beachten':'Wetterkritische Bedingungen'
 const summaryText=incomplete&&severity<6?'Nicht alle relevanten Wettergrößen oder die Ereigniswahrscheinlichkeit sind verfügbar. Vorhandene Hinweise bleiben zu beachten.':activity==='flight'?status==='good'?'Das MID-Screening zeigt aktuell keine markante flugmeteorologische Einschränkung.':status==='watch'?'Mindestens ein flugmeteorologischer Faktor verdient vor Abflug eine gezielte Prüfung.':'Mehrere oder markante flugmeteorologische Faktoren können die Durchführung einschränken.':status==='good'?'Nach aktuellem Stand bestehen keine markanten wetterbedingten Einschränkungen.':status==='watch'?'Einzelne Wetterfaktoren können den Ablauf beeinflussen und sollten bei der Vorbereitung berücksichtigt werden.':'Markante Wetterfaktoren können den Ablauf erheblich beeinträchtigen.'
 return{status,headline,summary:summaryText,tips:unique(tips).slice(0,4),behavior:unique(behavior).slice(0,4)}
}
function clockFromCivilStamp(stamp:number,timezone?:string){if(timezone)return new Intl.DateTimeFormat('de-DE',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(stamp);const date=new Date(stamp);return`${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`}
function timelineForWindow(hours:Hour[],date:string,startTime:string,endTime:string,timezone?:string){
 const stamp=(value:string)=>timezone?localIsoEpoch(value,timezone,0):parseMinuteStamp(value),startStamp=stamp(`${date}T${startTime}`)
 const endStamp=stamp(`${eventWindowEndDate(date,startTime,endTime)}T${endTime}`)
 if(!Number.isFinite(startStamp)||!Number.isFinite(endStamp))return[] as EventTimelinePoint[]
 if(endStamp<=startStamp)return[] as EventTimelinePoint[]
 const rows=hours.map(hour=>({hour,stamp:timezone&&Number.isFinite(hour.epoch)?hour.epoch:stamp(hour.time)})).filter(row=>Number.isFinite(row.stamp)).sort((a,b)=>a.stamp-b.stamp),result:EventTimelinePoint[]=[]
 if(rows.some((row,index)=>index>0&&row.stamp===rows[index-1].stamp&&row.stamp>=startStamp&&row.stamp<=endStamp))return result
 for(let index=0;index<rows.length;index++){
  const {hour,stamp:intervalEnd}=rows[index],previous=index>0?rows[index-1].stamp:intervalEnd-3600000,rawStep=intervalEnd-previous,step=Number.isFinite(rawStep)&&rawStep>=15*60000&&rawStep<=3*3600000?rawStep:3600000,intervalStart=intervalEnd-step,overlapStart=Math.max(intervalStart,startStamp),overlapEnd=Math.min(intervalEnd,endStamp)
  if(overlapEnd<=overlapStart)continue
  const fraction=(overlapEnd-overlapStart)/step,scaled=(value:number|null|undefined)=>value!=null&&Number.isFinite(value)?Number(value)*fraction:null,precipitation=scaled(hour.precipitation),rain=scaled(hour.rain),showers=scaled(hour.showers),snowfall=scaled(hour.snowfall),sunshineDuration=scaled(hour.sunshineDuration)
  const part=precipitationParts({time:hour.time,epoch:hour.epoch,timezone:hour.timezone,precipitation:precipitation??0,rain:rain??0,showers:showers??0,snowfall:snowfall??0,probability:hour.probability,code:hour.code,temperature:hour.temperature,dewPoint:hour.dewPoint,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:sunshineDuration??undefined,isDay:hour.isDay})
  result.push({time:clockFromCivilStamp(overlapEnd,timezone),periodLabel:`${clockFromCivilStamp(overlapStart,timezone)}–${clockFromCivilStamp(overlapEnd,timezone)}`,durationMinutes:Math.max(1,Math.round((overlapEnd-overlapStart)/60000)),temperature:hour.temperature,apparent:hour.apparent,precipitationProbability:hour.probability,precipitation,rain,showers,snowfall,weatherCode:Number.isFinite(hour.code)?part.displayCode:null,weatherLabel:part.type==='none'?label(part.displayCode):part.weatherLabel,wind:hour.wind,gust:hour.gust,uv:hour.uvIndex,visibility:hour.visibility,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration,isDay:hour.isDay,weatherSourceId:hour.weatherSourceId,weatherSourceLabel:hour.weatherSourceLabel})
 }
 return result
}

export async function buildEventPlan(options:BuildEventPlanOptions):Promise<EventPlan>{
 const {location,eventDate,eventStartTime,eventEndTime,eventEnvironment,eventActivity,eventTitle,signal,forceFresh=false,canonical}=options
 const country=location.country_code||location.country,[weather,modelInfo,fusion,eventEnsemble]=await Promise.all([
  forecast(location.latitude,location.longitude,signal,{priority:'normal',forceFresh,timeZone:location.timezone,elevation:location.elevation}),
  eventSourceWithin(signal,12000,sourceSignal=>bestMatchModelInfo(location.latitude,location.longitude,country,sourceSignal),null),
  eventSourceWithin(signal,26000,sourceSignal=>loadForecastFusion(location.latitude,location.longitude,country,location.elevation,sourceSignal,forceFresh),null),
  eventSourceWithin(signal,22000,()=>eventEnsembleForecast(location.latitude,location.longitude,eventDate,eventStartTime,eventEndTime,signal,forceFresh),{days:[],models:[],precipitationProbability:null})
 ])
 const baseHours=mapHours(weather),baseDays=mapDays(weather),fusedDays=applyForecastFusionDays(baseDays,fusion),canonicalActive=Boolean(!forceFresh&&canonical&&sameForecastLocation(location,canonical.initialLocation)&&canonical.hours.length>0),ensembleDays=eventEnsemble.days??[],eventProbability=eventEnsemble.precipitationProbability??null
 let finalHours=canonicalActive?canonical!.hours:applyForecastFusionHours(baseHours,baseDays,fusedDays,fusion),now=Date.now(),startEpoch=localIsoEpoch(`${eventDate}T${eventStartTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0),endEpoch=localIsoEpoch(`${eventWindowEndDate(eventDate,eventStartTime,eventEndTime)}T${eventEndTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0)
 if(!Number.isFinite(startEpoch)||!Number.isFinite(endEpoch)||endEpoch<=startEpoch)throw new Error('Ungültiges Veranstaltungszeitfenster. Start und Ende müssen verschieden sein.')
 const nearNow=Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch>=now-30*60000&&startEpoch<=now+4*3600000
 let nowcastApplied=false,thunderApplied=false,weatherTwinApplied=Boolean(canonicalActive&&canonical?.weatherTwinApplied)
 if(!canonicalActive){
  const twinSettings=readWeatherTwinSettings(),locationKey=`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`,twinReport=twinSettings.enabled&&twinSettings.useAsMainForecast&&ensembleDays.length?buildForecastVerificationReport(locationKey,fusedDays,ensembleDays,location,baseHours):null,localTwinDays=twinReport?applyLocalTwinForecastFromReport(fusedDays,twinReport):fusedDays,twinEligible=Boolean(twinReport?.mainForecastStatus.eligible&&localTwinDays!==fusedDays),displayBaseDays=applyEnsembleDailyPrecipitationProbability(twinEligible?localTwinDays:fusedDays,ensembleDays)
  if(twinEligible){finalHours=applyLocalTwinHours(locationKey,finalHours,fusedDays,localTwinDays);weatherTwinApplied=true}
  const currentObservedEpoch=localIsoEpoch(String(weather.current?.time||''),weather.timezone,Number(weather.utc_offset_seconds)||0);let radar:Awaited<ReturnType<typeof radarNowcast>>=null,thunder:Awaited<ReturnType<typeof thunderstormNowcast>>=null,observedTemperature=Number(weather.current?.temperature_2m),observedAt=Number.isFinite(currentObservedEpoch)?currentObservedEpoch:now,localAnchor:ForecastLocalAnchor|undefined
  if(nearNow){
   const [radarResult,thunderResult,stationResult]=await Promise.allSettled([radarNowcast(location.latitude,location.longitude,country,signal,true),thunderstormNowcast(location.latitude,location.longitude,country,signal),station(location.latitude,location.longitude,country,location.elevation??weather.elevation,location,signal,true)])
   radar=radarResult.status==='fulfilled'?radarResult.value:null;thunder=thunderResult.status==='fulfilled'?thunderResult.value:null
   const observation=stationResult.status==='fulfilled'?stationResult.value:null,temperatureSource=observation?.fieldSources?.temperature?.[0],stamp=temperatureSource?.observedAt?Date.parse(temperatureSource.observedAt):observation?.timestamp?Date.parse(observation.timestamp):Number.NaN,fresh=stationFieldObservationUsable(observation,'temperature',now,location.elevation??weather.elevation)
   if(fresh&&Number.isFinite(stamp))observedAt=stamp;localAnchor=forecastLocalAnchorFromCurrent(observation,weather.current,now,location.elevation??weather.elevation)
  }
  const referenceHours=finalHours,finalized=finalizeForecastHours(finalHours,displayBaseDays,{radar,thunder,observedTemperature:localAnchor?.observed?.temperature?undefined:observedTemperature,observedAt,applyOperationalRadar:nearNow});finalHours=applyHyperlocalForecastHours(finalized.hours,localAnchor,now,referenceHours);nowcastApplied=finalized.radarApplied;thunderApplied=finalized.thunderApplied
 }
 const timeline=timelineForWindow(finalHours,eventDate,eventStartTime,eventEndTime,weather.timezone)
 if(!timeline.length)throw new Error('Für den gewählten Zeitraum sind noch keine Stundendaten verfügbar. Bitte Datum oder Uhrzeit anpassen.')
 const summary=summarizeTimeline(timeline,canonicalActive?canonical!.fusion:fusion,eventProbability,weatherTwinApplied)
 if(eventActivity==='flight'&&Number.isFinite(startEpoch)&&Number.isFinite(endEpoch))summary.flightHazards=await loadEventFlightHazards(location.latitude,location.longitude,location.elevation??weather.elevation??0,startEpoch,endEpoch,signal)
 summary.coverageComplete=summary.coverageComplete&&timeline.reduce((sum,point)=>sum+Number(point.durationMinutes||0),0)*60000>=endEpoch-startEpoch-60000;const advice=evaluateEvent(summary,eventEnvironment,eventActivity),fusionState=forecastFusionLabel(canonicalActive?canonical!.fusion:fusion),source=[canonicalActive?'Aktive Ortsvorhersage · identische MID-Endstufe':fusionState||'Open-Meteo Best Match · gemeinsame MID-Plausibilisierung',weatherTwinApplied?'Wetterzwilling · lokal validierte Temperatur-/Böenkorrektur':'',eventProbability?`Event-Niederschlagswahrscheinlichkeit ${eventStartTime}–${eventEndTime} · Ensemble-Member >0,2 mm`:`Ereigniswahrscheinlichkeit nicht verfügbar · Stundenwahrscheinlichkeiten sind keine Ereignisprognose`,nowcastApplied?'Radar-Nowcast':'',thunderApplied?'Konvektiv-/Gewitter-Nowcast':'',eventActivity==='flight'&&summary.flightHazards?.available?'Druckniveau-Flugwetterdiagnose':''].filter(Boolean).join(' · ')
 return{location,title:eventTitle.trim(),date:eventDate,startTime:eventStartTime,endTime:eventEndTime,environment:eventEnvironment,activity:eventActivity,timeline,summary,advice,modelInfo,refreshedAt:Date.now(),source}
}
