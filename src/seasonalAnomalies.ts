import type {SeasonalMonth,SeasonalPointModel} from './seasonalForecast';
import type {SeasonalTrace} from './seasonalMemberAggregation';
/** Relative anomaly requires a positive reference from the SAME model/month. */
export function precipitationPercent(anomaly:number|null|undefined,climate:number|null|undefined):number|null{
 return anomaly!=null&&climate!=null&&Number.isFinite(anomaly)&&Number.isFinite(climate)&&climate>0?anomaly/climate*100:null;
}
export function relativeSeasonalMonth(month:SeasonalMonth):SeasonalMonth{
 const reference=month.climatePrecipitation??(month.precipitationMean!=null&&month.precipitationAnomaly!=null?month.precipitationMean-month.precipitationAnomaly:null);
 const percent=(supplied:number|null,absolute:number|null)=>supplied!=null&&Number.isFinite(supplied)?supplied:precipitationPercent(absolute,reference);
 return {...month,precipitationAnomalyPercent:percent(month.precipitationAnomalyPercent,month.precipitationAnomaly),precipitationAnomalyPercentLow:percent(month.precipitationAnomalyPercentLow,month.precipitationAnomalyLow),precipitationAnomalyPercentQ25:percent(month.precipitationAnomalyPercentQ25,month.precipitationAnomalyQ25),precipitationAnomalyPercentQ75:percent(month.precipitationAnomalyPercentQ75,month.precipitationAnomalyQ75),precipitationAnomalyPercentHigh:percent(month.precipitationAnomalyPercentHigh,month.precipitationAnomalyHigh)};
}
export function relativeSeasonalModels(models:SeasonalPointModel[]){return models.map(model=>({...model,months:model.months.map(relativeSeasonalMonth)}))}
/** Transform complete raw member months with their associated SEAS5 model climate.
 * Missing references remain gaps; another model's climate is never substituted. */
export function seasonalMemberAnomalies(traces:SeasonalTrace[],references:SeasonalMonth[]):SeasonalTrace[]{
 const byDate=new Map(references.map(month=>[month.date,month]));
 return traces.map(trace=>({...trace,months:trace.months.map(month=>{
  const reference=byDate.get(month.date),climate=reference?.climateTemperature;
  return {...month,temperature:month.temperature!=null&&Number.isFinite(month.temperature)&&climate!=null&&Number.isFinite(climate)?month.temperature-climate:null,precipitation:month.precipitation!=null&&Number.isFinite(month.precipitation)&&reference?.climatePrecipitation!=null?precipitationPercent(month.precipitation-reference.climatePrecipitation,reference.climatePrecipitation):null};
 })}));
}
