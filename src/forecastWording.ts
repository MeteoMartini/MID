function sentenceStart(value:string){const clean=String(value||'').trim();return clean?`${clean.charAt(0).toLocaleUpperCase('de-DE')}${clean.slice(1)}`:''}
export function naturalPossibleEventText(event:string,timing:string){const lead=sentenceStart(timing);return sentenceStart(lead?`${lead} ${event} möglich`:`${event} möglich`)}
export function naturalPossibleEventFallback(event:string,timing:string){const lead=sentenceStart(timing);return sentenceStart(lead?`${lead} ${event}`:`${event} möglich`)}

export function precipitationOutlookText(input:{totalAmount:number;averageProbability:number;maximumProbability:number;elevatedAmountThreshold:number}){
 const total=Math.max(0,Number(input.totalAmount)||0),average=Math.max(0,Math.min(100,Number(input.averageProbability)||0)),maximum=Math.max(0,Math.min(100,Number(input.maximumProbability)||0)),elevated=Math.max(0,Number(input.elevatedAmountThreshold)||0);
 if(total<=.1&&maximum<=5)return'trocken';
 if(average>=60||total>=elevated)return'mit erhöhter Regenneigung';
 if(average<=25&&total<1)return'überwiegend trocken';
 return'mit wechselhaftem Niederschlagsrisiko';
}
