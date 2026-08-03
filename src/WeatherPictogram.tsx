import {useId,type CSSProperties} from 'react';
import {label} from './weather';

export type WeatherPictogramKind='clear'|'mostly-clear'|'partly-cloudy'|'cloudy'|'fog'|'rime-fog'|'drizzle'|'freezing-drizzle'|'rain'|'freezing-rain'|'showers'|'sleet'|'snow'|'snow-grains'|'snow-showers'|'thunder'|'thunder-hail';
export type CloudLayerKind='none'|'low'|'mid'|'high'|'layered'|'convective'|'unspecified';

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

function Sun({gradient}:{gradient:string}){return <g className="mid-weather-sun"><g stroke="#f6ad16" strokeWidth="2.6" strokeLinecap="round" opacity=".94"><path d="M20 5v5"/><path d="M20 30v5"/><path d="M5 20h5"/><path d="M30 20h5"/><path d="m9.4 9.4 3.5 3.5"/><path d="m27.1 27.1 3.5 3.5"/><path d="m30.6 9.4-3.5 3.5"/><path d="m12.9 27.1-3.5 3.5"/></g><circle cx="20" cy="20" r="8.3" fill={`url(#${gradient})`} stroke="#f7b323" strokeWidth="1.2"/></g>}
function Moon({gradient}:{gradient:string}){return <g className="mid-weather-moon"><path d="M29.5 8.5c-7.2 1.2-12.1 8-10.8 15.1 1.3 7.1 8.2 11.7 15.4 10.1-3.7 3.4-9.1 4.8-14.2 3.2C11.8 34.4 7.3 25.8 9.8 17.7 12.4 9.7 21 5.2 29.1 7.7l.4.8Z" fill={`url(#${gradient})`} stroke="#f4c75e" strokeWidth="1.1"/><g fill="#fff4b3" opacity=".72"><circle cx="39" cy="11" r="1"/><circle cx="46" cy="17" r=".8"/><circle cx="42" cy="25" r=".65"/></g></g>}
function LowCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <path className="mid-weather-cloud mid-weather-cloud-low" d="M14.5 45.8h35c6.2 0 10.9-4.2 10.9-9.7 0-5.2-4.1-9.2-9.5-9.7-1.9-7-8-11.5-15.2-11.5-8 0-14.6 5.5-16.1 13-6.4.2-11.3 4-11.3 9.3 0 4.8 3.1 8.6 6.2 8.6Z" fill={`url(#${gradient})`} stroke={dark?'#526071':'#a9b7c5'} strokeWidth="1.35"/>}
function StratusCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-stratus"><path d="M13 37.5c1.1-5.2 5.8-8.7 11.2-8.7 2.3-5 7.4-8.1 13.2-8.1 6.2 0 11.5 3.5 13.6 8.7 5.5.4 9.8 3.8 10 8.7.2 5.2-4.4 9.3-10.3 9.3H18.8c-6 0-10.6-4.1-10.5-9.2.1-.2 2.3-.7 4.7-.7Z" fill={`url(#${gradient})`} stroke={dark?'#526071':'#a9b7c5'} strokeWidth="1.3"/><path d="M14 50h39" stroke={dark?'#647185':'#c0cbd5'} strokeWidth="2" strokeLinecap="round" opacity=".72"/></g>}
function MidCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-mid"><path d="M9 40c.8-4 4.3-6.8 8.7-6.8 1.5-3.8 5.2-6.4 9.6-6.4 4.5 0 8.4 2.8 9.8 6.8 4.3.2 7.8 3 8.4 6.4.7 4-2.9 7.6-7.5 7.6H17c-4.7 0-8.3-3.3-8-7.6Z" fill={`url(#${gradient})`} stroke={dark?'#566479':'#aebbc8'} strokeWidth="1.2"/><path d="M33 48.2c.7-3.4 3.7-5.8 7.4-5.8 1.3-3.2 4.4-5.3 8.1-5.3 4.7 0 8.7 3.2 9.4 7.5 3.3.4 5.9 2.9 5.9 6 0 3.4-2.8 6.1-6.5 6.1H40c-4.1 0-7.2-2.9-7-6.5Z" fill={`url(#${gradient})`} stroke={dark?'#566479':'#aebbc8'} strokeWidth="1.2" opacity=".94"/></g>}
function HighCloud(){return <g className="mid-weather-cloud mid-weather-cloud-high" fill="none" strokeLinecap="round"><path d="M11 34c8-8 15-7 22-2 6 4 13 4 24-5" stroke="#dbe7f2" strokeWidth="4.2"/><path d="M15 42c10-6 20-5 29-.5 5 2.4 9 2.2 15-.8" stroke="#eef5fa" strokeWidth="3.1"/><path d="M28 50c7-3.7 14-3.6 22-.3" stroke="#cbdbea" strokeWidth="2.5"/></g>}
function LayeredCloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <g className="mid-weather-cloud mid-weather-cloud-layered"><HighCloud/><g transform="translate(4 5) scale(.93)"><MidCloud gradient={gradient} dark={dark}/></g></g>}
function ConvectiveCloud({gradient}:{gradient:string}){return <path className="mid-weather-cloud mid-weather-cloud-convective" d="M16 46.5h35.5c6.5 0 11.2-4.4 10.7-10-.5-5.1-4.7-8.7-10.2-8.9-.7-4.4-4-7.9-8.4-9.1-.8-7.1-6.8-12.4-14.3-12.4-7.8 0-14.1 5.9-14.4 13.5-5.3 1.3-9.1 5.7-9 10.9.1 5.1 4.1 9.1 10.1 9.1Z" fill={`url(#${gradient})`} stroke="#526071" strokeWidth="1.45"/>}
function CloudShape({kind,gradient,stormGradient,dark=false}:{kind:CloudLayerKind;gradient:string;stormGradient:string;dark?:boolean}){const fill=dark?stormGradient:gradient;if(kind==='high')return <HighCloud/>;if(kind==='mid')return <MidCloud gradient={fill} dark={dark}/>;if(kind==='layered')return <LayeredCloud gradient={fill} dark={dark}/>;if(kind==='convective')return <ConvectiveCloud gradient={stormGradient}/>;if(kind==='low')return <StratusCloud gradient={fill} dark={dark}/>;return <LowCloud gradient={fill} dark={dark}/>}
function FogLines({rime=false}:{rime?:boolean}){return <g className="mid-weather-fog-lines" fill="none" strokeLinecap="round"><path d="M10 49h35" stroke="#7d93a8" strokeWidth="3"/><path d="M19 55h35" stroke="#9aabbb" strokeWidth="3"/><path d="M8 61h29" stroke="#b4c0ca" strokeWidth="2.7"/>{rime&&<g stroke="#7fc7e8" strokeWidth="1.8"><path d="M50 46v12"/><path d="m45.5 49 9 6"/><path d="m54.5 49-9 6"/></g>}</g>}
function Rain({count=3,drizzle=false}:{count?:number;drizzle?:boolean}){const xs=count===2?[26,42]:[21,34,47];return <g className="mid-weather-rain" fill="none" stroke="#2697d8" strokeWidth={drizzle?2.2:3} strokeLinecap="round">{xs.map((x,index)=><path key={x} d={drizzle?`M${x} 49l-2 4`:`M${x} 49l-3 7`} opacity={drizzle ? .68+index*.08 : 1}/>)}</g>}
function Snow({grains=false,count=3}:{grains?:boolean;count?:number}){const xs=count===2?[25,43]:[20,34,48];return <g className="mid-weather-snow" stroke="#60b7df" strokeWidth="1.8" strokeLinecap="round">{xs.map((x,index)=>grains?<circle key={x} cx={x} cy={52+index%2*3} r="2" fill="#dff5ff"/>:<g key={x} transform={`translate(${x} ${52+index%2*3})`}><path d="M-4 0h8M0-4v8M-3-3l6 6M3-3l-6 6"/></g>)}</g>}
function IceCrystal(){return <g className="mid-weather-ice" transform="translate(50 50)" stroke="#6bc0e4" strokeWidth="1.6" strokeLinecap="round"><path d="M-5 0h10M0-5v10M-3.5-3.5l7 7M3.5-3.5l-7 7"/></g>}
function Lightning(){return <path className="mid-weather-lightning" d="M34 43h10l-6 8h7L31 63l4-10h-7l6-10Z" fill="#ffc928" stroke="#e69b00" strokeWidth="1.1" strokeLinejoin="round"/>}
function Hail(){return <g className="mid-weather-hail" fill="#d8f3ff" stroke="#4fa5cf" strokeWidth="1"><circle cx="20" cy="54" r="2.5"/><circle cx="50" cy="55" r="2.5"/></g>}

export function WeatherPictogram({code,day=true,size='1em',className='',title,x,y,style,cloud,lowCloud,midCloud,highCloud,compact=false}:Props){
 const rawId=useId().replace(/[^a-zA-Z0-9_-]/g,''),kind=weatherPictogramKind(code),layer=cloudLayerKind(code,{cloud,lowCloud,midCloud,highCloud}),layerText=cloudLayerDescription(layer),baseDescription=title||label(code),description=layerText&&!baseDescription.toLocaleLowerCase('de-DE').includes(layerText.toLocaleLowerCase('de-DE'))?`${baseDescription} · ${layerText}`:baseDescription,sunGradient=`mid-sun-${rawId}`,moonGradient=`mid-moon-${rawId}`,cloudGradient=`mid-cloud-${rawId}`,stormGradient=`mid-storm-${rawId}`,shadow=`mid-shadow-${rawId}`;
 const celestial=day?<Sun gradient={sunGradient}/>:<Moon gradient={moonGradient}/>;
 const showCelestial=['mostly-clear','partly-cloudy','showers','snow-showers'].includes(kind);
 const darkCloud=['thunder','thunder-hail'].includes(kind);
 const precipitationCloud=['drizzle','freezing-drizzle','rain','freezing-rain','showers','sleet','snow','snow-grains','snow-showers','fog','rime-fog','thunder','thunder-hail'].includes(kind);
 const cloudKind=kind==='fog'||kind==='rime-fog'?'low':layer;
 return <svg className={`mid-weather-pictogram cloud-layer-${layer}${compact?' compact':''} ${className}`.trim()} x={x} y={y} width={size} height={size} viewBox="0 0 68 68" role="img" aria-label={description} style={style} preserveAspectRatio="xMidYMid meet" data-cloud-layer={layer}>
  <title>{description}</title>
  <defs>
   <radialGradient id={sunGradient} cx="38%" cy="35%"><stop offset="0" stopColor="#fff5a8"/><stop offset=".58" stopColor="#ffd441"/><stop offset="1" stopColor="#f6a915"/></radialGradient>
   <linearGradient id={moonGradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff8c7"/><stop offset="1" stopColor="#e8c55c"/></linearGradient>
   <linearGradient id={cloudGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset=".58" stopColor="#eaf0f5"/><stop offset="1" stopColor="#c7d2dd"/></linearGradient>
   <linearGradient id={stormGradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8795aa"/><stop offset="1" stopColor="#526073"/></linearGradient>
   <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.7" floodColor="#31435a" floodOpacity=".24"/></filter>
  </defs>
  <g filter={`url(#${shadow})`}>
   {kind==='clear'?<g transform="translate(12 12) scale(1.12)">{celestial}</g>:null}
   {showCelestial?<g transform="translate(-2 -3) scale(.82)">{celestial}</g>:null}
   {kind==='cloudy'?<CloudShape kind={cloudKind} gradient={cloudGradient} stormGradient={stormGradient}/>:null}
   {kind==='mostly-clear'?<g transform="translate(14 15) scale(.72)"><CloudShape kind={cloudKind} gradient={cloudGradient} stormGradient={stormGradient}/></g>:null}
   {kind==='partly-cloudy'?<g transform="translate(6 8) scale(.9)"><CloudShape kind={cloudKind} gradient={cloudGradient} stormGradient={stormGradient}/></g>:null}
   {precipitationCloud?<CloudShape kind={cloudKind} gradient={cloudGradient} stormGradient={stormGradient} dark={darkCloud}/>:null}
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
