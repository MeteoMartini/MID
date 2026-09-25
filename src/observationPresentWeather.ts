export type ObservedPresentWeather={
  raw?:string;
  numericSynopWw?:number;
  textualPhenomenon?:string;
};

/**
 * Station present-weather values are not Open-Meteo forecast weather codes.
 * Numeric SYNOP ww values stay in their own code space and must never be
 * forwarded to forecast label/pictogram helpers as weather_code.
 */
export function parseObservedPresentWeather(value:unknown,visibilityReportPresent=false):ObservedPresentWeather{
  const raw=String(value??'').trim();
  if(!raw)return{};
  if(visibilityReportPresent)return{raw};
  if(/^\d{1,2}$/.test(raw)){
    const numericSynopWw=Number(raw);
    return Number.isInteger(numericSynopWw)&&numericSynopWw>=0&&numericSynopWw<=99?{raw,numericSynopWw}:{raw};
  }
  return{raw,textualPhenomenon:raw};
}
