import {label,type Hour} from './weather';
import {precipitationParts} from './precipitation';
import {weatherPictogramKind,type WeatherPictogramCloudProfile,type WeatherPictogramKind} from './WeatherPictogram';

export type PeriodWeatherVisual=WeatherPictogramCloudProfile&{code:number;title:string;available:boolean};

type PeriodWeatherVisualOptions={preferFallbackCode?:boolean};

const SKY_KINDS=new Set<WeatherPictogramKind>(['clear','mostly-clear','partly-cloudy','cloudy','mist','fog','rime-fog','haze']);
const FOG_KINDS=new Set<WeatherPictogramKind>(['mist','fog','rime-fog','haze']);
const THUNDER_KINDS=new Set<WeatherPictogramKind>(['thunder','thunder-hail']);

function meanLayer(hours:Hour[],key:'cloud'|'lowCloud'|'midCloud'|'highCloud'){
 const values=hours.map(hour=>Number(hour[key])).filter(Number.isFinite);
 return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:undefined;
}

function periodPool(hours:Hour[],dayPeriod:boolean){
 const exact=hours.filter(hour=>hour.isDay===dayPeriod);
 if(exact.length)return exact;
 const civil=hours.filter(hour=>{const clock=Number(hour.time.slice(11,13));return dayPeriod?clock>=7&&clock<=18:clock<=6||clock>=19});
 return civil.length?civil:hours;
}

function displayCode(hour:Hour){return precipitationParts(hour).displayCode}
function sampleKind(hour:Hour){return weatherPictogramKind(displayCode(hour))}
function sampleAmount(hour:Hour){return Math.max(0,Number(hour.precipitation)||0)+Math.max(0,Number(hour.snowfall)||0)*0.1}
function sampleProbability(hour:Hour){return Math.max(0,Math.min(100,Number(hour.probability)||0))}

function skyCodeForPool(pool:Hour[]){
 const cloud=meanLayer(pool,'cloud');
 if(Number.isFinite(cloud)){
  if(Number(cloud)<=12)return 0;
  if(Number(cloud)<=35)return 1;
  if(Number(cloud)<=72)return 2;
  return 3;
 }
 const counts=new Map<number,number>();
 for(const hour of pool){const code=displayCode(hour),kind=weatherPictogramKind(code);if(!SKY_KINDS.has(kind))continue;const normalized=kind==='clear'?0:kind==='mostly-clear'?1:kind==='partly-cloudy'?2:3;counts.set(normalized,(counts.get(normalized)??0)+1)}
 return [...counts.entries()].sort((left,right)=>right[1]-left[1]||left[0]-right[0])[0]?.[0]??3;
}

function dominantPeriodCode(pool:Hour[]){
 if(!pool.length)return 3;
 const precipRows=pool.map(hour=>({hour,code:displayCode(hour),kind:sampleKind(hour),amount:sampleAmount(hour),probability:sampleProbability(hour)})).filter(row=>!SKY_KINDS.has(row.kind));
 const active=precipRows.filter(row=>row.amount>=.02||row.probability>=30||THUNDER_KINDS.has(row.kind));
 const totalAmount=active.reduce((sum,row)=>sum+row.amount,0),maxProbability=active.reduce((value,row)=>Math.max(value,row.probability),0),thunder=active.some(row=>THUNDER_KINDS.has(row.kind));
 const precipitationDominant=active.length>=Math.max(2,Math.ceil(pool.length*.25))||totalAmount>=.8||maxProbability>=70||thunder;
 if(precipitationDominant&&active.length){
  const scores=new Map<WeatherPictogramKind,{score:number;code:number;bestSampleScore:number}>();
  for(const row of active){
   const severity=THUNDER_KINDS.has(row.kind)?4:row.kind==='showers'||row.kind==='sleet-showers'||row.kind==='snow-showers'?2.3:row.kind==='rain'||row.kind==='freezing-rain'||row.kind==='sleet'||row.kind==='snow'?1.9:1.35;
   const score=severity*(1+row.probability/100)+Math.min(4,row.amount*2.4),existing=scores.get(row.kind);
   if(existing)scores.set(row.kind,{score:existing.score+score,code:score>existing.bestSampleScore?row.code:existing.code,bestSampleScore:Math.max(existing.bestSampleScore,score)});else scores.set(row.kind,{score,code:row.code,bestSampleScore:score});
  }
  const winner=[...scores.values()].sort((a,b)=>b.score-a.score)[0];
  if(winner)return winner.code;
 }
 const fogRows=pool.filter(hour=>FOG_KINDS.has(sampleKind(hour)));
 if(fogRows.length>=Math.max(2,Math.ceil(pool.length*.3))){
  const fogCode=fogRows.reduce((best,hour)=>sampleKind(hour)==='rime-fog'?hour:sampleKind(hour)==='fog'&&sampleKind(best)!=='rime-fog'?hour:best,fogRows[0]);
  return displayCode(fogCode);
 }
 return skyCodeForPool(pool);
}

/**
 * Einheitlicher MID-Vertrag für zusammengefasste Wetterpiktogramme.
 * - Tageskarten dürfen den bereits aus Tagesverlauf/Sonnenschein/Niederschlag
 *   abgeleiteten dayWeatherCharacter als führendes Signal verwenden.
 * - Nacht-/sonstige Perioden werden nicht nach dem "schlimmsten Einzelstundensymbol",
 *   sondern nach Dauer, Wahrscheinlichkeit, Menge und mittlerer Bewölkung bestimmt.
 * Dadurch bleiben Piktogramm, Text und Skybar konsistent.
 */
export function periodWeatherVisual(hours:Hour[],dayPeriod:boolean,fallbackCode:number,fallbackTitle:string,options:PeriodWeatherVisualOptions={}):PeriodWeatherVisual{
 const pool=periodPool(hours,dayPeriod),periodLabel=dayPeriod?'Tagsüber':'Nachts';
 if(!pool.length)return{code:fallbackCode,title:`${periodLabel}: ${fallbackTitle}`,available:false};
 const code=options.preferFallbackCode?fallbackCode:dominantPeriodCode(pool),baseTitle=options.preferFallbackCode?fallbackTitle:label(code)||fallbackTitle;
 return{code,title:`${periodLabel}: ${baseTitle}`,available:true,cloud:meanLayer(pool,'cloud'),lowCloud:meanLayer(pool,'lowCloud'),midCloud:meanLayer(pool,'midCloud'),highCloud:meanLayer(pool,'highCloud')};
}
