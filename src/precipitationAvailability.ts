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
