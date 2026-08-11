export type TimeDisplayMode='local'|'zulu';

export const TIME_DISPLAY_STORAGE_KEY='mid:time-display-mode:v1';
export const TIME_DISPLAY_LOCAL_ZONE_KEY='mid:time-display-local-zone:v1';
export const TIME_DISPLAY_EVENT='mid:time-display-mode-change';

export function readTimeDisplayMode():TimeDisplayMode{try{return localStorage.getItem(TIME_DISPLAY_STORAGE_KEY)==='zulu'?'zulu':'local'}catch{return'local'}}
export function writeTimeDisplayMode(mode:TimeDisplayMode){const value:TimeDisplayMode=mode==='zulu'?'zulu':'local';try{localStorage.setItem(TIME_DISPLAY_STORAGE_KEY,value)}catch{};if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(TIME_DISPLAY_EVENT,{detail:value}));return value}
export function setTimeDisplayLocalZone(zone?:string){if(!zone)return;try{localStorage.setItem(TIME_DISPLAY_LOCAL_ZONE_KEY,zone)}catch{}}
export function readTimeDisplayLocalZone(){try{return localStorage.getItem(TIME_DISPLAY_LOCAL_ZONE_KEY)||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return'UTC'}}
export function displayTimeZone(localTimeZone?:string,mode:TimeDisplayMode=readTimeDisplayMode()){return mode==='zulu'?'UTC':localTimeZone||readTimeDisplayLocalZone()}
export function displayTimeSuffix(mode:TimeDisplayMode=readTimeDisplayMode()){return mode==='zulu'?'Z':''}
export function displayTimeLabel(mode:TimeDisplayMode=readTimeDisplayMode()){return mode==='zulu'?'Z-Zeit (UTC)':'Lokalzeit'}
export function formatDisplayDateTime(value:string|number|Date,localTimeZone:string|undefined,options:Intl.DateTimeFormatOptions){const date=value instanceof Date?value:new Date(value);if(!Number.isFinite(date.getTime()))return'–';const mode=readTimeDisplayMode(),zone=displayTimeZone(localTimeZone,mode);try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:zone}).format(date)}catch{return new Intl.DateTimeFormat('de-DE',options).format(date)}}

function zonedParts(epoch:number,timeZone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)),get=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);return{year:get('year'),month:get('month'),day:get('day'),hour:get('hour'),minute:get('minute'),second:get('second')}}
export function localIsoToEpoch(value:string,localTimeZone?:string){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match)return Date.parse(value);const zone=localTimeZone||readTimeDisplayLocalZone(),desired=Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]),Number(match[6]||0));let guess=desired;for(let i=0;i<4;i++){const p=zonedParts(guess,zone),actual=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),diff=desired-actual;if(Math.abs(diff)<1000)break;guess+=diff}return guess}
export function formatLocalIsoDisplayTime(value:string,localTimeZone?:string,options:Intl.DateTimeFormatOptions={hour:'2-digit',minute:'2-digit',hourCycle:'h23'}){const epoch=localIsoToEpoch(value,localTimeZone);return Number.isFinite(epoch)?formatDisplayDateTime(epoch,localTimeZone,options):'–'}

export function displayInputFromUtc(value:string,localTimeZone?:string){const epoch=Date.parse(`${String(value||'').slice(0,16)}:00Z`);if(!Number.isFinite(epoch))return value;const zone=displayTimeZone(localTimeZone),parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)),get=(type:string)=>parts.find(part=>part.type===type)?.value||'';return`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`}
export function utcInputFromDisplay(value:string,localTimeZone?:string){const mode=readTimeDisplayMode(),epoch=mode==='zulu'?Date.parse(`${value}:00Z`):localIsoToEpoch(value,localTimeZone);return Number.isFinite(epoch)?new Date(epoch).toISOString().slice(0,16):value}
