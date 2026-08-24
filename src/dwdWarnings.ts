export type DwdWarningLevel=1|2|3|4;
export type DwdWarningKind='wind'|'thunderstorm'|'heavyRain'|'continuousRain'|'snow'|'snowdrift'|'ice'|'frost'|'fog'|'heat';
export type DwdWarningSample={
 time?:string;
 epoch?:number;
 temperature?:number;
 apparent?:number;
 precipitation?:number;
 rain?:number;
 showers?:number;
 snowfall?:number;
 gust?:number;
 windDirection?:number;
 direction?:number;
 code?:number;
 visibility?:number;
 uvIndex?:number;
 isDay?:boolean;
};
export type DwdDisplayWindUnit='kn'|'kt'|'kmh'|'ms'|'mph';
export type DwdWarningSignal={kind:DwdWarningKind;level:DwdWarningLevel;title:string;symbol:string;detail:string;value:number;unit:string;windowHours?:number;secondaryValue?:number;secondaryUnit?:string;validFrom?:string;validTo?:string;windDirection?:number;windDirectionText?:string;stageRank?:number;thresholdValue?:number;lowerIntensity?:boolean};

export const DWD_WARNING_COLORS:Record<DwdWarningLevel,string>={1:'#e6c229',2:'#ef8d32',3:'#e74a4a',4:'#9b59c6'};
export const DWD_THERMAL_FEEL_COLORS={
 veryCold:'#67489b',
 cold:'#406db6',
 cool:'#4c96d7',
 slightlyCool:'#72b7e5',
 comfortable:'#48a96f',
 slightlyWarm:'#e7c744',
 warm:'#ef963b',
 hot:'#e34d4d',
 veryHot:'#9b59c6'
} as const;
export const DWD_WIND_THRESHOLDS_KMH=[
 {threshold:50,level:1 as const,label:'Windböen'},
 {threshold:65,level:2 as const,label:'Sturmböen'},
 {threshold:90,level:2 as const,label:'Schwere Sturmböen'},
 {threshold:105,level:3 as const,label:'Orkanartige Böen'},
 {threshold:120,level:3 as const,label:'Orkanböen'},
 {threshold:140,level:4 as const,label:'Extreme Orkanböen'}
];

const KMH_PER_KT=1.852;

const WIND_DIRECTION_ADJECTIVES=['nördlicher','nordöstlicher','östlicher','südöstlicher','südlicher','südwestlicher','westlicher','nordwestlicher'] as const;
function normaliseWindDirection(value:number){return((value%360)+360)%360}
function windDirectionAdjective(value:number){return WIND_DIRECTION_ADJECTIVES[Math.round(normaliseWindDirection(value)/45)%8]}
function circularMeanDirection(values:number[]){
 const finiteValues=values.filter(Number.isFinite).map(normaliseWindDirection);if(!finiteValues.length)return Number.NaN;
 const radians=finiteValues.map(value=>value*Math.PI/180),x=radians.reduce((sum,value)=>sum+Math.cos(value),0),y=radians.reduce((sum,value)=>sum+Math.sin(value),0);if(Math.abs(x)<1e-8&&Math.abs(y)<1e-8)return finiteValues[0];return normaliseWindDirection(Math.atan2(y,x)*180/Math.PI);
}
function directionDifference(a:number,b:number){const delta=Math.abs(normaliseWindDirection(a)-normaliseWindDirection(b));return Math.min(delta,360-delta)}
function warningWindDirectionText(occurrences:WarningOccurrence[]){
 const directions=occurrences.sort((a,b)=>a.start-b.start).map(item=>Number(item.signal.windDirection)).filter(Number.isFinite);if(!directions.length)return'';
 const groupSize=Math.max(1,Math.ceil(directions.length/3)),early=circularMeanDirection(directions.slice(0,groupSize)),late=circularMeanDirection(directions.slice(-groupSize)),overall=circularMeanDirection(directions);
 if(directions.length>=3&&Number.isFinite(early)&&Number.isFinite(late)&&directionDifference(early,late)>=67.5)return`Anfangs aus ${windDirectionAdjective(early)}, später aus ${windDirectionAdjective(late)} Richtung`;
 return Number.isFinite(overall)?`Aus ${windDirectionAdjective(overall)} Richtung`:'';
}
export function formatDwdWarningDirection(signal:DwdWarningSignal){if(signal.kind!=='wind'&&signal.kind!=='snowdrift')return'';if(signal.windDirectionText)return signal.windDirectionText;return Number.isFinite(signal.windDirection)?`Aus ${windDirectionAdjective(Number(signal.windDirection))} Richtung`:''}
export function formatDwdWarningDetailWithDirection(signal:DwdWarningSignal,unit:DwdDisplayWindUnit='kt'){
 const detail=formatDwdWarningDetail(signal,unit).trim().replace(/[.!?]+$/,'');
 const direction=formatDwdWarningDirection(signal).trim();if(!direction)return`${detail}.`;
 const inlineDirection=`${direction.charAt(0).toLocaleLowerCase('de-DE')}${direction.slice(1)}`;
 return direction.startsWith('Anfangs')?`${detail}; ${inlineDirection}.`:`${detail} ${inlineDirection}.`;
}

function rounded(value:number){return Math.round(value)}
export function beaufortFromKmh(kmh:number){const value=Math.max(0,finite(kmh));const limits=[1,6,12,20,29,39,50,62,75,89,103,118];const index=limits.findIndex(limit=>value<limit);return index<0?12:index}
export function formatDwdWindValue(kmh:number,unit:DwdDisplayWindUnit='kt'){
 const value=Math.max(0,finite(kmh)),primary=unit==='kmh'?`${rounded(value)} km/h`:unit==='ms'?`${rounded(value/3.6)} m/s`:unit==='mph'?`${rounded(value/1.609344)} mph`:`${rounded(value/KMH_PER_KT)} kt`;
 return unit==='kmh'?`${primary} (Bft ${beaufortFromKmh(value)})`:`${primary} (${rounded(value)} km/h)`;
}
export function formatDwdWarningCompactValue(signal:DwdWarningSignal,unit:DwdDisplayWindUnit='kt'){
 const windOnly=(kmh:number)=>{const value=Math.max(0,finite(kmh));return unit==='kmh'?`${rounded(value)} km/h`:unit==='ms'?`${rounded(value/3.6)} m/s`:unit==='mph'?`${rounded(value/1.609344)} mph`:`${rounded(value/KMH_PER_KT)} kt`};
 if(signal.kind==='wind'||signal.kind==='snowdrift')return windOnly(signal.value);
 if(signal.kind==='heavyRain'||signal.kind==='continuousRain')return`${rounded(signal.value)} mm`;
 if(signal.kind==='snow')return`${rounded(signal.value)} cm`;
 if(signal.kind==='fog')return`${Math.max(0,rounded(signal.value))} m`;
 if(signal.kind==='heat'||signal.kind==='frost'||signal.unit==='°C')return`${rounded(signal.value)} °C`;
 return'';
}
export function formatDwdWarningValue(signal:DwdWarningSignal,unit:DwdDisplayWindUnit='kt'){
 if(signal.kind==='wind')return formatDwdWindValue(signal.value,unit);
 if(signal.kind==='snowdrift'){const snow=Number.isFinite(signal.secondaryValue)?`${rounded(signal.secondaryValue!)} cm · `:'';return`${snow}${formatDwdWindValue(signal.value,unit)}`}
 if(signal.kind==='heavyRain'||signal.kind==='continuousRain')return`${rounded(signal.value)} mm${signal.windowHours?`/${signal.windowHours} h`:''}`;
 if(signal.kind==='snow')return`${rounded(signal.value)} cm${signal.windowHours?`/${signal.windowHours} h`:''}`;
 if(signal.kind==='fog')return`${Math.max(0,rounded(signal.value))} m`;
 if(signal.kind==='heat'||signal.kind==='frost'||signal.unit==='°C')return`${rounded(signal.value)} °C`;
 return'';
}
function withoutWarningStage(text:string){return text.replace(/\s*(?:[·(]\s*)?DWD-(?:Hitze)?Warnstufe\s*\d+\)?/gi,'').replace(/\s+([.,;:])/g,'$1').replace(/\.{2,}/g,'.').trim()}
export function formatDwdWarningDetail(signal:DwdWarningSignal,unit:DwdDisplayWindUnit='kt'){
 if(signal.kind==='wind'){if(signal.lowerIntensity&&Number.isFinite(signal.thresholdValue))return`${signal.title} über ${formatDwdWindValue(Number(signal.thresholdValue),unit)}; zeitweise bis ${formatDwdWindValue(signal.value,unit)}.`;return`${signal.title} bis ${formatDwdWindValue(signal.value,unit)}.`;}
 if(signal.kind==='snowdrift')return`${signal.title}: ${Number.isFinite(signal.secondaryValue)?`${rounded(signal.secondaryValue!)} cm Neuschnee und `:''}Böen bis ${formatDwdWindValue(signal.value,unit)}.`;
 if(signal.kind==='heavyRain'||signal.kind==='continuousRain')return`${signal.title}: ${rounded(signal.value)} mm in ${signal.windowHours??1} h.`;
 if(signal.kind==='snow')return`${signal.title}: ${rounded(signal.value)} cm Neuschnee in ${signal.windowHours??1} h.`;
 if(signal.kind==='fog')return`Sichtweite ${Math.max(0,rounded(signal.value))} m.`;
 if(signal.kind==='heat')return`Gefühlte Temperatur ${rounded(signal.value)} °C.`;
 if(signal.kind==='frost')return`${signal.title}: ${rounded(signal.value)} °C.`;
 if(signal.kind==='ice'&&signal.unit==='°C')return`Niederschlag bei ${rounded(signal.value)} °C: Glätte möglich.`;
 return withoutWarningStage(signal.detail.replace(/(-?\d+)[,.]\d+/g,'$1'));
}
function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function forwardValues(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const count=Math.max(1,Math.round(hours));return samples.slice(index,index+count).map(selector)}
function forwardSum(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector);return values.length>=hours?values.reduce((sum,value)=>sum+Math.max(0,finite(value)),0):Number.NaN}
function forwardMax(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector).filter(Number.isFinite);return values.length?Math.max(...values):Number.NaN}
function forwardMin(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector).filter(Number.isFinite);return values.length>=hours?Math.min(...values):Number.NaN}
function forwardAllBelow(samples:DwdWarningSample[],index:number,hours:number,threshold:number){const values=forwardValues(samples,index,hours,sample=>finite(sample.temperature,Number.NaN)).filter(Number.isFinite);return values.length>=hours&&values.every(value=>value<threshold)}
function liquidPrecipitation(sample:DwdWarningSample){const explicit=Math.max(0,finite(sample.rain))+Math.max(0,finite(sample.showers));if(explicit>0)return explicit;const code=finite(sample.code,-1);return[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,97,99].includes(code)?Math.max(0,finite(sample.precipitation)):0}
function snowfall(sample:DwdWarningSample){return Math.max(0,finite(sample.snowfall))}
function windThresholdExceeded(kmh:number,threshold:number){return threshold===50||threshold===140?kmh>threshold:kmh>=threshold}
function windClassifications(kmh:number){return DWD_WIND_THRESHOLDS_KMH.map((item,index)=>({...item,stageRank:index+1})).filter(item=>windThresholdExceeded(kmh,item.threshold))}
function thresholdStages(value:number,level2:number,level3:number,level4:number){
 const stages:{level:DwdWarningLevel;threshold:number}[]=[];if(!Number.isFinite(value))return stages;
 if(value>=level2)stages.push({level:2,threshold:level2});if(value>=level3)stages.push({level:3,threshold:level3});if(value>level4)stages.push({level:4,threshold:level4});return stages;
}
function rainTitle(kind:'heavyRain'|'continuousRain',level:DwdWarningLevel){if(kind==='heavyRain')return level===4?'Extrem heftiger Starkregen':level===3?'Heftiger Starkregen':'Starkregen';return level===4?'Extrem ergiebiger Dauerregen':level===3?'Ergiebiger Dauerregen':'Dauerregen'}
function rainWindowSignals(samples:DwdWarningSample[],index:number){
 const windows=[
  {hours:1,l2:15,l3:25,l4:40,kind:'heavyRain' as const},
  {hours:6,l2:20,l3:35,l4:60,kind:'heavyRain' as const},
  {hours:12,l2:25,l3:40,l4:70,kind:'continuousRain' as const},
  {hours:24,l2:30,l3:50,l4:80,kind:'continuousRain' as const},
  {hours:48,l2:40,l3:60,l4:90,kind:'continuousRain' as const},
  {hours:72,l2:60,l3:90,l4:120,kind:'continuousRain' as const}
 ];
 const best=new Map<string,DwdWarningSignal>();
 for(const window of windows){const total=forwardSum(samples,index,window.hours,liquidPrecipitation);for(const stage of thresholdStages(total,window.l2,window.l3,window.l4)){const title=rainTitle(window.kind,stage.level),candidate:DwdWarningSignal={kind:window.kind,level:stage.level,title,symbol:window.kind==='heavyRain'?'☔':'🌧',detail:`${title}: ${Math.round(total)} mm in ${window.hours} h.`,value:total,unit:'mm',windowHours:window.hours,stageRank:stage.level,thresholdValue:stage.threshold},key=`${window.kind}:${stage.level}`,previous=best.get(key);if(!previous||window.hours<(previous.windowHours??999)||window.hours===(previous.windowHours??999)&&candidate.value>previous.value)best.set(key,candidate)}}
 return[...best.values()].sort((a,b)=>(Number(a.stageRank)||a.level)-(Number(b.stageRank)||b.level));
}
function snowTitle(level:DwdWarningLevel){return level===4?'Extrem starker Schneefall':level===3?'Starker Schneefall':level===2?'Schneefall':'Leichter Schneefall'}
function snowWindowSignals(samples:DwdWarningSample[],index:number,elevation:number){
 const mountain=Number.isFinite(elevation)&&elevation>800;
 const windows=mountain?[
  {hours:6,l2:5,l3:20,l4:30},{hours:12,l2:10,l3:30,l4:50},{hours:24,l2:15,l3:40,l4:60},{hours:48,l2:20,l3:50,l4:70},{hours:72,l2:20,l3:50,l4:70}
 ]:[
  {hours:6,l2:5,l3:10,l4:20},{hours:12,l2:10,l3:15,l4:25},{hours:24,l2:15,l3:30,l4:40},{hours:48,l2:20,l3:40,l4:50},{hours:72,l2:20,l3:40,l4:50}
 ];
 const best=new Map<number,DwdWarningSignal>();
 for(const window of windows){const total=forwardSum(samples,index,window.hours,snowfall);if(!Number.isFinite(total)||total<.1)continue;const stages=[{level:1 as const,threshold:.1},...thresholdStages(total,window.l2,window.l3,window.l4)];for(const stage of stages){const title=snowTitle(stage.level),candidate:DwdWarningSignal={kind:'snow',level:stage.level,title,symbol:'❄',detail:`${Math.round(total)} cm Neuschnee in ${window.hours} h${mountain?' (Bergland)':''}.`,value:total,unit:'cm',windowHours:window.hours,stageRank:stage.level,thresholdValue:stage.threshold},previous=best.get(stage.level);if(!previous||window.hours<(previous.windowHours??999)||window.hours===(previous.windowHours??999)&&candidate.value>previous.value)best.set(stage.level,candidate)}}
 return[...best.values()].sort((a,b)=>a.level-b.level);
}
function snowdriftSignals(samples:DwdWarningSample[],index:number){
 const snow6=forwardSum(samples,index,6,snowfall),snow24=forwardSum(samples,index,24,snowfall),gust6=forwardMax(samples,index,6,sample=>finite(sample.gust)*KMH_PER_KT),signals:DwdWarningSignal[]=[];
 if(snow6>=5&&gust6>=39)signals.push({kind:'snowdrift',level:2,title:'Schneeverwehung',symbol:'🌬',detail:`${Math.round(snow6)} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h.`,value:gust6,unit:'km/h',windowHours:6,secondaryValue:snow6,secondaryUnit:'cm',stageRank:2});
 if(snow6>10&&gust6>=65)signals.push({kind:'snowdrift',level:3,title:'Starke Schneeverwehung',symbol:'🌬',detail:`Über ${Math.round(snow6)} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h.`,value:gust6,unit:'km/h',windowHours:6,secondaryValue:snow6,secondaryUnit:'cm',stageRank:3});
 if(snow24>25&&gust6>=65)signals.push({kind:'snowdrift',level:4,title:'Extrem starke Schneeverwehung',symbol:'🌬',detail:`Über ${Math.round(snow24)} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h.`,value:gust6,unit:'km/h',windowHours:24,secondaryValue:snow24,secondaryUnit:'cm',stageRank:4});
 return signals;
}
function iceSignals(sample:DwdWarningSample){
 const code=finite(sample.code,-1),temperature=finite(sample.temperature,Number.NaN),signals:DwdWarningSignal[]=[];
 if(code===67){signals.push({kind:'ice',level:1,title:'Glätte',symbol:'⚠️',detail:'Gefrierender Niederschlag: Glätte möglich.',value:code,unit:'WMO',stageRank:1},{kind:'ice',level:2,title:'Markante Glätte',symbol:'🧊',detail:'Gefrierender Regen: markante Glätte möglich.',value:code,unit:'WMO',stageRank:2},{kind:'ice',level:3,title:'Glatteis',symbol:'🧊',detail:'Starker gefrierender Regen: Glatteisbildung möglich.',value:code,unit:'WMO',stageRank:3});return signals}
 if([48,56,57,66].includes(code)){signals.push({kind:'ice',level:1,title:'Glätte',symbol:'⚠️',detail:'Gefrierender Niederschlag: Glätte möglich.',value:code,unit:'WMO',stageRank:1},{kind:'ice',level:2,title:'Markante Glätte',symbol:'🧊',detail:'Raueis, gefrierender Sprühregen oder leichter gefrierender Regen: markante Glätte möglich.',value:code,unit:'WMO',stageRank:2});return signals}
 const wet=liquidPrecipitation(sample)>0||snowfall(sample)>0;if(wet&&temperature<0)signals.push({kind:'ice',level:1,title:'Glätte',symbol:'⚠️',detail:'Niederschlag bei Lufttemperatur unter 0 °C: Glätte möglich.',value:temperature,unit:'°C',stageRank:1});return signals;
}
function thunderTitle(level:DwdWarningLevel){return level===4?'Extremes Gewitter':level===3?'Schweres Gewitter':level===2?'Starkes Gewitter':'Gewitter'}
function thunderSignals(sample:DwdWarningSample,wind:DwdWarningSignal|null,rain:DwdWarningSignal|null){
 const code=finite(sample.code,-1);if(![95,96,97,99].includes(code))return[] as DwdWarningSignal[];const convectiveRain=rain?.kind==='heavyRain'?rain:null;let highest:DwdWarningLevel=1;if(wind?.level===4||convectiveRain?.level===4)highest=4;else if(wind?.level===3||convectiveRain?.level===3||code===99)highest=3;else if(wind?.level===2||convectiveRain?.level===2||[96,97].includes(code))highest=2;const companions=[wind&&wind.level>=2?wind.title:'',convectiveRain?convectiveRain.title:'',code===96||code===99?'Hagel':''].filter(Boolean).join(', '),signals:DwdWarningSignal[]=[];
 for(let level=1;level<=highest;level++){const stage=level as DwdWarningLevel,title=thunderTitle(stage);signals.push({kind:'thunderstorm',level:stage,title,symbol:'⚡',detail:`${title}${companions?` mit ${companions}`:''}.`,value:code,unit:'WMO',stageRank:stage})}
 return signals;
}
function fogSignal(sample:DwdWarningSample){const visibility=finite(sample.visibility,Number.NaN);if(Number.isFinite(visibility)&&visibility<150)return{kind:'fog',level:1,title:'Nebel',symbol:'🌫',detail:`Sichtweite ${Math.max(0,Math.round(visibility))} m.`,value:visibility,unit:'m'} satisfies DwdWarningSignal;return null}
function heatSignal(samples:DwdWarningSample[],index:number){const sample=samples[index],apparent=finite(sample?.apparent,finite(sample?.temperature,Number.NaN));if(apparent>38)return{kind:'heat',level:3,title:'Extreme Wärmebelastung',symbol:'☀',detail:`Gefühlte Temperatur ${Math.round(apparent)} °C.`,value:apparent,unit:'°C'} satisfies DwdWarningSignal;const minimum=forwardMin(samples,index,12,value=>finite(value.temperature,Number.NaN));if(apparent>32&&Number.isFinite(minimum)&&minimum>=20)return{kind:'heat',level:1,title:'Starke Wärmebelastung',symbol:'☀',detail:`Gefühlte Temperatur ${Math.round(apparent)} °C bei nur geringer modellierter Abkühlung.`,value:apparent,unit:'°C'} satisfies DwdWarningSignal;return null}

export function dwdWarningSignalsAt(samples:DwdWarningSample[],index:number,elevation=0){
 const sample=samples[index];if(!sample)return[] as DwdWarningSignal[];
 const signals:DwdWarningSignal[]=[];
 const gustKmh=finite(sample.gust)*KMH_PER_KT,rawWindDirection=Number.isFinite(Number(sample.windDirection))?Number(sample.windDirection):Number.isFinite(Number(sample.direction))?Number(sample.direction):Number.NaN,windDirection=Number.isFinite(rawWindDirection)?normaliseWindDirection(rawWindDirection):undefined,windClasses=windClassifications(gustKmh),windSignals=windClasses.map(windClass=>({kind:'wind',level:windClass.level,title:windClass.label,symbol:'💨',detail:`${windClass.label} bis ${Math.round(gustKmh)} km/h.`,value:gustKmh,unit:'km/h',windDirection,stageRank:windClass.stageRank,thresholdValue:windClass.threshold} satisfies DwdWarningSignal)),wind=windSignals.at(-1)??null;
 const rainSignals=rainWindowSignals(samples,index),rain=rainSignals.at(-1)??null,snowSignals=snowWindowSignals(samples,index,elevation),driftSignals=snowdriftSignals(samples,index),iceRows=iceSignals(sample),fog=fogSignal(sample),heat=heatSignal(samples,index);
 signals.push(...windSignals,...rainSignals,...snowSignals,...driftSignals,...iceRows);if(fog)signals.push(fog);if(heat)signals.push(heat);
 signals.push(...thunderSignals(sample,wind,rain));
 const lowland=!Number.isFinite(elevation)||elevation<=800;
 if(lowland&&finite(sample.temperature,Number.NaN)<0){const temperature=finite(sample.temperature,Number.NaN);signals.push({kind:'frost',level:1,title:'Frost',symbol:'❄️',detail:`Lufttemperatur ${Math.round(temperature)} °C in einer Lage bis 800 m.`,value:temperature,unit:'°C',stageRank:1})}
 if(lowland&&forwardAllBelow(samples,index,3,-10)){const minimum=Math.min(...forwardValues(samples,index,3,value=>finite(value.temperature,Number.NaN)).filter(Number.isFinite));signals.push({kind:'frost',level:2,title:'Strenger Frost',symbol:'🥶',detail:`Mindestens 3 Stunden unter −10 °C, Tiefstwert ${Math.round(minimum)} °C.`,value:minimum,unit:'°C',windowHours:3,stageRank:2})}
 return signals.sort((a,b)=>b.level-a.level||a.kind.localeCompare(b.kind));
}

type WarningOccurrence={signal:DwdWarningSignal;index:number;start:number;end:number};
type WarningInterval={start:number;end:number;members:WarningOccurrence[]};
function warningSampleEpoch(sample:DwdWarningSample){const raw=Number(sample.epoch);if(Number.isFinite(raw))return raw<1e12?raw*1000:raw;const parsed=Date.parse(String(sample.time??''));return Number.isFinite(parsed)?parsed:Number.NaN}
function warningOccurrence(signal:DwdWarningSignal,index:number,sample:DwdWarningSample):WarningOccurrence{const start=warningSampleEpoch(sample),durationHours=Math.max(1,Math.round(Number(signal.windowHours)||1));return{signal,index,start,end:Number.isFinite(start)?start+durationHours*3600000:Number.NaN}}
function warningIntervals(occurrences:WarningOccurrence[]){
 const timed=occurrences.filter(item=>Number.isFinite(item.start)&&Number.isFinite(item.end)).sort((a,b)=>a.start-b.start);const merged:WarningInterval[]=[];
 for(const item of timed){const current=merged.at(-1);if(current&&item.start<=current.end+5*60000){current.end=Math.max(current.end,item.end);current.members.push(item)}else merged.push({start:item.start,end:item.end,members:[item]})}
 return merged;
}
function warningValidity(occurrences:WarningOccurrence[],selected:WarningOccurrence){
 const merged=warningIntervals(occurrences);if(!merged.length||!Number.isFinite(selected.start))return{};
 const interval=merged.find(item=>item.members.includes(selected))??merged.find(item=>selected.start>=item.start&&selected.start<=item.end);return interval?{validFrom:new Date(interval.start).toISOString(),validTo:new Date(interval.end).toISOString(),windDirectionText:selected.signal.kind==='wind'?warningWindDirectionText(interval.members):undefined}:{};
}
function warningStageKey(signal:DwdWarningSignal){return`${signal.kind}:${signal.stageRank??signal.level}:${signal.title}`}
function warningSignalStrength(signal:DwdWarningSignal){const value=Number(signal.value);if(signal.kind==='frost'||signal.kind==='fog')return Number.isFinite(value)?-value:Number.NEGATIVE_INFINITY;return Number.isFinite(value)?value:Number.NEGATIVE_INFINITY}
function warningStrength(occurrence:WarningOccurrence){return warningSignalStrength(occurrence.signal)}
function strongestWarningOccurrence(items:WarningOccurrence[]){return items.reduce((best,item)=>!best||warningStrength(item)>warningStrength(best)?item:best,items[0])}
function warningIntervalsOverlap(a:DwdWarningSignal,b:DwdWarningSignal){const aStart=Date.parse(String(a.validFrom??'')),aEnd=Date.parse(String(a.validTo??'')),bStart=Date.parse(String(b.validFrom??'')),bEnd=Date.parse(String(b.validTo??''));return Number.isFinite(aStart)&&Number.isFinite(aEnd)&&Number.isFinite(bStart)&&Number.isFinite(bEnd)&&aStart<bEnd&&bStart<aEnd}
function warningStageRank(signal:DwdWarningSignal){return Number(signal.stageRank)||signal.level}
function roundedComparable(value:number|undefined){return Number.isFinite(Number(value))?Math.round(Number(value)):null}
function warningContentMatches(a:DwdWarningSignal,b:DwdWarningSignal){
 return warningStageKey(a)===warningStageKey(b)&&a.unit===b.unit&&(a.windowHours??null)===(b.windowHours??null)&&(a.secondaryUnit??null)===(b.secondaryUnit??null)&&roundedComparable(a.value)===roundedComparable(b.value)&&roundedComparable(a.secondaryValue)===roundedComparable(b.secondaryValue)&&(a.windDirectionText??'')===(b.windDirectionText??'');
}
function higherWarningCoversGap(all:DwdWarningSignal[],signal:DwdWarningSignal,gapStart:number,gapEnd:number){
 if(!Number.isFinite(gapStart)||!Number.isFinite(gapEnd)||gapEnd<=gapStart)return false;
 const intervals=all.filter(other=>other!==signal&&other.kind===signal.kind&&warningStageRank(other)>warningStageRank(signal)).map(other=>({start:Date.parse(String(other.validFrom??'')),end:Date.parse(String(other.validTo??''))})).filter(item=>Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.end>gapStart&&item.start<gapEnd).sort((a,b)=>a.start-b.start);
 let cursor=gapStart;
 for(const interval of intervals){if(interval.start>cursor+5*60000)return false;cursor=Math.max(cursor,interval.end);if(cursor>=gapEnd-5*60000)return true}
 return false;
}
function mergeInterruptedLowerWarnings(signals:DwdWarningSignal[]){
 const merged:DwdWarningSignal[]=[],groups=new Map<string,DwdWarningSignal[]>();
 for(const signal of signals){const key=warningStageKey(signal),rows=groups.get(key)??[];rows.push(signal);groups.set(key,rows)}
 for(const rows of groups.values()){
  const sorted=[...rows].sort((a,b)=>Date.parse(String(a.validFrom??''))-Date.parse(String(b.validFrom??'')));let current:DwdWarningSignal|undefined;
  for(const signal of sorted){
   if(!current){current={...signal};continue}
   const currentEnd=Date.parse(String(current.validTo??'')),nextStart=Date.parse(String(signal.validFrom??''));
   if(warningContentMatches(current,signal)&&Number.isFinite(currentEnd)&&Number.isFinite(nextStart)&&nextStart>=currentEnd&&higherWarningCoversGap(signals,current,currentEnd,nextStart)){current={...current,validTo:signal.validTo};continue}
   merged.push(current);current={...signal};
  }
  if(current)merged.push(current);
 }
 return merged;
}
export function summarizeDwdWarnings(samples:DwdWarningSample[],elevation=0,startLimit=samples.length){
 const occurrences=new Map<string,WarningOccurrence[]>(),limit=Math.min(samples.length,Math.max(0,startLimit));
 for(let index=0;index<limit;index++)for(const signal of dwdWarningSignalsAt(samples,index,elevation)){const occurrence=warningOccurrence(signal,index,samples[index]),key=warningStageKey(signal),rows=occurrences.get(key)??[];rows.push(occurrence);occurrences.set(key,rows)}
 const summarized:DwdWarningSignal[]=[];
 for(const rows of occurrences.values()){const intervals=warningIntervals(rows),untimed=rows.filter(item=>!Number.isFinite(item.start)||!Number.isFinite(item.end));for(const interval of intervals){const selected=strongestWarningOccurrence(interval.members);summarized.push({...selected.signal,...warningValidity(interval.members,selected)})}if(untimed.length)summarized.push({...strongestWarningOccurrence(untimed).signal})}
 const consolidated=mergeInterruptedLowerWarnings(summarized);
 for(const signal of consolidated){signal.lowerIntensity=consolidated.some(other=>other!==signal&&other.kind===signal.kind&&warningIntervalsOverlap(signal,other)&&warningStageRank(other)>warningStageRank(signal))}
 return consolidated.sort((a,b)=>b.level-a.level||warningStageRank(b)-warningStageRank(a)||warningSignalStrength(b)-warningSignalStrength(a)||Date.parse(String(a.validFrom??''))-Date.parse(String(b.validFrom??''))||a.kind.localeCompare(b.kind));
}

/**
 * Tagesbezogene Zusammenfassung mit vollständigem Vorwärtsfenster.
 * Die ersten `dayCount` Stunden gehören zum angezeigten Kalendertag; weitere
 * Stunden werden ausschließlich für 12-/24-/48-/72-h-Schwellen und die
 * nächtliche Abkühlung herangezogen. Dadurch bleibt der angezeigte Warnwert
 * beim Tagesmaximum (z. B. maximale gefühlte Temperatur) und wird nicht auf
 * einen früheren, technisch noch vollständig auswertbaren Stundenwert gekürzt.
 */
function dailyWarningHasMatchingPrecipitation(signal:DwdWarningSignal,daySamples:DwdWarningSample[]){
 if(signal.kind!=='heavyRain'&&signal.kind!=='continuousRain')return true;
 const liquid=daySamples.map(liquidPrecipitation),total=liquid.reduce((sum,value)=>sum+value,0),wetHours=liquid.filter(value=>value>=.05).length;
 if(total<.05||wetHours===0)return false;
 if(signal.kind==='continuousRain'&&total<1&&wetHours<2)return false;
 return true;
}
export function summarizeDwdWarningsForDay(samples:DwdWarningSample[],date:string,elevation=0){
 const start=samples.findIndex(sample=>String(sample.time||'').startsWith(date));
 if(start<0)return[] as DwdWarningSignal[];
 let dayCount=0;
 while(start+dayCount<samples.length&&String(samples[start+dayCount]?.time||'').startsWith(date))dayCount++;
 if(!dayCount)return[] as DwdWarningSignal[];
 const extended=samples.slice(start,start+dayCount+72),daySamples=extended.slice(0,dayCount);
 return summarizeDwdWarnings(extended,elevation,dayCount).filter(signal=>dailyWarningHasMatchingPrecipitation(signal,daySamples));
}
