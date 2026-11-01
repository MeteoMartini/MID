export type ForecastHorizonChoice='short-term'|'seven-day'|'fourteen-day';
export type ForecastHorizonAvailability={shortTerm:boolean;sevenDay:boolean;fourteenDay:boolean};
const choices:readonly ForecastHorizonChoice[]=['short-term','seven-day','fourteen-day'];
export function readPreferredForecastHorizon(read:()=>string|null=()=>localStorage.getItem('mid:forecastCockpit:activeHorizon')):ForecastHorizonChoice|null{
 try{const value=read();return choices.includes(value as ForecastHorizonChoice)?value as ForecastHorizonChoice:null}catch{return null}
}
export function forecastHorizonAvailable(horizon:ForecastHorizonChoice,available:ForecastHorizonAvailability){
 return horizon==='short-term'?available.shortTerm:horizon==='seven-day'?available.sevenDay:available.fourteenDay;
}
/** Preserve user intent through temporary data loss; navigation takes priority while explicitly active. */
export function restorableForecastHorizon(preferred:ForecastHorizonChoice|null,current:ForecastHorizonChoice,available:ForecastHorizonAvailability,navigation?:ForecastHorizonChoice):ForecastHorizonChoice|null{
 if(navigation&&forecastHorizonAvailable(navigation,available))return null;
 return preferred&&preferred!==current&&forecastHorizonAvailable(preferred,available)?preferred:null;
}
