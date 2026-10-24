/** Display-only rain-rate categories in mm/h. They are NOT DWD warning levels. */
export type RadarBarIntensity='light'|'moderate'|'strong'|'missing';
export type RadarBarScenario='observed'|'low'|'medium'|'high'|'unknown';
export function radarBarIntensity(rate:number,missing=false):RadarBarIntensity{
 if(missing||!Number.isFinite(rate)||rate<0)return 'missing';
 return rate>=10?'strong':rate>=2.5?'moderate':'light';
}
/** hitProbability is the uncalibrated member hit fraction, not a validated probability forecast.
 * Never fill absent uncertainty data with 0 or 100. Observed frames have no forecast uncertainty. */
export function radarBarScenario(future:boolean,hitProbability:number|undefined):RadarBarScenario{
 if(!future)return 'observed';
 if(hitProbability===undefined||!Number.isFinite(hitProbability)||hitProbability<0||hitProbability>100)return 'unknown';
 return hitProbability<35?'low':hitProbability<70?'medium':'high';
}
export const radarBarIntensityLabel=(band:RadarBarIntensity)=>({light:'leicht',moderate:'mäßig',strong:'stark',missing:'nicht bestimmbar'}[band]);
