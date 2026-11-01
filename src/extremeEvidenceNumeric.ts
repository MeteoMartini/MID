/**
 * Presentation-only evidence guard. No model reanalysis, smoothing or fabricated zeroes.
 * Accept numeric JSON fields and non-empty numeric strings; 0 is a valid observation.
 * null, undefined, empty strings, booleans and non-finite values are unavailable.
 */
export function evidenceNumber(raw:unknown):number|null{
 if(typeof raw==='number')return Number.isFinite(raw)?raw:null;
 if(typeof raw==='string'&&raw.trim()!==''&&Number.isFinite(Number(raw)))return Number(raw);
 return null;
}
export function evidenceMagnitude(raw:unknown):number|null{
 const n=evidenceNumber(raw);
 return n!==null&&n>=0?n:null;
}
export function evidencePositiveHours(raw:unknown):number|null{
 const n=evidenceNumber(raw);
 return n!==null&&n>0&&n<=168?n:null;
}
export function evidenceText(raw:unknown,format:(value:number)=>string,{signed=false}:{signed?:boolean}={}):string{
 const n=signed?evidenceNumber(raw):evidenceMagnitude(raw);
 return n===null?'nicht verfügbar':format(n);
}
export function evidenceWindow(raw:unknown):string{
 const n=evidencePositiveHours(raw);
 return n===null?'Zeitraum nicht verfügbar':`${n} h`;
}
type RainEvidence={rainMm?:unknown;windowHours?:unknown;rucPrecipitation6hMm?:unknown;rucMax15mMm?:unknown};
export function rainEvidenceDisplay(metric:RainEvidence):{amount:number|null;windowLabel:string}{
 const base=evidenceMagnitude(metric.rainMm);
 const window=evidencePositiveHours(metric.windowHours);
 const six=evidenceMagnitude(metric.rucPrecipitation6hMm);
 const quarter=evidenceMagnitude(metric.rucMax15mMm);
 // Do not silently relabel 6h accumulation as a shorter native mean window.
 if(six!==null&&(base===null||six>base+.04))return{amount:six,windowLabel:'6 h'};
 if(base!==null)return{amount:base,windowLabel:window===null?'Zeitraum nicht verfügbar':`${window} h`};
 if(quarter!==null)return{amount:quarter,windowLabel:'15 min'};
 return{amount:null,windowLabel:'Zeitraum nicht verfügbar'};
}
export function evidenceRate(raw:unknown,hours:unknown,unit:'mm'|'cm',format:(value:number)=>string):string{
 const value=evidenceMagnitude(raw),window=evidencePositiveHours(hours);
 if(value===null)return'nicht verfügbar';
 if(window===null)return`${format(value)} ${unit} · Zeitraum nicht verfügbar`;
 return`${format(value)} ${unit}/${window} h`;
}
