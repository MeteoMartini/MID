import type {Hour,RadarNowcast,Station,ThunderstormNowcast} from './weather';

export type ThunderInfoLevel='yellow'|'orange'|'red'|'purple';
export type ThunderInfoDetail={label:string;value:string};
export type ThunderInfo={level:ThunderInfoLevel;headline:string;summary:string;source:string;details?:ThunderInfoDetail[]};

const SEVERITY_LABELS=['schwach','moderat','stark','extrem'] as const;
function severityLevel(severity:number,hailFlag:number,heavyRainFlag:number):ThunderInfoLevel{const score=Math.max(Number(severity)||0,Number(hailFlag)||0,Number(heavyRainFlag)||0);return score>=3?'purple':score>=2?'red':score>=1?'orange':'yellow'}
function severityText(value:number){return SEVERITY_LABELS[Math.max(0,Math.min(3,Math.round(Number(value)||0)))]}
function trendText(value:number){return value>=2?'schnell anwachsend':value===1?'anwachsend':value<=-2?'schnell abschwächend':value===-1?'abschwächend':'stabil'}
function compassWord(value:number|undefined){if(!Number.isFinite(Number(value)))return'';const labels=['nördlich','nordöstlich','östlich','südöstlich','südlich','südwestlich','westlich','nordwestlich'];return labels[Math.round((((Number(value)%360)+360)%360)/45)%8]}
function compassShort(value:number|undefined){if(!Number.isFinite(Number(value)))return'–';const labels=['N','NO','O','SO','S','SW','W','NW'];return`${Math.round(Number(value))}° ${labels[Math.round((((Number(value)%360)+360)%360)/45)%8]}`}
function decimal(value:number|undefined,digits=1){return Number.isFinite(Number(value))?new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(Number(value)):'–'}
function zulu(value?:string){if(!value)return'–';const date=new Date(value);return Number.isFinite(date.getTime())?`${date.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'})} ${date.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})}Z`:'–'}
function coordinate(lat:number|undefined,lon:number|undefined){return Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))?`${decimal(lat,3)}° N · ${decimal(lon,3)}° E`:'–'}
function flagText(value:number|undefined,none='kein Signal'){const number=Number(value);return Number.isFinite(number)&&number>0?`Stufe ${Math.round(number)}`:none}
function cellDetailsShort(cell:NonNullable<ThunderstormNowcast['nearest']>){const details=[`KONRAD3D ${severityText(cell.severity)}`,trendText(cell.trend)];if(cell.lightningRate>0)details.push(`${Math.round(cell.lightningRate)} Blitze/5 min`);if(cell.hailFlag>0||cell.areaHail>0)details.push(cell.hailFlag>=2||cell.areaLargeHail>0?'Großhagelsignal':'Hagelsignal');if(cell.heavyRainFlag>0)details.push(`Starkregenstufe ${cell.heavyRainFlag}`);if((cell.gustFlag??0)>0)details.push(`Böenstufe ${cell.gustFlag}`);return details.join(' · ')}
function stationRainText(station:Station|null){const rain=Number(station?.precipitation);if(!Number.isFinite(rain)||rain<.1)return'';return `${station?.provider?.includes('DWD')?'DWD-Station':'Station'} bestätigt Niederschlag`}

export function combineThunderstormInformation(nowcast:ThunderstormNowcast|null,hours:Hour[],radar:RadarNowcast|null,station:Station|null,locationName='Standort'):ThunderInfo|null{
 const cell=nowcast?.nearest;
 if(nowcast?.available&&cell&&cell.relevanceDistanceKm<=80){
  const currentDistanceRaw=Number(cell.currentDistanceKm),currentDistance=Number.isFinite(currentDistanceRaw)?Math.max(0,currentDistanceRaw):Number.NaN,forecastDistance=Number(cell.forecastDistanceKm),effectiveDistance=Number(cell.forecastEffectiveDistanceKm),uncertainty=Number(cell.forecastUncertaintyKm),arrival=Number(cell.arrivalMinutes),nearNow=Number.isFinite(currentDistance)&&currentDistance<=25,atSite=Number.isFinite(currentDistance)&&currentDistance<1,approaching=Boolean(!nearNow&&cell.isApproaching&&Number.isFinite(arrival)&&arrival>0&&arrival<=90),direction=compassWord(cell.siteBearingDeg),headline=atSite?'Gewitterzelle unmittelbar am Standort':nearNow?'Gewitterzelle nahe':approaching?'Gewitterzelle nähert sich':'Gewitterzelle im Umfeld';
  const positionText=atSite?`Aktuell unmittelbar bei ${locationName}`:Number.isFinite(currentDistance)?`Aktuell ${Math.max(1,Math.round(currentDistance))} km${direction?` ${direction}`:''} von ${locationName}`:`Aktuelle Entfernung zu ${locationName} nicht belastbar verfügbar`;
  const approachText=approaching&&Number.isFinite(forecastDistance)?`; größte berechnete Annäherung in etwa ${Math.round(arrival)} min auf ca. ${Math.max(0,Math.round(forecastDistance))} km`:approaching?`; mögliche Annäherung in etwa ${Math.round(arrival)} min`:'';
  const summary=`${positionText}${approachText}. ${cellDetailsShort(cell)}.`;
  const details:ThunderInfoDetail[]=[
   {label:'Bezugsort',value:locationName},
   {label:'Zellkennung',value:cell.id},
   {label:'Aktuelle Zellposition',value:coordinate(cell.latitude,cell.longitude)},
   {label:'Aktuelle Entfernung / Richtung',value:atSite?`unter 1 km · ${compassShort(cell.siteBearingDeg)}`:Number.isFinite(currentDistance)?`${decimal(currentDistance)} km · ${compassShort(cell.siteBearingDeg)}`:'–'},
   {label:'Zellstufe / Trend',value:`${severityText(cell.severity)} · ${trendText(cell.trend)}`},
   {label:'Zellverlagerung',value:Number.isFinite(Number(cell.motionDirectionDeg))||cell.speedKmh>0?`nach ${compassShort(cell.motionDirectionDeg)} · ${Math.round(cell.speedKmh||0)} km/h`:'nicht belastbar verfügbar'},
   {label:'Prognostizierte Position',value:coordinate(cell.forecastLatitude,cell.forecastLongitude)},
   {label:'Prognosezeit',value:zulu(cell.forecastTime)},
   {label:'Abstand der prognostizierten Position',value:Number.isFinite(forecastDistance)?`${decimal(forecastDistance)} km`:'–'},
   {label:'Wirksamer Mindestabstand',value:Number.isFinite(effectiveDistance)?`${decimal(effectiveDistance)} km${Number.isFinite(uncertainty)?` · Unsicherheitsradius ${decimal(uncertainty)} km`:''}`:'–'},
   {label:'Blitzaktivität',value:cell.lightningRate>0?`${Math.round(cell.lightningRate)} Blitze je 5 min`:'kein Blitzsignal im Zellobjekt'},
   {label:'Hagel',value:`${flagText(cell.hailFlag)}${cell.areaHail>0?` · Hagelfläche ${decimal(cell.areaHail)} km²`:''}${cell.areaLargeHail>0?` · Großhagelfläche ${decimal(cell.areaLargeHail)} km²`:''}`},
   {label:'Starkregen',value:flagText(cell.heavyRainFlag)},
   {label:'Böen',value:flagText(cell.gustFlag)},
   {label:'Datenstand',value:`${zulu(nowcast.observedAt)}${Number.isFinite(Number(nowcast.ageMinutes))?` · ${Math.max(0,Math.round(Number(nowcast.ageMinutes)))} min alt`:''}`},
   {label:'Erkannte Zellen',value:`${nowcast.cellsFound} insgesamt · ${nowcast.nearbyCells.length} im 80-km-Umfeld`}
  ];
  return{level:severityLevel(cell.severity,cell.hailFlag,cell.heavyRainFlag),headline,summary,source:`DWD KONRAD3D · 5-minütig${Number.isFinite(Number(nowcast.ageMinutes))?` · ${Math.max(0,Math.round(Number(nowcast.ageMinutes)))} min alt`:''} · keine amtliche Warnung`,details};
 }
 const now=Date.now(),next=hours.filter(hour=>hour.epoch>=now-30*60000&&hour.epoch<=now+3*3600000),thunder=next.find(hour=>[95,96,97,98,99].includes(Math.round(hour.code))),highCape=Math.max(0,...next.map(hour=>Number(hour.cape)||0)),radarRate=Number(radar?.currentRate||0),stationRain=stationRainText(station),combinedConvectiveSignal=radarRate>=8&&highCape>=750;
 if(!thunder&&!combinedConvectiveSignal)return null;
 const severe=Boolean(thunder&&[96,97,98,99].includes(Math.round(thunder.code)))||highCape>=1800||radarRate>=25,extra=[thunder?'Best Match signalisiert Gewitter':'starkes Radarecho mit erhöhter Konvektionsenergie',radarRate>=8?`Radarecho ${Math.round(radarRate)} mm/h`:'',highCape>=750?`CAPE ${Math.round(highCape)} J/kg`:'',stationRain].filter(Boolean).join(' · ');return{level:severe?'orange':'yellow',headline:'Gewittersignal',summary:`In den kommenden drei Stunden bei ${locationName}: ${extra}.`,source:'Modell-, Radar- und Stationsabgleich · keine amtliche Warnung',details:[{label:'Bezugsort',value:locationName},{label:'Radarintensität',value:radarRate>=.05?`${decimal(radarRate)} mm/h`:'kein Standortecho'},{label:'Konvektionsenergie',value:highCape>0?`${Math.round(highCape)} J/kg`:'nicht verfügbar'},{label:'KONRAD3D',value:nowcast?.summary||'keine relevante aktuelle Zelle'}]};
}
