import {useId,type CSSProperties} from 'react';
import {label} from './weather';

export type WeatherPictogramKind=
 'clear'|'mostly-clear'|'partly-cloudy'|'cloudy'|'mist'|'fog'|'rime-fog'|'haze'|
 'drizzle'|'freezing-drizzle'|'rain'|'freezing-rain'|'showers'|'sleet'|'sleet-showers'|'snow'|'snow-grains'|'snow-showers'|
 'ice-crystals'|'ice-pellets'|'graupel'|'hail'|'thunder'|'thunder-hail'|'squall'|'funnel-cloud';
export type WeatherPictogramIntensity='none'|'light'|'moderate'|'heavy';
export type CloudLayerKind='none'|'low'|'mid'|'high'|'layered'|'convective'|'unspecified';
export type CloudFormKind='clear'|'stratus'|'altostratus'|'cirrus'|'cumulus'|'cumulonimbus'|'layered'|'generic';

export type WeatherPictogramCloudProfile={
 cloud?:number;
 lowCloud?:number;
 midCloud?:number;
 highCloud?:number;
};

export type SynopticPhenomenonCode=
 'DZ'|'FZDZ'|'RA'|'FZRA'|'SHRA'|'SN'|'SG'|'SHSN'|'RASN'|'SHRASN'|'IC'|'PL'|'GS'|'GR'|
 'TS'|'TSRA'|'TSSN'|'TSGR'|'TSGS'|'BR'|'FG'|'FZFG'|'HZ'|'FU'|'DU'|'SA'|'SQ'|'FC';

export type WeatherPictogramSpec={kind:WeatherPictogramKind;intensity:WeatherPictogramIntensity;phenomenon?:string};

type Props=WeatherPictogramCloudProfile&{
 code:number;
 day?:boolean;
 size?:number|string;
 className?:string;
 title?:string;
 x?:number;
 y?:number;
 style?:CSSProperties;
 compact?:boolean;
 plain?:boolean;
 /** Optional WMO/ICAO present-weather bridge, e.g. -DZ, +RA, SHSN, FZRA, SG or TSGR. */
 phenomenon?:SynopticPhenomenonCode|string;
 /** Explicit intensity is primarily for decoded SYNOP/BUFR/METAR observations. */
 intensity?:WeatherPictogramIntensity;
};

function finiteCloud(value:unknown){const number=Number(value);return Number.isFinite(number)?Math.max(0,Math.min(100,number)):undefined}
function normalizedPhenomenon(value:unknown){return String(value||'').trim().toUpperCase().replace(/\s+/g,'')}

export function weatherPictogramIntensity(code:number):WeatherPictogramIntensity{
 const c=Math.round(Number(code));
 if([51,56,61,66,68,71,80,83,85].includes(c))return'light';
 if([53,63,69,73,77,81,84,95,96].includes(c))return'moderate';
 if([55,57,65,67,75,82,86,97,99].includes(c))return'heavy';
 return'none';
}

export function weatherPictogramKind(code:number):WeatherPictogramKind{
 const c=Math.round(Number(code));
 if(c===0)return'clear';
 if(c===1)return'mostly-clear';
 if(c===2)return'partly-cloudy';
 if(c===3)return'cloudy';
 if(c===45)return'fog';
 if(c===48)return'rime-fog';
 if([51,53,55].includes(c))return'drizzle';
 if([56,57].includes(c))return'freezing-drizzle';
 if([61,63,65].includes(c))return'rain';
 if([66,67].includes(c))return'freezing-rain';
 if([68,69].includes(c))return'sleet';
 if([83,84].includes(c))return'sleet-showers';
 if([71,73,75].includes(c))return'snow';
 if(c===77)return'snow-grains';
 if([80,81,82].includes(c))return'showers';
 if([85,86].includes(c))return'snow-showers';
 if([96,99].includes(c))return'thunder-hail';
 if([95,97,98].includes(c))return'thunder';
 return'partly-cloudy';
}

/**
 * WMO/ICAO present-weather bridge. This follows the same phenomenon vocabulary
 * used by SYNOP/BUFR and aerodrome present-weather tables. The leading -/+ is
 * interpreted as intensity; no prefix means moderate.
 */
export function synopticPhenomenonPictogram(value:string):WeatherPictogramSpec|null{
 const raw=normalizedPhenomenon(value);if(!raw)return null;
 const prefixed=raw.startsWith('-')||raw.startsWith('+'),intensity:WeatherPictogramIntensity=raw.startsWith('-')?'light':raw.startsWith('+')?'heavy':'moderate',code=prefixed?raw.slice(1):raw;
 const has=(token:string)=>code.includes(token);
 let kind:WeatherPictogramKind|null=null;
 if(has('FC'))kind='funnel-cloud';
 else if(has('SQ'))kind='squall';
 else if(has('TS')&&(has('GR')||has('GS')))kind='thunder-hail';
 else if(has('TS'))kind='thunder';
 else if(has('FZFG'))kind='rime-fog';
 else if(has('FG'))kind='fog';
 else if(has('BR'))kind='mist';
 else if(has('HZ')||has('FU')||has('DU')||has('SA'))kind='haze';
 else if(has('FZDZ'))kind='freezing-drizzle';
 else if(has('FZRA'))kind='freezing-rain';
 else if(has('SH')&&((has('RA')&&has('SN'))||(has('DZ')&&has('SN'))))kind='sleet-showers';
 else if(has('SH')&&has('SN'))kind='snow-showers';
 else if(has('SH')&&has('RA'))kind='showers';
 else if((has('RA')&&has('SN'))||(has('DZ')&&has('SN')))kind='sleet';
 else if(has('DZ'))kind='drizzle';
 else if(has('RA'))kind='rain';
 else if(has('SG'))kind='snow-grains';
 else if(has('SN'))kind='snow';
 else if(has('IC'))kind='ice-crystals';
 else if(has('PL'))kind='ice-pellets';
 else if(has('GS'))kind='graupel';
 else if(has('GR'))kind='hail';
 return kind?{kind,intensity:kind==='mist'||kind==='fog'||kind==='rime-fog'||kind==='haze'||kind==='squall'||kind==='funnel-cloud'?'none':intensity,phenomenon:raw}:null;
}

export function weatherPictogramSpec(code:number,phenomenon?:string,intensity?:WeatherPictogramIntensity):WeatherPictogramSpec{
 const synoptic=phenomenon?synopticPhenomenonPictogram(phenomenon):null;
 if(synoptic)return{...synoptic,intensity:intensity??synoptic.intensity};
 return{kind:weatherPictogramKind(code),intensity:intensity??weatherPictogramIntensity(code)};
}

export function cloudLayerKind(code:number,profile:WeatherPictogramCloudProfile={},overrideKind?:WeatherPictogramKind):CloudLayerKind{
 const weatherKind=overrideKind??weatherPictogramKind(code);
 if(weatherKind==='clear')return'none';
 if(['thunder','thunder-hail','showers','sleet-showers','snow-showers','squall','funnel-cloud'].includes(weatherKind))return'convective';
 const low=finiteCloud(profile.lowCloud),mid=finiteCloud(profile.midCloud),high=finiteCloud(profile.highCloud),total=finiteCloud(profile.cloud);
 const layers=[['low',low],['mid',mid],['high',high]] as const,available=layers.filter((entry):entry is readonly['low'|'mid'|'high',number]=>entry[1]!==undefined).sort((a,b)=>b[1]-a[1]);
 if(available.length){
  const substantial=available.filter(([,value])=>value>=38);
  if(substantial.length>=2&&substantial[1][1]>=substantial[0][1]-22)return'layered';
  const [dominant,dominantValue]=available[0],runnerUp=available[1]?.[1]??0;
  if(dominantValue>=28&&(dominantValue-runnerUp>=10||dominantValue>=68))return dominant;
  if(substantial.length>=2)return'layered';
 }
 if(total!==undefined&&total>=75&&low!==undefined&&low>=50)return'low';
 if(['mist','fog','rime-fog','drizzle','freezing-drizzle'].includes(weatherKind))return'low';
 if(['rain','freezing-rain','sleet','snow','snow-grains','ice-crystals','ice-pellets','graupel','hail'].includes(weatherKind))return mid!==undefined&&mid>=55&&(!low||mid>low+12)?'mid':'layered';
 return'unspecified';
}

export function cloudLayerDescription(kind:CloudLayerKind){
 if(kind==='low')return'tiefe Wolken dominant';
 if(kind==='mid')return'mittelhohe Wolken dominant';
 if(kind==='high')return'hohe Wolken dominant';
 if(kind==='layered')return'mehrschichtige Bewölkung';
 if(kind==='convective')return'quellende konvektive Bewölkung';
 return'';
}

export function cloudFormKind(code:number,profile:WeatherPictogramCloudProfile={},overrideKind?:WeatherPictogramKind):CloudFormKind{
 const weatherKind=overrideKind??weatherPictogramKind(code),layer=cloudLayerKind(code,profile,weatherKind),low=finiteCloud(profile.lowCloud),total=finiteCloud(profile.cloud);
 if(weatherKind==='clear')return'clear';
 if(['thunder','thunder-hail','showers','sleet-showers','snow-showers','squall','funnel-cloud'].includes(weatherKind)||layer==='convective')return'cumulonimbus';
 if(['mist','fog','rime-fog','drizzle','freezing-drizzle'].includes(weatherKind))return'stratus';
 if(layer==='high')return'cirrus';
 if(layer==='mid')return'altostratus';
 if(layer==='layered')return'layered';
 if(layer==='low'){
  if(weatherKind==='cloudy'||['rain','freezing-rain','sleet','snow','snow-grains','ice-crystals','ice-pellets','graupel','hail'].includes(weatherKind)||(low??0)>=76||(total??0)>=84)return'stratus';
  return'cumulus';
 }
 if(weatherKind==='cloudy')return'stratus';
 if(['mostly-clear','partly-cloudy'].includes(weatherKind))return'cumulus';
 if(['rain','freezing-rain','sleet','snow','snow-grains','ice-crystals','ice-pellets','graupel','hail'].includes(weatherKind))return'layered';
 return'generic';
}

export function cloudFormDescription(kind:CloudFormKind){
 if(kind==='stratus')return'tiefe Schichtbewölkung oder Hochnebel';
 if(kind==='altostratus')return'mittelhohe Schichtbewölkung';
 if(kind==='cirrus')return'hohe faserige Bewölkung';
 if(kind==='cumulus')return'quellige Haufenbewölkung';
 if(kind==='cumulonimbus')return'hochreichende konvektive Bewölkung';
 if(kind==='layered')return'mehrschichtige Bewölkung';
 return'';
}

function intensityDescription(value:WeatherPictogramIntensity){return value==='light'?'leicht':value==='moderate'?'mäßig':value==='heavy'?'stark':''}
function SkyPlate({day,kind,form}:{day:boolean;kind:WeatherPictogramKind;form:CloudFormKind}){
 const night=!day,stormy=['thunder','thunder-hail','squall','funnel-cloud'].includes(kind)||form==='cumulonimbus',foggy=['mist','fog','rime-fog','haze'].includes(kind)||form==='stratus';
 const dayFill=stormy?'var(--wx-icon-day-storm-plate)':foggy?'var(--wx-icon-day-fog-plate)':'var(--wx-icon-day-plate)',nightFill=stormy?'var(--wx-icon-night-storm-plate)':foggy?'var(--wx-icon-night-fog-plate)':'var(--wx-icon-night-plate)',fill=night?nightFill:dayFill,stroke=night?'var(--wx-icon-night-plate-stroke)':'var(--wx-icon-day-plate-stroke)';
 return <g className={`mid-weather-skyplate ${day?'day':'night'}`}><rect x="2.5" y="2.5" width="63" height="63" rx="12" fill={fill} stroke={stroke} strokeWidth="1.15"/><path d="M5 49c14-4 27-5 39-2 7 1.7 13 2 19 .5v14H5Z" fill={night?'var(--wx-icon-night-horizon)':'var(--wx-icon-day-horizon)'}/></g>;
}

function Sun({gradient}:{gradient:string}){return <g className="mid-weather-sun"><g stroke="var(--wx-icon-sun-ray)" strokeWidth="2.6" strokeLinecap="round"><path d="M20 5v5"/><path d="M20 30v5"/><path d="M5 20h5"/><path d="M30 20h5"/><path d="m9.4 9.4 3.5 3.5"/><path d="m27.1 27.1 3.5 3.5"/><path d="m30.6 9.4-3.5 3.5"/><path d="m12.9 27.1-3.5 3.5"/></g><circle cx="20" cy="20" r="8.3" fill={`url(#${gradient})`} stroke="var(--wx-icon-sun-edge)" strokeWidth="1.2"/></g>}
function Moon({gradient}:{gradient:string}){return <g className="mid-weather-moon"><path d="M29.5 8.5c-7.2 1.2-12.1 8-10.8 15.1 1.3 7.1 8.2 11.7 15.4 10.1-3.7 3.4-9.1 4.8-14.2 3.2C11.8 34.4 7.3 25.8 9.8 17.7 12.4 9.7 21 5.2 29.1 7.7l.4.8Z" fill={`url(#${gradient})`} stroke="var(--wx-icon-moon-edge)" strokeWidth="1.35"/><path d="M26.8 10.5c-5.5 1.8-9.2 7.6-8 13.3 1.1 5.7 6.7 9.7 12.4 9.1" fill="none" stroke="var(--wx-icon-moon-highlight)" strokeWidth="1.1" strokeLinecap="round"/><g fill="var(--wx-icon-star)"><circle cx="39" cy="11" r="1.15"/><circle cx="46" cy="17" r=".95"/><circle cx="42" cy="25" r=".8"/></g></g>}
function LowCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <path className="mid-weather-cloud mid-weather-cloud-low" d="M14.5 45.8h35c6.2 0 10.9-4.2 10.9-9.7 0-5.2-4.1-9.2-9.5-9.7-1.9-7-8-11.5-15.2-11.5-8 0-14.6 5.5-16.1 13-6.4.2-11.3 4-11.3 9.3 0 4.8 3.1 8.6 6.2 8.6Z" fill={`url(#${gradient})`} stroke={dark?'var(--wx-icon-storm-stroke)':'var(--wx-icon-cloud-stroke)'} strokeWidth="1.35"/>}
function StratusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-stratus"><path d="M8.5 36.5c1-3.7 4.4-6.1 8.7-6.1 2.3-3.2 6.7-5.2 11.4-5.2 4.8 0 8.8 1.9 11.4 5 4.2-.2 7.6 1.6 9.4 4.5 6.2-.3 10.6 3.1 10.6 7.7 0 4.7-4.1 8-10 8H18.7c-6.2 0-10.6-3.2-10.6-7.9 0-2.4.1-4.2.4-6Z" fill={`url(#${gradient})`} stroke={dark?'var(--wx-icon-storm-stroke)':'var(--wx-icon-cloud-stroke)'} strokeWidth="1.35"/><path d="M12 52h42M18 56.5h31" stroke="var(--wx-icon-cloud-layer)" strokeWidth="1.9" strokeLinecap="round" opacity=".8"/></g>}
function CumulusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-cumulus"><path d="M14 47.5h36c6 0 10.4-3.8 10.4-8.7 0-4.8-3.8-8.5-8.9-8.9-1.3-5.9-6.4-10-12.5-10-5.4 0-10 3-12 7.5-1.7-1.1-3.8-1.7-6-1.7-6.6 0-11.6 4.4-11.6 10.1 0 6.2 4.1 11.7 4.6 11.7Z" fill={`url(#${gradient})`} stroke={dark?'var(--wx-icon-storm-stroke)':'var(--wx-icon-cloud-stroke)'} strokeWidth="1.35"/><path d="M23 29.5c2-4.4 5.5-6.9 9.6-6.9 4.3 0 7.7 2.4 9.7 6.8" fill="none" stroke="var(--wx-icon-cloud-highlight)" strokeWidth="1.7" strokeLinecap="round"/></g>}
function AltostratusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-altostratus"><path d="M8.5 34.5c5.5-5.4 12.5-7.4 20.6-5.3 6.9-3.9 14.5-3.5 20.9 1.2 6.6.2 11 3.5 11 8.4 0 5.4-4.9 9.2-11.7 9.2H18.6C12 48 7 44.4 7 39.3c0-1.7.5-3.3 1.5-4.8Z" fill={`url(#${gradient})`} stroke={dark?'var(--wx-icon-storm-stroke)':'var(--wx-icon-cloud-stroke)'} strokeWidth="1.25" opacity=".96"/><path d="M11 51h45M16 55h34" stroke="var(--wx-icon-cloud-layer)" strokeWidth="1.7" strokeLinecap="round" opacity=".78"/></g>}
function MidCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <AltostratusCloud gradient={gradient} dark={dark}/>}
function HighCloud(){return <g className="mid-weather-cloud mid-weather-cloud-high" fill="none" strokeLinecap="round"><path d="M9 29c9-8.8 17.5-9.1 24.8-3.6 7 5 14.8 4.5 25.4-5.8" stroke="var(--wx-icon-cirrus-1)" strokeWidth="4.2"/><path d="M13 38c11-6.8 21-5.9 30.5-1.2 5.2 2.5 10.2 2.1 15.8-1.2" stroke="var(--wx-icon-cirrus-2)" strokeWidth="3"/><path d="M23 47c8.5-4.8 17-5 26.5-.8" stroke="var(--wx-icon-cirrus-3)" strokeWidth="2.5"/><path d="M19 20.5c4.6-2.9 9.6-3.1 13.8-.6" stroke="var(--wx-icon-cloud-highlight)" strokeWidth="1.8"/></g>}
function LayeredCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-layered"><g opacity=".82" transform="translate(0 -5)"><HighCloud/></g><g transform="translate(2 9) scale(.95)"><AltostratusCloud gradient={gradient} dark={dark}/></g></g>}
function CumulonimbusCloud({gradient}:{gradient:string}){return <g className="mid-weather-cloud mid-weather-cloud-cumulonimbus"><path d="M10 22c4.2-4.1 8.8-6.1 13.9-6 1.9-6 6.8-10 12.6-10 6.2 0 11.2 4.5 12.6 11 5.1.2 9.4 2.2 12.8 6.1-3.3 2.4-7.2 3.5-11.8 3.5 5.2 1.6 8.6 5.6 8.6 10.6 0 6-4.9 10.6-11.6 10.6H18c-6.8 0-11.7-4.5-11.7-10.5 0-4.7 2.8-8.6 7.3-10.4-2.1-1-3.3-2.6-3.6-4.9Z" fill={`url(#${gradient})`} stroke="var(--wx-icon-storm-stroke)" strokeWidth="1.55"/><path d="M17 20h36" stroke="var(--wx-icon-storm-highlight)" strokeWidth="2" strokeLinecap="round"/><path d="M24 31c2.7-7.1 6.8-11 12.2-11 5.2 0 9.2 3.7 11.7 10.4" fill="none" stroke="var(--wx-icon-storm-highlight)" strokeWidth="1.8" strokeLinecap="round"/></g>}
function ConvectiveCloud({gradient}:{gradient:string}){return <CumulonimbusCloud gradient={gradient}/>}
function CloudShape({form,gradient,stormGradient,dark=false}:{form:CloudFormKind;gradient:string;stormGradient:string;dark?:boolean}){const fill=dark?stormGradient:gradient;if(form==='cirrus')return <HighCloud/>;if(form==='altostratus')return <MidCloud gradient={fill} dark={dark}/>;if(form==='layered')return <LayeredCloud gradient={fill} dark={dark}/>;if(form==='cumulonimbus')return <ConvectiveCloud gradient={stormGradient}/>;if(form==='cumulus')return <CumulusCloud gradient={fill} dark={dark}/>;if(form==='stratus')return <StratusCloud gradient={fill} dark={dark}/>;return <LowCloud gradient={fill} dark={dark}/>}

function MistLines({fog=false,rime=false,haze=false}:{fog?:boolean;rime?:boolean;haze?:boolean}){
 if(haze)return <g className="mid-weather-haze" fill="none" stroke="var(--wx-icon-fog)" strokeWidth="2.6" strokeLinecap="round"><path d="M9 48c8-5 15-5 23 0s15 5 24 0"/><path d="M10 55c8-5 15-5 23 0s15 5 24 0" opacity=".82"/><path d="M16 61c6-3.4 12-3.4 18 0s12 3.4 18 0" opacity=".62"/></g>;
 return <g className="mid-weather-fog-lines" fill="none" strokeLinecap="round"><path d="M10 49h35" stroke="var(--wx-icon-fog)" strokeWidth={fog?3.2:2.4}/><path d="M19 55h35" stroke="var(--wx-icon-fog-soft)" strokeWidth={fog?3.2:2.4}/>{fog?<path d="M8 61h29" stroke="var(--wx-icon-fog-pale)" strokeWidth="2.8"/>:null}{rime&&<g stroke="var(--wx-icon-ice)" strokeWidth="1.8"><path d="M50 46v12"/><path d="m45.5 49 9 6"/><path d="m54.5 49-9 6"/></g>}</g>;
}

function precipitationLayout(intensity:WeatherPictogramIntensity){
 if(intensity==='light')return{xs:[27,41],stroke:2.25,length:5,opacity:.82};
 if(intensity==='heavy')return{xs:[17,29,41,53],stroke:3.45,length:9,opacity:1};
 return{xs:[21,34,47],stroke:2.9,length:7,opacity:1};
}
function Rain({intensity='moderate',drizzle=false}:{intensity?:WeatherPictogramIntensity;drizzle?:boolean}){
 const layout=precipitationLayout(intensity),xs=drizzle?(intensity==='heavy'?[20,30,40,50]:intensity==='light'?[29,41]:[24,34,44]):layout.xs;
 if(drizzle)return <g className={`mid-weather-drizzle intensity-${intensity}`} fill="var(--wx-icon-rain)" opacity={layout.opacity}>{xs.map((x,index)=><circle key={x} cx={x} cy={51+(index%2)*4} r={intensity==='heavy'?1.65:intensity==='light'?1.15:1.4}/>)}</g>;
 return <g className={`mid-weather-rain intensity-${intensity}`} fill="none" stroke="var(--wx-icon-rain)" strokeWidth={layout.stroke} strokeLinecap="round" opacity={layout.opacity}>{xs.map((x,index)=><path key={x} d={`M${x} ${48+(index%2)}l-${Math.max(2,Math.round(layout.length*.42))} ${layout.length}`}/>)}</g>;
}
function Snow({grains=false,intensity='moderate'}:{grains?:boolean;intensity?:WeatherPictogramIntensity}){
 const xs=intensity==='heavy'?[17,29,41,53]:intensity==='light'?[27,42]:[21,34,47];
 return <g className={`mid-weather-snow intensity-${intensity}`} stroke="var(--wx-icon-snow)" strokeWidth={intensity==='heavy'?2:1.75} strokeLinecap="round">{xs.map((x,index)=>grains?<circle key={x} cx={x} cy={51+index%2*4} r={intensity==='heavy'?2.5:intensity==='light'?1.7:2.05} fill="var(--wx-icon-snow-grain)" stroke="var(--wx-icon-snow)" strokeWidth=".8"/>:<g key={x} transform={`translate(${x} ${51+index%2*4}) scale(${intensity==='light'?.84:intensity==='heavy'?1.08:1})`}><path d="M-4 0h8M0-4v8M-3-3l6 6M3-3l-6 6"/></g>)}</g>;
}
function IceCrystal({x=51,y=51,large=false}:{x?:number;y?:number;large?:boolean}){return <g className="mid-weather-ice" transform={`translate(${x} ${y}) scale(${large?1.18:1})`} stroke="var(--wx-icon-ice)" strokeWidth="1.6" strokeLinecap="round"><path d="M-5 0h10M0-5v10M-3.5-3.5l7 7M3.5-3.5l-7 7"/></g>}
function IcePellets({intensity='moderate'}:{intensity?:WeatherPictogramIntensity}){const xs=intensity==='heavy'?[18,30,42,54]:intensity==='light'?[28,42]:[22,35,48];return <g className={`mid-weather-ice-pellets intensity-${intensity}`} fill="none" stroke="var(--wx-icon-ice)" strokeWidth="1.55">{xs.map((x,index)=><polygon key={x} points={`${x},${48+index%2*4} ${x+3},${50+index%2*4} ${x+2},${54+index%2*4} ${x-2},${54+index%2*4} ${x-3},${50+index%2*4}`} strokeLinejoin="round"/>)}</g>}
function Graupel({intensity='moderate'}:{intensity?:WeatherPictogramIntensity}){const xs=intensity==='heavy'?[18,29,41,53]:intensity==='light'?[28,42]:[22,35,48];return <g className={`mid-weather-graupel intensity-${intensity}`} fill="var(--wx-icon-graupel)" stroke="var(--wx-icon-ice)" strokeWidth=".8">{xs.map((x,index)=><circle key={x} cx={x} cy={51+index%2*4} r={intensity==='heavy'?2.7:2.25}/>)}</g>}
function Hail({intensity='moderate'}:{intensity?:WeatherPictogramIntensity}){const xs=intensity==='heavy'?[17,29,41,53]:intensity==='light'?[28,43]:[21,35,49];return <g className={`mid-weather-hail intensity-${intensity}`} fill="var(--wx-icon-hail)" stroke="var(--wx-icon-hail-edge)" strokeWidth="1">{xs.map((x,index)=><circle key={x} cx={x} cy={51+index%2*4} r={intensity==='heavy'?3.1:intensity==='light'?2.2:2.65}/>)}</g>}
function Lightning({heavy=false}:{heavy?:boolean}){return <g className="mid-weather-lightning"><path d="M34 42h10l-6 8h7L31 63l4-10h-7l6-11Z" fill="var(--wx-icon-lightning)" stroke="var(--wx-icon-lightning-edge)" strokeWidth="1.1" strokeLinejoin="round"/>{heavy?<path d="M49 43h7l-4 6h5l-10 9 3-7h-5l4-8Z" fill="var(--wx-icon-lightning)" stroke="var(--wx-icon-lightning-edge)" strokeWidth=".8" strokeLinejoin="round" opacity=".86"/>:null}</g>}
function WindGlyph({squall=false}:{squall?:boolean}){return <g className="mid-weather-wind-glyph" fill="none" stroke="var(--wx-icon-wind)" strokeLinecap="round"><path d="M9 43h28c7 0 8-8 2-9-3-.5-5 1-6 3" strokeWidth={squall?3.4:2.8}/><path d="M14 51h38c7 0 8 8 2 9-3 .5-5-1-6-3" strokeWidth={squall?3.4:2.8}/><path d="M8 58h25" strokeWidth="2.4" opacity=".75"/></g>}
function Funnel(){return <g className="mid-weather-funnel" fill="none" stroke="var(--wx-icon-funnel)" strokeLinecap="round"><path d="M24 46c14 0 25 0 31-4" strokeWidth="3.6"/><path d="M28 51c10 0 18-1 23-4" strokeWidth="3.2"/><path d="M33 56c7 0 12-1 15-3" strokeWidth="2.7"/><path d="M39 60c3 0 5-.5 6-1.5" strokeWidth="2.2"/></g>}

function weatherKindDescription(kind:WeatherPictogramKind){
 const names:Record<WeatherPictogramKind,string>={clear:'klar', 'mostly-clear':'überwiegend klar','partly-cloudy':'teilweise bewölkt',cloudy:'bedeckt',mist:'Dunst',fog:'Nebel','rime-fog':'Reifnebel',haze:'trockener Dunst',drizzle:'Sprühregen','freezing-drizzle':'gefrierender Sprühregen',rain:'Regen','freezing-rain':'gefrierender Regen',showers:'Regenschauer',sleet:'Schneeregen','sleet-showers':'Schneeregenschauer',snow:'Schnee','snow-grains':'Schneegriesel','snow-showers':'Schneeschauer','ice-crystals':'Eiskristalle','ice-pellets':'Eiskörner',graupel:'Graupel',hail:'Hagel',thunder:'Gewitter','thunder-hail':'Gewitter mit Hagel',squall:'Böenlinie', 'funnel-cloud':'Trichterwolke'};
 return names[kind];
}

export function WeatherPictogram({code,day=true,size='1em',className='',title,x,y,style,cloud,lowCloud,midCloud,highCloud,compact=false,plain=false,phenomenon,intensity}:Props){
 const profile={cloud,lowCloud,midCloud,highCloud},rawId=useId().replace(/[^a-zA-Z0-9_-]/g,''),spec=weatherPictogramSpec(code,phenomenon,intensity),kind=spec.kind,precipIntensity=spec.intensity,layer=cloudLayerKind(code,profile,kind),form=cloudFormKind(code,profile,kind),layerText=cloudLayerDescription(layer),formText=cloudFormDescription(form),intensityText=precipIntensity!=='none'&&['drizzle','freezing-drizzle','rain','freezing-rain','showers','sleet','sleet-showers','snow','snow-grains','snow-showers','ice-crystals','ice-pellets','graupel','hail','thunder','thunder-hail'].includes(kind)?intensityDescription(precipIntensity):'',baseDescription=title||phenomenon?title||`${intensityText?`${intensityText} `:''}${weatherKindDescription(kind)}`:label(code),details=[intensityText,layerText,formText].filter(Boolean).filter((item,index,array)=>array.indexOf(item)===index),description=details.reduce((current,item)=>current.toLocaleLowerCase('de-DE').includes(item.toLocaleLowerCase('de-DE'))?current:`${current} · ${item}`,baseDescription),sunGradient=`mid-sun-${rawId}`,moonGradient=`mid-moon-${rawId}`,cloudGradient=`mid-cloud-${rawId}`,nightCloudGradient=`mid-cloud-night-${rawId}`,stormGradient=`mid-storm-${rawId}`,nightStormGradient=`mid-storm-night-${rawId}`,shadow=`mid-shadow-${rawId}`;
 const celestial=day?<Sun gradient={sunGradient}/>:<Moon gradient={moonGradient}/>;
 const showCelestial=['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers'].includes(kind),showVeiledCelestial=['cloudy','drizzle','freezing-drizzle','rain','freezing-rain','sleet','snow','snow-grains','ice-crystals','ice-pellets','graupel','hail'].includes(kind),showFogCelestial=['mist','fog','rime-fog','haze'].includes(kind);
 const darkCloud=['thunder','thunder-hail','squall','funnel-cloud'].includes(kind),cloudFillGradient=day?cloudGradient:nightCloudGradient,stormFillGradient=day?stormGradient:nightStormGradient;
 const precipitationCloud=['drizzle','freezing-drizzle','rain','freezing-rain','showers','sleet','sleet-showers','snow','snow-grains','snow-showers','ice-crystals','ice-pellets','graupel','hail','mist','fog','rime-fog','thunder','thunder-hail','squall','funnel-cloud'].includes(kind);
 return <svg className={`mid-weather-pictogram weather-${kind} intensity-${precipIntensity} cloud-layer-${layer} cloud-form-${form}${compact?' compact':''} ${className}`.trim()} x={x} y={y} width={size} height={size} viewBox="0 0 68 68" role="img" aria-label={description} style={style} preserveAspectRatio="xMidYMid meet" data-cloud-layer={layer} data-cloud-form={form} data-day-part={day?'day':'night'} data-weather-kind={kind} data-intensity={precipIntensity} data-phenomenon={spec.phenomenon||undefined}>
  <title>{description}</title>
  <defs>
   <radialGradient id={sunGradient} cx="38%" cy="35%"><stop offset="0" stopColor="var(--wx-icon-sun-core)"/><stop offset=".58" stopColor="var(--wx-icon-sun-mid)"/><stop offset="1" stopColor="var(--wx-icon-sun-edge)"/></radialGradient>
   <linearGradient id={moonGradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--wx-icon-moon-core)"/><stop offset=".64" stopColor="var(--wx-icon-moon-mid)"/><stop offset="1" stopColor="var(--wx-icon-moon-edge)"/></linearGradient>
   <linearGradient id={cloudGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--wx-icon-cloud-top)"/><stop offset=".58" stopColor="var(--wx-icon-cloud-mid)"/><stop offset="1" stopColor="var(--wx-icon-cloud-bottom)"/></linearGradient>
   <linearGradient id={nightCloudGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--wx-icon-night-cloud-top)"/><stop offset=".58" stopColor="var(--wx-icon-night-cloud-mid)"/><stop offset="1" stopColor="var(--wx-icon-night-cloud-bottom)"/></linearGradient>
   <linearGradient id={stormGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--wx-icon-storm-top)"/><stop offset="1" stopColor="var(--wx-icon-storm-bottom)"/></linearGradient>
   <linearGradient id={nightStormGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--wx-icon-night-storm-top)"/><stop offset="1" stopColor="var(--wx-icon-night-storm-bottom)"/></linearGradient>
   <filter id={shadow} x="-28%" y="-28%" width="156%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation={compact?1.25:1.8} floodColor="var(--wx-icon-shadow)" floodOpacity={compact ? .24 : .3}/></filter>
  </defs>
  {!plain?<SkyPlate day={day} kind={kind} form={form}/>:null}
  <g filter={`url(#${shadow})`}>
   {kind==='clear'?<g transform={day?"translate(12 12) scale(1.12)":"translate(10 10) scale(1.16)"}>{celestial}</g>:null}
   {showCelestial?<g transform={day?"translate(-2 -3) scale(.82)":"translate(-1 -2) scale(.86)"}>{celestial}</g>:null}
   {showVeiledCelestial?<g opacity={day ? .38 : .54} transform={day?"translate(-2 -3) scale(.78)":"translate(-1 -2) scale(.82)"}>{celestial}</g>:null}
   {showFogCelestial?<g opacity={day ? .28 : .42} transform={day?"translate(-2 -3) scale(.78)":"translate(-1 -2) scale(.82)"}>{celestial}</g>:null}
   {kind==='cloudy'?<CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/>:null}
   {kind==='mostly-clear'?<g transform="translate(14 15) scale(.72)"><CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/></g>:null}
   {kind==='partly-cloudy'?<g transform="translate(6 8) scale(.9)"><CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/></g>:null}
   {kind==='haze'?null:precipitationCloud?<CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient} dark={darkCloud}/>:null}
   {kind==='mist'?<MistLines/>:null}
   {kind==='fog'?<MistLines fog/>:null}
   {kind==='rime-fog'?<MistLines fog rime/>:null}
   {kind==='haze'?<MistLines haze/>:null}
   {kind==='drizzle'?<Rain intensity={precipIntensity} drizzle/>:null}
   {kind==='freezing-drizzle'?<><Rain intensity={precipIntensity} drizzle/><IceCrystal/></>:null}
   {kind==='rain'?<Rain intensity={precipIntensity}/>:null}
   {kind==='freezing-rain'?<><Rain intensity={precipIntensity}/><IceCrystal/></>:null}
   {kind==='showers'?<Rain intensity={precipIntensity}/>:null}
   {kind==='sleet'?<><Rain intensity={precipIntensity}/><Snow intensity={precipIntensity}/></>:null}
   {kind==='sleet-showers'?<><Rain intensity={precipIntensity}/><Snow intensity={precipIntensity}/></>:null}
   {kind==='snow'?<Snow intensity={precipIntensity}/>:null}
   {kind==='snow-grains'?<Snow grains intensity={precipIntensity}/>:null}
   {kind==='snow-showers'?<Snow intensity={precipIntensity}/>:null}
   {kind==='ice-crystals'?<><IceCrystal x={27} y={51} large/><IceCrystal x={43} y={55}/></>:null}
   {kind==='ice-pellets'?<IcePellets intensity={precipIntensity}/>:null}
   {kind==='graupel'?<Graupel intensity={precipIntensity}/>:null}
   {kind==='hail'?<Hail intensity={precipIntensity}/>:null}
   {kind==='thunder'?<><Rain intensity={precipIntensity}/><Lightning heavy={precipIntensity==='heavy'}/></>:null}
   {kind==='thunder-hail'?<><Rain intensity={precipIntensity}/><Lightning heavy={precipIntensity==='heavy'}/><Hail intensity={precipIntensity}/></>:null}
   {kind==='squall'?<WindGlyph squall/>:null}
   {kind==='funnel-cloud'?<Funnel/>:null}
  </g>
 </svg>;
}
