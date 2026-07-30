import {useId,type CSSProperties} from 'react';
import {label} from './weather';

export type WeatherPictogramKind='clear'|'mostly-clear'|'partly-cloudy'|'cloudy'|'fog'|'rime-fog'|'drizzle'|'freezing-drizzle'|'rain'|'freezing-rain'|'showers'|'sleet'|'snow'|'snow-grains'|'snow-showers'|'thunder'|'thunder-hail';

type Props={
 code:number;
 day?:boolean;
 size?:number|string;
 className?:string;
 title?:string;
 x?:number;
 y?:number;
 style?:CSSProperties;
};

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

function Sun({gradient}:{gradient:string}){return <g className="mid-weather-sun"><g stroke="#f6ad16" strokeWidth="2.6" strokeLinecap="round" opacity=".92"><path d="M20 5v5"/><path d="M20 30v5"/><path d="M5 20h5"/><path d="M30 20h5"/><path d="m9.4 9.4 3.5 3.5"/><path d="m27.1 27.1 3.5 3.5"/><path d="m30.6 9.4-3.5 3.5"/><path d="m12.9 27.1-3.5 3.5"/></g><circle cx="20" cy="20" r="8.3" fill={`url(#${gradient})`} stroke="#f7b323" strokeWidth="1.2"/></g>}
function Moon({gradient}:{gradient:string}){return <path className="mid-weather-moon" d="M29.5 8.5c-7.2 1.2-12.1 8-10.8 15.1 1.3 7.1 8.2 11.7 15.4 10.1-3.7 3.4-9.1 4.8-14.2 3.2C11.8 34.4 7.3 25.8 9.8 17.7 12.4 9.7 21 5.2 29.1 7.7l.4.8Z" fill={`url(#${gradient})`} stroke="#f4c75e" strokeWidth="1.1"/>}
function Cloud({gradient,dark=false}:{gradient:string;dark?:boolean}){return <path className="mid-weather-cloud" d="M15.2 45.2h33.6c6.1 0 10.8-4.4 10.8-10.1 0-5.5-4.3-9.7-9.8-10.1C47.9 17.8 41.7 13 34.3 13c-8.5 0-15.4 6.1-16.5 14.3-5.8.4-10.3 4.1-10.3 9.2 0 4.9 3.5 8.7 7.7 8.7Z" fill={`url(#${gradient})`} stroke={dark?'#59677b':'#aebbc8'} strokeWidth="1.35"/>}
function FogLines({rime=false}:{rime?:boolean}){return <g className="mid-weather-fog-lines" fill="none" strokeLinecap="round"><path d="M10 49h35" stroke="#7d93a8" strokeWidth="3"/><path d="M19 55h35" stroke="#9aabbb" strokeWidth="3"/><path d="M8 61h29" stroke="#b4c0ca" strokeWidth="2.7"/>{rime&&<g stroke="#7fc7e8" strokeWidth="1.8"><path d="M50 46v12"/><path d="m45.5 49 9 6"/><path d="m54.5 49-9 6"/></g>}</g>}
function Rain({count=3,drizzle=false}:{count?:number;drizzle?:boolean}){const xs=count===2?[26,42]:[21,34,47];return <g className="mid-weather-rain" fill="none" stroke="#2697d8" strokeWidth={drizzle?2.2:3} strokeLinecap="round">{xs.map((x,index)=><path key={x} d={drizzle?`M${x} 49l-2 4`:`M${x} 49l-3 7`} opacity={drizzle ? .68+index*.08 : 1}/>)}</g>}
function Snow({grains=false,count=3}:{grains?:boolean;count?:number}){const xs=count===2?[25,43]:[20,34,48];return <g className="mid-weather-snow" stroke="#60b7df" strokeWidth="1.8" strokeLinecap="round">{xs.map((x,index)=>grains?<circle key={x} cx={x} cy={52+index%2*3} r="2" fill="#dff5ff"/>:<g key={x} transform={`translate(${x} ${52+index%2*3})`}><path d="M-4 0h8M0-4v8M-3-3l6 6M3-3l-6 6"/></g>)}</g>}
function IceCrystal(){return <g className="mid-weather-ice" transform="translate(50 50)" stroke="#6bc0e4" strokeWidth="1.6" strokeLinecap="round"><path d="M-5 0h10M0-5v10M-3.5-3.5l7 7M3.5-3.5l-7 7"/></g>}
function Lightning(){return <path className="mid-weather-lightning" d="M34 43h10l-6 8h7L31 63l4-10h-7l6-10Z" fill="#ffc928" stroke="#e69b00" strokeWidth="1.1" strokeLinejoin="round"/>}
function Hail(){return <g className="mid-weather-hail" fill="#d8f3ff" stroke="#4fa5cf" strokeWidth="1"><circle cx="20" cy="54" r="2.5"/><circle cx="50" cy="55" r="2.5"/></g>}

export function WeatherPictogram({code,day=true,size='1em',className='',title,x,y,style}:Props){
 const rawId=useId().replace(/[^a-zA-Z0-9_-]/g,''),kind=weatherPictogramKind(code),description=title||label(code),sunGradient=`mid-sun-${rawId}`,moonGradient=`mid-moon-${rawId}`,cloudGradient=`mid-cloud-${rawId}`,stormGradient=`mid-storm-${rawId}`,shadow=`mid-shadow-${rawId}`;
 const celestial=day?<Sun gradient={sunGradient}/>:<Moon gradient={moonGradient}/>;
 const showCelestial=['mostly-clear','partly-cloudy','showers','snow-showers'].includes(kind);
 const darkCloud=['thunder','thunder-hail'].includes(kind);
 return <svg className={`mid-weather-pictogram ${className}`.trim()} x={x} y={y} width={size} height={size} viewBox="0 0 68 68" role="img" aria-label={description} style={style} preserveAspectRatio="xMidYMid meet">
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
   {kind==='cloudy'?<Cloud gradient={cloudGradient}/>:null}
   {kind==='mostly-clear'?<g transform="translate(13 14) scale(.76)"><Cloud gradient={cloudGradient}/></g>:null}
   {kind==='partly-cloudy'?<g transform="translate(6 8) scale(.9)"><Cloud gradient={cloudGradient}/></g>:null}
   {['drizzle','freezing-drizzle','rain','freezing-rain','showers','sleet','snow','snow-grains','snow-showers','fog','rime-fog','thunder','thunder-hail'].includes(kind)?<Cloud gradient={darkCloud?stormGradient:cloudGradient} dark={darkCloud}/>:null}
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
