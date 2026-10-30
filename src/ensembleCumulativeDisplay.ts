/** Cumulative 14-day precipitation: null and missing must never become 0 mm. */
export type CumulativePrecipitationInput={
 bestPrecipitation:number;
 cumulativePrecipitationLow?:number|null;
 cumulativePrecipitationHigh?:number|null;
 cumulativePrecipitationQ25?:number|null;
 cumulativePrecipitationQ75?:number|null;
 cumulativePrecipitationMean?:number|null;
};
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function ensembleCumulativeRainStep(row:CumulativePrecipitationInput,previousBestTotal:number,index:number){
 const bestPrecipitation=finite(previousBestTotal)&&finite(row.bestPrecipitation)?previousBestTotal+row.bestPrecipitation:Number.NaN;
 const hasRange=finite(row.cumulativePrecipitationLow)&&finite(row.cumulativePrecipitationHigh);
 const low=hasRange?Math.min(row.cumulativePrecipitationLow!,row.cumulativePrecipitationHigh!):Number.NaN;
 const high=hasRange?Math.max(row.cumulativePrecipitationLow!,row.cumulativePrecipitationHigh!):Number.NaN;
 const hasQuartiles=hasRange&&finite(row.cumulativePrecipitationQ25)&&finite(row.cumulativePrecipitationQ75);
 const q25=hasQuartiles?Math.max(low,Math.min(row.cumulativePrecipitationQ25!,row.cumulativePrecipitationQ75!)):Number.NaN;
 const q75=hasQuartiles?Math.min(high,Math.max(row.cumulativePrecipitationQ25!,row.cumulativePrecipitationQ75!)):Number.NaN;
 const mean=finite(row.cumulativePrecipitationMean)?row.cumulativePrecipitationMean:Number.NaN;
 const band=hasRange?high-low:Number.NaN;
 return{
  bestPrecipitation,
  precipitationLow:low,precipitationHigh:high,precipitationQ25:q25,precipitationQ75:q75,precipitationMean:mean,
  precipitationMidPlot:hasRange?(low+high)/2:undefined,
  precipitationErrorRange:hasRange?[band/2,band/2] as [number,number]:undefined,
  precipitationBandPlot:band,
  cumulativeLowPlot:hasRange?low:undefined,
  cumulativeBandPlot:hasRange?band:undefined,
  cumulativeQ25Plot:index<7&&hasQuartiles?q25:undefined,
  cumulativeQBandPlot:index<7&&hasQuartiles?Math.max(0,q75-q25):undefined
 };
}
