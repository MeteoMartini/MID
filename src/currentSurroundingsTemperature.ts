// #795 – Independent point temperatures. A precipitation phase grid is NOT a temperature source.
// Open-Meteo Best Match intentionally does not expose a trustworthy per-cell model run.
// Do not borrow phase model run time or claim a single underlying model.
export type SurroundingsTemperaturePlace={id:string;lat:number;lon:number};
export type SurroundingsTemperatureSnapshot={
 source:'Open-Meteo';modelLabel:'Best Match';validTime:number;checkedAt:number;
 values:Record<string,number>;available:number;requested:number;
 temporalMethod:'original'|'linear';sourceTimes?:[number,number];
};
type ForecastRow={
 latitude?:number;longitude?:number;utc_offset_seconds?:number;
 hourly_units?:{temperature_2m?:string};
 hourly?:{time?:unknown[];temperature_2m?:unknown[]};
};

const MINUTE=60000;
let shortLivedForecast:{key:string;raw:unknown;checkedAt:number}|null=null;
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);

export function surroundingsTemperatureUrl(places:readonly SurroundingsTemperaturePlace[]):string|undefined{
 if(places.length<1||places.length>5||places.some(p=>!p.id||!finite(p.lat)||Math.abs(p.lat)>90||!finite(p.lon)||Math.abs(p.lon)>180))return;
 const url=new URL('https://api.open-meteo.com/v1/forecast');
 url.searchParams.set('latitude',places.map(p=>p.lat.toFixed(5)).join(','));
 url.searchParams.set('longitude',places.map(p=>p.lon.toFixed(5)).join(','));
 url.searchParams.set('hourly','temperature_2m');
 url.searchParams.set('temperature_unit','celsius');
 url.searchParams.set('timezone','GMT');
 url.searchParams.set('timeformat','unixtime');
 url.searchParams.set('past_hours','2');
 url.searchParams.set('forecast_hours','4');
 url.searchParams.set('cell_selection','land');
 return url.toString();
}

export function extractSurroundingsTemperatures(
 raw:unknown,places:readonly SurroundingsTemperaturePlace[],targetTime:number,checkedAt=Date.now(),interpolate=false
):SurroundingsTemperatureSnapshot|undefined{
 if(!Number.isFinite(targetTime)||!Number.isFinite(checkedAt)||places.length<1||places.length>5)return;
 const rows=Array.isArray(raw)?raw:[raw];
 if(rows.length!==places.length)return;
 const values:Record<string,number>=Object.create(null);
 let validTime:number|undefined;
 let method:'original'|'linear'|undefined,sourceTimes:[number,number]|undefined;
 for(let i=0;i<rows.length;i++){
  const row=rows[i] as ForecastRow|null;
  const place=places[i];
  if(!row||!place||!finite(row.latitude)||!finite(row.longitude)||
    Math.abs(row.latitude-place.lat)>0.35||Math.abs(row.longitude-place.lon)>0.35||
    row.utc_offset_seconds!==0||row.hourly_units?.temperature_2m!=='°C')continue;
  const times=row.hourly?.time,temps=row.hourly?.temperature_2m;
  if(!Array.isArray(times)||!Array.isArray(temps)||times.length!==temps.length||times.length>72||!times.length)continue;
  let best=-1,delta=Infinity;
  for(let k=0;k<times.length;k++){
   const time=times[k];
   if(!finite(time))continue;
   const d=Math.abs(time*1000-targetTime);
   if(d<delta){best=k;delta=d;}
  }
  // Hourly forecasts may be +/-30 minutes from now. Reject stale/foreign frames.
  if(best<0||delta>32*MINUTE)continue;
  let value:unknown=temps[best],time=(times[best] as number)*1000;
  let valueMethod:'original'|'linear'='original',endpoints:[number,number]|undefined,rejected=false;
  if(interpolate){
   for(let k=0;k<times.length-1;k++){
    const start=times[k],end=times[k+1];
    if(!finite(start)||!finite(end))continue;
    const a=start*1000,b=end*1000;
    if(!(a<targetTime&&targetTime<b)||b-a!==60*MINUTE)continue;
    const low=temps[k],high=temps[k+1];
    // Interpolate 2-m temperature only between verified hourly originals.
    // Abrupt changes stay at their real original time, not visually smoothed.
    if(finite(low)&&finite(high)&&low>=-100&&low<=65&&high>=-100&&high<=65&&Math.abs(high-low)<=8){
     value=Math.round((low+(high-low)*(targetTime-a)/(b-a))*10)/10;
     time=targetTime;valueMethod='linear';endpoints=[a,b];
    }else rejected=true; // Missing endpoints and extremes are NoData at subhourly target.
    break;
   }
  }
  if(rejected||!finite(value)||value < -100||value > 65)continue;
  if(validTime!==undefined&&(time!==validTime||method!==valueMethod))continue;
  if(endpoints&&sourceTimes&&(endpoints[0]!==sourceTimes[0]||endpoints[1]!==sourceTimes[1]))continue;
  validTime=time;method=valueMethod;
  if(endpoints)sourceTimes=endpoints;
  values[place.id]=value; // stable coordinate-derived key, never missing=0
 }
 const available=Object.keys(values).length;
 if(!available||validTime===undefined)return;
 return{source:'Open-Meteo',modelLabel:'Best Match',validTime,checkedAt,available,requested:places.length,values,temporalMethod:method??'original',...(sourceTimes?{sourceTimes}:{})};
}

export async function loadSurroundingsTemperatures(
 places:readonly SurroundingsTemperaturePlace[],targetTime:number,signal:AbortSignal,interpolate=false
):Promise<SurroundingsTemperatureSnapshot|undefined>{
 const url=surroundingsTemperatureUrl(places);
 if(!url)return;
 const checkedAt=Date.now();
 const cached=shortLivedForecast;
 if(cached&&cached.key===url&&checkedAt-cached.checkedAt<2*MINUTE)
  return extractSurroundingsTemperatures(cached.raw,places,targetTime,checkedAt,interpolate);
 const response=await fetch(url,{signal,mode:'cors',credentials:'omit'});
 if(!response.ok)throw new Error(`Umfeldtemperatur HTTP ${response.status}`);
 const data:unknown=await response.json();
 if(signal.aborted)return;
 shortLivedForecast={key:url,raw:data,checkedAt};
 return extractSurroundingsTemperatures(data,places,targetTime,checkedAt,interpolate);
}
