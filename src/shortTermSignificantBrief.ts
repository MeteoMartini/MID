/**
 * Exact-display forecast brief. Consume the final chart buckets, not independent
 * provider or 15-minute source timestamps; never shift precipitation UTC epochs.
 * This is a MID forecast statement, not an official DWD warning.
 */
export type WeatherBriefSlot={
 epoch:number;
 precipitation:number;
 precipitationIntervalStartEpoch?:number;
 precipitationIntervalEndEpoch?:number;
 gust:number;
 weatherLabel:string;
};
export type WeatherBriefFormat={from:(epoch:number)=>string;at:(epoch:number)=>string;gust:(knots:number)=>string};
const HOUR_MS=3600000;
const SIGNIFICANT_GUST_KT=50/1.852;
function interval(point:WeatherBriefSlot){
 const start=Number.isFinite(point.precipitationIntervalStartEpoch)?Number(point.precipitationIntervalStartEpoch):point.epoch;
 const end=Number.isFinite(point.precipitationIntervalEndEpoch)?Number(point.precipitationIntervalEndEpoch):start+HOUR_MS;
 return{point,start,end};
}
function knownAmount(point:WeatherBriefSlot){return typeof point.precipitation==='number'&&Number.isFinite(point.precipitation)&&point.precipitation>=0}
function kind(label:string){const text=String(label||'').trim();return text&&text!=='–'?text:'Niederschlag'}
export function shortTermSignificantBrief(chartSlots:readonly WeatherBriefSlot[],now:number,format:WeatherBriefFormat):string{
 const endWindow=now+24*HOUR_MS;
 const rows=chartSlots.map(interval).filter(row=>Number.isFinite(row.start)&&Number.isFinite(row.end)&&row.end>Math.max(now,row.start)&&row.start<endWindow).sort((a,b)=>a.start-b.start);
 if(!rows.length)return'Kurzfristdaten werden geladen.';
 const events:string[]=[];
 const firstWetIndex=rows.findIndex(row=>knownAmount(row.point)&&row.point.precipitation>=.05);
 if(firstWetIndex>=0){
  const wet=rows[firstWetIndex],active=wet.start<=now+60000;
  let message=active?`${kind(wet.point.weatherLabel)} zunächst`:`${kind(wet.point.weatherLabel)} voraussichtlich ${format.from(wet.start)}`;
  let wetEnd=wet.end;
  for(let i=firstWetIndex+1;i<rows.length;i++){
   const row=rows[i];
   if(row.start>wetEnd+15*60000||!knownAmount(row.point)||row.point.precipitation<.05)break;
   wetEnd=Math.max(wetEnd,row.end);
  }
  // A genuine end requires two following contiguous known dry buckets.
  const dry=rows.filter(row=>row.start>=wetEnd-60000&&row.start<=wetEnd+HOUR_MS+60000&&knownAmount(row.point)&&row.point.precipitation<.01);
  if(dry.length>=2&&dry[0].start<=wetEnd+60000&&dry[1].start<=dry[0].end+60000)message+=` · Ende etwa ${format.at(wetEnd)}`;
  events.push(message);
 }
 const gust=rows.filter(row=>typeof row.point.gust==='number'&&Number.isFinite(row.point.gust)&&row.point.gust>SIGNIFICANT_GUST_KT).reduce<(typeof rows)[number]|undefined>((best,row)=>!best||row.point.gust>best.point.gust?row:best,undefined);
 if(gust)events.push(`Markante Böen bis ${format.gust(gust.point.gust)} ${format.at(gust.point.epoch)}`);
 if(events.length)return events.join(' · ');
 const available=rows.some(row=>knownAmount(row.point)||typeof row.point.gust==='number'&&Number.isFinite(row.point.gust));
 return available?'Keine markanten Wetterereignisse in den nächsten 24 Stunden.':'Kurzfristdaten unvollständig.';
}
