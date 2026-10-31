/** Missing precipitation values must never be interpreted as dry weather. */
export function isAvailablePrecipitation(value:unknown):value is number {
 return typeof value==='number'&&Number.isFinite(value)&&value>=0;
}
export function isAvailableProbability(value:unknown):value is number {
 return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100;
}
/** Every included interval must carry a finite, nonnegative amount. */
export function sumCompletePrecipitation(values:readonly unknown[]):number {
 if(!values.length||values.some(value=>!isAvailablePrecipitation(value)))return Number.NaN;
 return values.reduce<number>((sum,value)=>sum+(value as number),0);
}
export function maxCompleteProbability(values:readonly unknown[]):number {
 if(!values.length||values.some(value=>!isAvailableProbability(value)))return Number.NaN;
 return Math.max(...values.map(value=>value as number));
}
export function scaleAvailablePrecipitation(value:unknown,fraction:number):number {
 if(!isAvailablePrecipitation(value)||!Number.isFinite(fraction)||fraction<0||fraction>1)return Number.NaN;
 return value*fraction;
}
export function precipitationRateIfAvailable(value:unknown,minutes:number):number {
 if(!isAvailablePrecipitation(value)||!Number.isFinite(minutes)||minutes<=0)return Number.NaN;
 return value*60/minutes;
}
export function inactivePrecipitationLabel(amount:unknown,probability:unknown):string {
 if(!isAvailablePrecipitation(amount)||!isAvailableProbability(probability))return 'Niederschlagsdaten unvollständig';
 if(amount>0)return 'Geringe Niederschlagsmenge';
 if(probability>0)return `Überwiegend trocken · ${Math.round(probability)} % Niederschlagswahrscheinlichkeit`;
 return 'Trocken';
}

/** Hard boundaries: finite precipitation plot points must not bridge unknown slots. */
export function contiguousFinitePrecipitationSegments(points:readonly {x:number;y:number}[]):{x:number;y:number}[][] {
 const groups:{x:number;y:number}[][]=[];
 let current:{x:number;y:number}[]=[];
 for(const point of points){
  if(Number.isFinite(point.x)&&Number.isFinite(point.y)){current.push(point)}
  else if(current.length){groups.push(current);current=[]}
 }
 if(current.length)groups.push(current);
 return groups;
}

/** Detect dropped or overlapping input intervals before producing any aggregate amount or PoP. */
export function completePrecipitationIntervalCoverage(intervals:readonly {start:number;end:number}[]):boolean {
 if(!intervals.length)return false;
 const sorted=[...intervals].sort((a,b)=>a.start-b.start);
 return sorted.every((interval,index)=>Number.isFinite(interval.start)&&Number.isFinite(interval.end)&&interval.end>interval.start&&(index===0||Math.abs(interval.start-sorted[index-1].end)<=1000));
}
