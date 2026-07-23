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
 code?:number;
 visibility?:number;
 uvIndex?:number;
 isDay?:boolean;
};
export type DwdWarningSignal={kind:DwdWarningKind;level:DwdWarningLevel;title:string;symbol:string;detail:string;value:number;unit:string;windowHours?:number};

export const DWD_WARNING_COLORS:Record<DwdWarningLevel,string>={1:'#e6c229',2:'#ef8d32',3:'#e74a4a',4:'#9b59c6'};
export const DWD_WIND_THRESHOLDS_KMH=[
 {threshold:50,level:1 as const,label:'Windböen'},
 {threshold:65,level:2 as const,label:'Sturmböen'},
 {threshold:90,level:2 as const,label:'Schwere Sturmböen'},
 {threshold:105,level:3 as const,label:'Orkanartige Böen'},
 {threshold:120,level:3 as const,label:'Orkanböen'},
 {threshold:140,level:4 as const,label:'Extreme Orkanböen'}
];

const KMH_PER_KT=1.852;
function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function forwardValues(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const count=Math.max(1,Math.round(hours));return samples.slice(index,index+count).map(selector)}
function forwardSum(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector);return values.length>=hours?values.reduce((sum,value)=>sum+Math.max(0,finite(value)),0):Number.NaN}
function forwardMax(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector).filter(Number.isFinite);return values.length?Math.max(...values):Number.NaN}
function forwardMin(samples:DwdWarningSample[],index:number,hours:number,selector:(sample:DwdWarningSample)=>number){const values=forwardValues(samples,index,hours,selector).filter(Number.isFinite);return values.length>=hours?Math.min(...values):Number.NaN}
function forwardAllBelow(samples:DwdWarningSample[],index:number,hours:number,threshold:number){const values=forwardValues(samples,index,hours,sample=>finite(sample.temperature,Number.NaN)).filter(Number.isFinite);return values.length>=hours&&values.every(value=>value<threshold)}
function liquidPrecipitation(sample:DwdWarningSample){const explicit=Math.max(0,finite(sample.rain))+Math.max(0,finite(sample.showers));if(explicit>0)return explicit;const code=finite(sample.code,-1);return[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,97,99].includes(code)?Math.max(0,finite(sample.precipitation)):0}
function snowfall(sample:DwdWarningSample){return Math.max(0,finite(sample.snowfall))}
function levelFromThresholds(value:number,level2:number,level3:number,level4:number){if(!Number.isFinite(value))return null;if(value>level4)return 4 as const;if(value>=level3)return 3 as const;if(value>=level2)return 2 as const;return null}
function windClassification(kmh:number){if(kmh>140)return{level:4 as const,label:'Extreme Orkanböen'};if(kmh>=120)return{level:3 as const,label:'Orkanböen'};if(kmh>=105)return{level:3 as const,label:'Orkanartige Böen'};if(kmh>=90)return{level:2 as const,label:'Schwere Sturmböen'};if(kmh>=65)return{level:2 as const,label:'Sturmböen'};if(kmh>50)return{level:1 as const,label:'Windböen'};return null}
function rainWindowSignal(samples:DwdWarningSample[],index:number){
 const windows=[
  {hours:1,l2:15,l3:25,l4:40,kind:'heavyRain' as const,title:'Starkregen'},
  {hours:6,l2:20,l3:35,l4:60,kind:'heavyRain' as const,title:'Starkregen'},
  {hours:12,l2:25,l3:40,l4:70,kind:'continuousRain' as const,title:'Dauerregen'},
  {hours:24,l2:30,l3:50,l4:80,kind:'continuousRain' as const,title:'Dauerregen'},
  {hours:48,l2:40,l3:60,l4:90,kind:'continuousRain' as const,title:'Dauerregen'},
  {hours:72,l2:60,l3:90,l4:120,kind:'continuousRain' as const,title:'Dauerregen'}
 ];
 let best:DwdWarningSignal|null=null;
 for(const window of windows){const total=forwardSum(samples,index,window.hours,liquidPrecipitation),level=levelFromThresholds(total,window.l2,window.l3,window.l4);if(!level)continue;const candidate:DwdWarningSignal={kind:window.kind,level,title:window.title,symbol:window.kind==='heavyRain'?'☔':'🌧',detail:`${window.title}: ${total.toFixed(1).replace('.',',')} mm in ${window.hours} h (DWD-Warnstufe ${level}).`,value:total,unit:'mm',windowHours:window.hours};if(!best||candidate.level>best.level||candidate.level===best.level&&window.hours<(best.windowHours??999))best=candidate}
 return best;
}
function snowWindowSignal(samples:DwdWarningSample[],index:number,elevation:number){
 const mountain=Number.isFinite(elevation)&&elevation>800;
 const windows=mountain?[
  {hours:6,l2:5,l3:20,l4:30},{hours:12,l2:10,l3:30,l4:50},{hours:24,l2:15,l3:40,l4:60},{hours:48,l2:20,l3:50,l4:70},{hours:72,l2:20,l3:50,l4:70}
 ]:[
  {hours:6,l2:5,l3:10,l4:20},{hours:12,l2:10,l3:15,l4:25},{hours:24,l2:15,l3:30,l4:40},{hours:48,l2:20,l3:40,l4:50},{hours:72,l2:20,l3:40,l4:50}
 ];
 let best:DwdWarningSignal|null=null;
 for(const window of windows){const total=forwardSum(samples,index,window.hours,snowfall);if(!Number.isFinite(total)||total<.1)continue;const level=levelFromThresholds(total,window.l2,window.l3,window.l4)??1;const candidate:DwdWarningSignal={kind:'snow',level,title:level===4?'Extrem starker Schneefall':level===3?'Starker Schneefall':level===2?'Schneefall':'Leichter Schneefall',symbol:'❄',detail:`${total.toFixed(1).replace('.',',')} cm Neuschnee in ${window.hours} h${mountain?' (Bergland)':''} · DWD-Warnstufe ${level}.`,value:total,unit:'cm',windowHours:window.hours};if(!best||candidate.level>best.level||candidate.level===best.level&&window.hours<(best.windowHours??999))best=candidate}
 return best;
}
function snowdriftSignal(samples:DwdWarningSample[],index:number){const snow6=forwardSum(samples,index,6,snowfall),snow24=forwardSum(samples,index,24,snowfall),gust6=forwardMax(samples,index,6,sample=>finite(sample.gust)*KMH_PER_KT);if(snow24>25&&gust6>=65)return{kind:'snowdrift',level:4,title:'Extrem starke Schneeverwehung',symbol:'🌬',detail:`Über ${snow24.toFixed(1).replace('.',',')} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h · DWD-Warnstufe 4.`,value:gust6,unit:'km/h',windowHours:24} satisfies DwdWarningSignal;if(snow6>10&&gust6>=65)return{kind:'snowdrift',level:3,title:'Starke Schneeverwehung',symbol:'🌬',detail:`Über ${snow6.toFixed(1).replace('.',',')} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h · DWD-Warnstufe 3.`,value:gust6,unit:'km/h',windowHours:6} satisfies DwdWarningSignal;if(snow6>=5&&gust6>=39)return{kind:'snowdrift',level:2,title:'Schneeverwehung',symbol:'🌬',detail:`${snow6.toFixed(1).replace('.',',')} cm Neuschnee und Böen bis ${Math.round(gust6)} km/h · DWD-Warnstufe 2.`,value:gust6,unit:'km/h',windowHours:6} satisfies DwdWarningSignal;return null}
function iceSignal(sample:DwdWarningSample){const code=finite(sample.code,-1),temperature=finite(sample.temperature,Number.NaN);if(code===67)return{kind:'ice',level:3,title:'Glatteis',symbol:'🧊',detail:'Starker gefrierender Regen: Glatteisbildung möglich (DWD-Warnstufe 3).',value:code,unit:'WMO'} satisfies DwdWarningSignal;if([48,56,57,66].includes(code))return{kind:'ice',level:2,title:'Markante Glätte',symbol:'🧊',detail:'Raueis, gefrierender Sprühregen oder leichter gefrierender Regen: markante Glätte möglich (DWD-Warnstufe 2).',value:code,unit:'WMO'} satisfies DwdWarningSignal;const wet=liquidPrecipitation(sample)>0||snowfall(sample)>0;if(wet&&temperature<0)return{kind:'ice',level:1,title:'Glätte',symbol:'⚠️',detail:'Niederschlag bei Lufttemperatur unter 0 °C: Glätte möglich (DWD-Warnstufe 1).',value:temperature,unit:'°C'} satisfies DwdWarningSignal;return null}
function thunderSignal(sample:DwdWarningSample,wind:DwdWarningSignal|null,rain:DwdWarningSignal|null){const code=finite(sample.code,-1);if(![95,96,97,99].includes(code))return null;const convectiveRain=rain?.kind==='heavyRain'?rain:null;let level:DwdWarningLevel=1;if(wind?.level===4||convectiveRain?.level===4)level=4;else if(wind?.level===3||convectiveRain?.level===3||code===99)level=3;else if(wind?.level===2||convectiveRain?.level===2||[96,97].includes(code))level=2;const companions=[wind&&wind.level>=2?wind.title:'',convectiveRain?convectiveRain.title:'',code===96||code===99?'Hagel':''].filter(Boolean).join(', ');return{kind:'thunderstorm',level,title:level===4?'Extremes Gewitter':level===3?'Schweres Gewitter':level===2?'Starkes Gewitter':'Gewitter',symbol:'⚡',detail:`${level===4?'Extremes':level===3?'Schweres':level===2?'Starkes':'Einfaches'} Gewitter${companions?` mit ${companions}`:''} · DWD-Warnstufe ${level}.`,value:code,unit:'WMO'} satisfies DwdWarningSignal}
function fogSignal(sample:DwdWarningSample){const visibility=finite(sample.visibility,Number.NaN);if(Number.isFinite(visibility)&&visibility<150)return{kind:'fog',level:1,title:'Nebel',symbol:'🌫',detail:`Sichtweite ${Math.max(0,Math.round(visibility))} m · DWD-Warnstufe 1.`,value:visibility,unit:'m'} satisfies DwdWarningSignal;return null}
function heatSignal(samples:DwdWarningSample[],index:number){const sample=samples[index],apparent=finite(sample?.apparent,finite(sample?.temperature,Number.NaN));if(apparent>38)return{kind:'heat',level:3,title:'Extreme Wärmebelastung',symbol:'☀',detail:`Gefühlte Temperatur ${apparent.toFixed(1).replace('.',',')} °C (DWD-Hitzewarnstufe 3).`,value:apparent,unit:'°C'} satisfies DwdWarningSignal;const minimum=forwardMin(samples,index,12,value=>finite(value.temperature,Number.NaN));if(apparent>32&&Number.isFinite(minimum)&&minimum>=20)return{kind:'heat',level:1,title:'Starke Wärmebelastung',symbol:'☀',detail:`Gefühlte Temperatur ${apparent.toFixed(1).replace('.',',')} °C bei nur geringer modellierter Abkühlung (DWD-Hitzewarnstufe 1).`,value:apparent,unit:'°C'} satisfies DwdWarningSignal;return null}

export function dwdWarningSignalsAt(samples:DwdWarningSample[],index:number,elevation=0){
 const sample=samples[index];if(!sample)return[] as DwdWarningSignal[];
 const signals:DwdWarningSignal[]=[];
 const gustKmh=finite(sample.gust)*KMH_PER_KT,windClass=windClassification(gustKmh),wind=windClass?{kind:'wind',level:windClass.level,title:windClass.label,symbol:'💨',detail:`${windClass.label} bis ${Math.round(gustKmh)} km/h (DWD-Warnstufe ${windClass.level}).`,value:gustKmh,unit:'km/h'} satisfies DwdWarningSignal:null;
 const rain=rainWindowSignal(samples,index),snow=snowWindowSignal(samples,index,elevation),drift=snowdriftSignal(samples,index),ice=iceSignal(sample),fog=fogSignal(sample),heat=heatSignal(samples,index);
 if(wind)signals.push(wind);if(rain)signals.push(rain);if(snow)signals.push(snow);if(drift)signals.push(drift);if(ice)signals.push(ice);if(fog)signals.push(fog);if(heat)signals.push(heat);
 const thunder=thunderSignal(sample,wind,rain);if(thunder)signals.push(thunder);
 const lowland=!Number.isFinite(elevation)||elevation<=800;
 if(lowland&&forwardAllBelow(samples,index,3,-10)){const minimum=Math.min(...forwardValues(samples,index,3,value=>finite(value.temperature,Number.NaN)).filter(Number.isFinite));signals.push({kind:'frost',level:2,title:'Strenger Frost',symbol:'🥶',detail:`Mindestens 3 Stunden unter −10 °C, Tiefstwert ${minimum.toFixed(1).replace('.',',')} °C (DWD-Warnstufe 2).`,value:minimum,unit:'°C'})}
 else if(lowland&&finite(sample.temperature,Number.NaN)<0){const temperature=finite(sample.temperature,Number.NaN);signals.push({kind:'frost',level:1,title:'Frost',symbol:'❄️',detail:`Lufttemperatur ${temperature.toFixed(1).replace('.',',')} °C in einer Lage bis 800 m · DWD-Warnstufe 1.`,value:temperature,unit:'°C'})}
 return signals.sort((a,b)=>b.level-a.level||a.kind.localeCompare(b.kind));
}

export function summarizeDwdWarnings(samples:DwdWarningSample[],elevation=0,startLimit=samples.length){const byKind=new Map<DwdWarningKind,DwdWarningSignal>();for(let index=0;index<Math.min(samples.length,Math.max(0,startLimit));index++){for(const signal of dwdWarningSignalsAt(samples,index,elevation)){const previous=byKind.get(signal.kind);if(!previous||signal.level>previous.level||signal.level===previous.level&&signal.value>previous.value)byKind.set(signal.kind,signal)}}return[...byKind.values()].sort((a,b)=>b.level-a.level||a.kind.localeCompare(b.kind))}
