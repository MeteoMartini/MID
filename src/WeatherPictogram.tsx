import {useId,type CSSProperties} from 'react';
import {label} from './weather';

export type WeatherPictogramKind='clear'|'mostly-clear'|'partly-cloudy'|'cloudy'|'fog'|'rime-fog'|'drizzle'|'freezing-drizzle'|'rain'|'freezing-rain'|'showers'|'sleet'|'snow'|'snow-grains'|'snow-showers'|'thunder'|'thunder-hail';
export type CloudLayerKind='none'|'low'|'mid'|'high'|'layered'|'convective'|'unspecified';
export type CloudFormKind='clear'|'stratus'|'altostratus'|'cirrus'|'cumulus'|'cumulonimbus'|'layered'|'generic';

export type WeatherPictogramCloudProfile={
 cloud?:number;
 lowCloud?:number;
 midCloud?:number;
 highCloud?:number;
};

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
};

function finiteCloud(value:unknown){const number=Number(value);return Number.isFinite(number)?Math.max(0,Math.min(100,number)):undefined}

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
 if([68,69,83,84].includes(c))return'sleet';
 if([71,73,75].includes(c))return'snow';
 if(c===77)return'snow-grains';
 if([80,81,82].includes(c))return'showers';
 if([85,86].includes(c))return'snow-showers';
 if([96,99].includes(c))return'thunder-hail';
 if([95,97,98].includes(c))return'thunder';
 return'partly-cloudy';
}

export function cloudLayerKind(code:number,profile:WeatherPictogramCloudProfile={}):CloudLayerKind{
 const weatherKind=weatherPictogramKind(code);
 if(weatherKind==='clear')return'none';
 if(['thunder','thunder-hail','showers','snow-showers'].includes(weatherKind))return'convective';
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
 if(['fog','rime-fog','drizzle','freezing-drizzle'].includes(weatherKind))return'low';
 if(['rain','freezing-rain','sleet','snow','snow-grains'].includes(weatherKind))return mid!==undefined&&mid>=55&&(!low||mid>low+12)?'mid':'layered';
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

export function cloudFormKind(code:number,profile:WeatherPictogramCloudProfile={}):CloudFormKind{
 const weatherKind=weatherPictogramKind(code),layer=cloudLayerKind(code,profile),low=finiteCloud(profile.lowCloud),total=finiteCloud(profile.cloud);
 if(weatherKind==='clear')return'clear';
 if(['thunder','thunder-hail','showers','snow-showers'].includes(weatherKind)||layer==='convective')return'cumulonimbus';
 if(['fog','rime-fog','drizzle','freezing-drizzle'].includes(weatherKind))return'stratus';
 if(layer==='high')return'cirrus';
 if(layer==='mid')return'altostratus';
 if(layer==='layered')return'layered';
 if(layer==='low'){
  if(weatherKind==='cloudy'||['rain','freezing-rain','sleet','snow','snow-grains'].includes(weatherKind)||(low??0)>=76||(total??0)>=84)return'stratus';
  return'cumulus';
 }
 if(weatherKind==='cloudy')return'stratus';
 if(['mostly-clear','partly-cloudy'].includes(weatherKind))return'cumulus';
 if(['rain','freezing-rain','sleet','snow','snow-grains'].includes(weatherKind))return'layered';
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

function SkyPlate({day,kind,form}:{day:boolean;kind:WeatherPictogramKind;form:CloudFormKind}){
 const night=!day,stormy=['thunder','thunder-hail'].includes(kind)||form==='cumulonimbus',foggy=['fog','rime-fog'].includes(kind)||form==='stratus';
 const dayFill=stormy?'rgba(112,158,205,.31)':foggy?'rgba(202,216,228,.34)':form==='altostratus'||form==='layered'?'rgba(170,198,222,.28)':form==='cirrus'?'rgba(181,221,246,.20)':form==='cumulus'?'rgba(157,207,239,.22)':'rgba(170,214,244,.18)';
 const nightFill=stormy?'rgba(21,53,88,.52)':foggy?'rgba(83,108,138,.40)':form==='altostratus'||form==='layered'?'rgba(56,92,132,.38)':form==='cirrus'?'rgba(74,118,164,.28)':form==='cumulus'?'rgba(62,108,157,.32)':'rgba(58,112,166,.28)';
 const fill=night?nightFill:dayFill,stroke=night?'rgba(228,241,255,.34)':'rgba(69,112,149,.20)';
 return <g className={`mid-weather-skyplate ${day?'day':'night'}`}><rect x="2.5" y="2.5" width="63" height="63" rx="12" fill={fill} stroke={stroke} strokeWidth="1.15"/><path d="M5 49c14-4 27-5 39-2 7 1.7 13 2 19 .5v14H5Z" fill={night?'rgba(213,231,250,.10)':'rgba(255,255,255,.12)'}/></g>;
}

function Sun({gradient}:{gradient:string}){return <g className="mid-weather-sun"><g stroke="#f6ad16" strokeWidth="2.6" strokeLinecap="round" opacity=".94"><path d="M20 5v5"/><path d="M20 30v5"/><path d="M5 20h5"/><path d="M30 20h5"/><path d="m9.4 9.4 3.5 3.5"/><path d="m27.1 27.1 3.5 3.5"/><path d="m30.6 9.4-3.5 3.5"/><path d="m12.9 27.1-3.5 3.5"/></g><circle cx="20" cy="20" r="8.3" fill={`url(#${gradient})`} stroke="#f7b323" strokeWidth="1.2"/></g>}
function Moon({gradient}:{gradient:string}){return <g className="mid-weather-moon"><path d="M29.5 8.5c-7.2 1.2-12.1 8-10.8 15.1 1.3 7.1 8.2 11.7 15.4 10.1-3.7 3.4-9.1 4.8-14.2 3.2C11.8 34.4 7.3 25.8 9.8 17.7 12.4 9.7 21 5.2 29.1 7.7l.4.8Z" fill={`url(#${gradient})`} stroke="#d8ac39" strokeWidth="1.35"/><path d="M26.8 10.5c-5.5 1.8-9.2 7.6-8 13.3 1.1 5.7 6.7 9.7 12.4 9.1" fill="none" stroke="rgba(255,247,201,.9)" strokeWidth="1.1" strokeLinecap="round"/><g fill="#fff4b3" opacity=".86"><circle cx="39" cy="11" r="1.15"/><circle cx="46" cy="17" r=".95"/><circle cx="42" cy="25" r=".8"/></g></g>}
function LowCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <path className="mid-weather-cloud mid-weather-cloud-low" d="M14.5 45.8h35c6.2 0 10.9-4.2 10.9-9.7 0-5.2-4.1-9.2-9.5-9.7-1.9-7-8-11.5-15.2-11.5-8 0-14.6 5.5-16.1 13-6.4.2-11.3 4-11.3 9.3 0 4.8 3.1 8.6 6.2 8.6Z" fill={`url(#${gradient})`} stroke={dark?'#526071':'#a9b7c5'} strokeWidth="1.35"/>}
function StratusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-stratus"><path d="M8.5 36.5c1-3.7 4.4-6.1 8.7-6.1 2.3-3.2 6.7-5.2 11.4-5.2 4.8 0 8.8 1.9 11.4 5 4.2-.2 7.6 1.6 9.4 4.5 6.2-.3 10.6 3.1 10.6 7.7 0 4.7-4.1 8-10 8H18.7c-6.2 0-10.6-3.2-10.6-7.9 0-2.4.1-4.2.4-6Z" fill={`url(#${gradient})`} stroke={dark?'#526071':'#9eafc0'} strokeWidth="1.35"/><path d="M12 52h42M18 56.5h31" stroke={dark?'#647185':'#b5c3d0'} strokeWidth="1.9" strokeLinecap="round" opacity=".8"/></g>}
function CumulusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-cumulus"><path d="M14 47.5h36c6 0 10.4-3.8 10.4-8.7 0-4.8-3.8-8.5-8.9-8.9-1.3-5.9-6.4-10-12.5-10-5.4 0-10 3-12 7.5-1.7-1.1-3.8-1.7-6-1.7-6.6 0-11.6 4.4-11.6 10.1 0 6.2 4.1 11.7 4.6 11.7Z" fill={`url(#${gradient})`} stroke={dark?'#526071':'#9eafbf'} strokeWidth="1.35"/><path d="M23 29.5c2-4.4 5.5-6.9 9.6-6.9 4.3 0 7.7 2.4 9.7 6.8" fill="none" stroke="rgba(255,255,255,.52)" strokeWidth="1.7" strokeLinecap="round"/></g>}
function AltostratusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-altostratus"><path d="M8.5 34.5c5.5-5.4 12.5-7.4 20.6-5.3 6.9-3.9 14.5-3.5 20.9 1.2 6.6.2 11 3.5 11 8.4 0 5.4-4.9 9.2-11.7 9.2H18.6C12 48 7 44.4 7 39.3c0-1.7.5-3.3 1.5-4.8Z" fill={`url(#${gradient})`} stroke={dark?'#58677a':'#a5b6c6'} strokeWidth="1.25" opacity=".96"/><path d="M11 51h45M16 55h34" stroke={dark?'#6d7a8d':'#bbc8d4'} strokeWidth="1.7" strokeLinecap="round" opacity=".78"/></g>}
function MidCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <AltostratusCloud gradient={gradient} dark={dark}/>}
function HighCloud(){return <g className="mid-weather-cloud mid-weather-cloud-high" fill="none" strokeLinecap="round"><path d="M9 29c9-8.8 17.5-9.1 24.8-3.6 7 5 14.8 4.5 25.4-5.8" stroke="#9fb8ce" strokeWidth="4.2" opacity=".98"/><path d="M13 38c11-6.8 21-5.9 30.5-1.2 5.2 2.5 10.2 2.1 15.8-1.2" stroke="#d9e6f0" strokeWidth="3" opacity=".95"/><path d="M23 47c8.5-4.8 17-5 26.5-.8" stroke="#88a5c2" strokeWidth="2.5" opacity=".92"/><path d="M19 20.5c4.6-2.9 9.6-3.1 13.8-.6" stroke="#eef5fa" strokeWidth="1.8" opacity=".85"/></g>}
function LayeredCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-layered"><g opacity=".82" transform="translate(0 -5)"><HighCloud/></g><g transform="translate(2 9) scale(.95)"><AltostratusCloud gradient={gradient} dark={dark}/></g></g>}
function CumulonimbusCloud({gradient}:{gradient:string}){return <g className="mid-weather-cloud mid-weather-cloud-cumulonimbus"><path d="M10 22c4.2-4.1 8.8-6.1 13.9-6 1.9-6 6.8-10 12.6-10 6.2 0 11.2 4.5 12.6 11 5.1.2 9.4 2.2 12.8 6.1-3.3 2.4-7.2 3.5-11.8 3.5 5.2 1.6 8.6 5.6 8.6 10.6 0 6-4.9 10.6-11.6 10.6H18c-6.8 0-11.7-4.5-11.7-10.5 0-4.7 2.8-8.6 7.3-10.4-2.1-1-3.3-2.6-3.6-4.9Z" fill={`url(#${gradient})`} stroke="#44556b" strokeWidth="1.55"/><path d="M17 20h36" stroke="rgba(255,255,255,.30)" strokeWidth="2" strokeLinecap="round"/><path d="M24 31c2.7-7.1 6.8-11 12.2-11 5.2 0 9.2 3.7 11.7 10.4" fill="none" stroke="rgba(255,255,255,.27)" strokeWidth="1.8" strokeLinecap="round"/></g>}
function ConvectiveCloud({gradient}:{gradient:string}){return <CumulonimbusCloud gradient={gradient}/>}
function CloudShape({form,gradient,stormGradient,dark=false}:{form:CloudFormKind;gradient:string;stormGradient:string;dark?:boolean}){const fill=dark?stormGradient:gradient;if(form==='cirrus')return <HighCloud/>;if(form==='altostratus')return <MidCloud gradient={fill} dark={dark}/>;if(form==='layered')return <LayeredCloud gradient={fill} dark={dark}/>;if(form==='cumulonimbus')return <ConvectiveCloud gradient={stormGradient}/>;if(form==='cumulus')return <CumulusCloud gradient={fill} dark={dark}/>;if(form==='stratus')return <StratusCloud gradient={fill} dark={dark}/>;return <LowCloud gradient={fill} dark={dark}/>}
function FogLines({rime=false}:{rime?:boolean}){return <g className="mid-weather-fog-lines" fill="none" strokeLinecap="round"><path d="M10 49h35" stroke="#7d93a8" strokeWidth="3"/><path d="M19 55h35" stroke="#9aabbb" strokeWidth="3"/><path d="M8 61h29" stroke="#b4c0ca" strokeWidth="2.7"/>{rime&&<g stroke="#7fc7e8" strokeWidth="1.8"><path d="M50 46v12"/><path d="m45.5 49 9 6"/><path d="m54.5 49-9 6"/></g>}</g>}
function Rain({count=3,drizzle=false}:{count?:number;drizzle?:boolean}){const xs=count===2?[26,42]:[21,34,47];return <g className="mid-weather-rain" fill="none" stroke="#2697d8" strokeWidth={drizzle?2.2:3} strokeLinecap="round">{xs.map((x,index)=><path key={x} d={drizzle?`M${x} 49l-2 4`:`M${x} 49l-3 7`} opacity={drizzle ? .68+index*.08 : 1}/>)}</g>}
function Snow({grains=false,count=3}:{grains?:boolean;count?:number}){const xs=count===2?[25,43]:[20,34,48];return <g className="mid-weather-snow" stroke="#60b7df" strokeWidth="1.8" strokeLinecap="round">{xs.map((x,index)=>grains?<circle key={x} cx={x} cy={52+index%2*3} r="2" fill="#dff5ff"/>:<g key={x} transform={`translate(${x} ${52+index%2*3})`}><path d="M-4 0h8M0-4v8M-3-3l6 6M3-3l-6 6"/></g>)}</g>}
function IceCrystal(){return <g className="mid-weather-ice" transform="translate(50 50)" stroke="#6bc0e4" strokeWidth="1.6" strokeLinecap="round"><path d="M-5 0h10M0-5v10M-3.5-3.5l7 7M3.5-3.5l-7 7"/></g>}
function Lightning(){return <path className="mid-weather-lightning" d="M34 43h10l-6 8h7L31 63l4-10h-7l6-10Z" fill="#ffc928" stroke="#e69b00" strokeWidth="1.1" strokeLinejoin="round"/>}
function Hail(){return <g className="mid-weather-hail" fill="#d8f3ff" stroke="#4fa5cf" strokeWidth="1"><circle cx="20" cy="54" r="2.5"/><circle cx="50" cy="55" r="2.5"/></g>}

export function WeatherPictogram({code,day=true,size='1em',className='',title,x,y,style,cloud,lowCloud,midCloud,highCloud,compact=false}:Props){
 const profile={cloud,lowCloud,midCloud,highCloud},rawId=useId().replace(/[^a-zA-Z0-9_-]/g,''),kind=weatherPictogramKind(code),layer=cloudLayerKind(code,profile),form=cloudFormKind(code,profile),layerText=cloudLayerDescription(layer),formText=cloudFormDescription(form),baseDescription=title||label(code),details=[layerText,formText].filter(Boolean).filter((item,index,array)=>array.indexOf(item)===index),description=details.reduce((current,item)=>current.toLocaleLowerCase('de-DE').includes(item.toLocaleLowerCase('de-DE'))?current:`${current} · ${item}`,baseDescription),sunGradient=`mid-sun-${rawId}`,moonGradient=`mid-moon-${rawId}`,cloudGradient=`mid-cloud-${rawId}`,nightCloudGradient=`mid-cloud-night-${rawId}`,stormGradient=`mid-storm-${rawId}`,nightStormGradient=`mid-storm-night-${rawId}`,shadow=`mid-shadow-${rawId}`;
 const celestial=day?<Sun gradient={sunGradient}/>:<Moon gradient={moonGradient}/>;
 const showCelestial=['mostly-clear','partly-cloudy','showers','snow-showers'].includes(kind),showVeiledCelestial=kind==='cloudy'&&['cirrus','altostratus'].includes(form),showFogMoon=!day&&['fog','rime-fog'].includes(kind);
 const darkCloud=['thunder','thunder-hail'].includes(kind),cloudFillGradient=day?cloudGradient:nightCloudGradient,stormFillGradient=day?stormGradient:nightStormGradient;
 const precipitationCloud=['drizzle','freezing-drizzle','rain','freezing-rain','showers','sleet','snow','snow-grains','snow-showers','fog','rime-fog','thunder','thunder-hail'].includes(kind);
 return <svg className={`mid-weather-pictogram cloud-layer-${layer} cloud-form-${form}${compact?' compact':''} ${className}`.trim()} x={x} y={y} width={size} height={size} viewBox="0 0 68 68" role="img" aria-label={description} style={style} preserveAspectRatio="xMidYMid meet" data-cloud-layer={layer} data-cloud-form={form} data-day-part={day?'day':'night'}>
  <title>{description}</title>
  <defs>
   <radialGradient id={sunGradient} cx="38%" cy="35%"><stop offset="0" stopColor="#fff5a8"/><stop offset=".58" stopColor="#ffd441"/><stop offset="1" stopColor="#f6a915"/></radialGradient>
   <linearGradient id={moonGradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff8cf"/><stop offset=".64" stopColor="#f1d57a"/><stop offset="1" stopColor="#d8ac39"/></linearGradient>
   <linearGradient id={cloudGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset=".58" stopColor="#eaf0f5"/><stop offset="1" stopColor="#c7d2dd"/></linearGradient>
   <linearGradient id={nightCloudGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9fcff"/><stop offset=".58" stopColor="#e7f0f7"/><stop offset="1" stopColor="#bccbd9"/></linearGradient>
   <linearGradient id={stormGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8795aa"/><stop offset="1" stopColor="#526073"/></linearGradient>
   <linearGradient id={nightStormGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a0afc2"/><stop offset="1" stopColor="#66788e"/></linearGradient>
   <filter id={shadow} x="-28%" y="-28%" width="156%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="1.9" floodColor="#31435a" floodOpacity=".29"/></filter>
  </defs>
  <SkyPlate day={day} kind={kind} form={form}/>
  <g filter={`url(#${shadow})`}>
   {kind==='clear'?<g transform={day?"translate(12 12) scale(1.12)":"translate(10 10) scale(1.16)"}>{celestial}</g>:null}
   {showCelestial?<g transform={day?"translate(-2 -3) scale(.82)":"translate(-1 -2) scale(.86)"}>{celestial}</g>:null}
   {showVeiledCelestial?<g opacity={day ? .48 : .62} transform={day?"translate(-1 -2) scale(.84)":"translate(0 -1) scale(.88)"}>{celestial}</g>:null}
   {showFogMoon?<g opacity=".34" transform="translate(-1 -1) scale(.86)">{celestial}</g>:null}
   {kind==='cloudy'?<CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/>:null}
   {kind==='mostly-clear'?<g transform="translate(14 15) scale(.72)"><CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/></g>:null}
   {kind==='partly-cloudy'?<g transform="translate(6 8) scale(.9)"><CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient}/></g>:null}
   {precipitationCloud?<CloudShape form={form} gradient={cloudFillGradient} stormGradient={stormFillGradient} dark={darkCloud}/>:null}
   {kind==='fog'?<FogLines/>:null}
   {kind==='rime-fog'?<FogLines rime/>:null}
   {kind==='drizzle'?<Rain count={2} drizzle/>:null}
   {kind==='freezing-drizzle'?<><Rain count={2} drizzle/><IceCrystal/></>:null}
   {kind==='rain'?<Rain/>:null}
   {kind==='freezing-rain'?<><Rain count={2}/><IceCrystal/></>:null}
   {kind==='showers'?<Rain/>:null}
   {kind==='sleet'?<><Rain count={2}/><Snow count={2}/></>:null}
   {kind==='snow'?<Snow/>:null}
   {kind==='snow-grains'?<Snow grains/>:null}
   {kind==='snow-showers'?<Snow/>:null}
   {kind==='thunder'?<><Rain count={2}/><Lightning/></>:null}
   {kind==='thunder-hail'?<><Rain count={2}/><Lightning/><Hail/></>:null}
  </g>
 </svg>
}
