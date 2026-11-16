/** Climate values must never coerce Missing/NoData into calm (0). */
export type ClimateWindMode='wind'|'gust';
export type ClimateWindSample={
 windDirection?:number|null;
 windMean?:number|null;
 windMaxMean?:number|null;
 gustMaxMean?:number|null;
};
export function climateFiniteNumber(value:unknown):number{
 return typeof value==='number'&&Number.isFinite(value)?value:Number.NaN;
}
/** Only fully evidenced direction/speed pairs contribute to the directional wind rose. */
export function climateWindSample(day:ClimateWindSample,mode:ClimateWindMode):{direction:number;speed:number}|null{
 const direction=climateFiniteNumber(day.windDirection);
 const speed=climateFiniteNumber(mode==='gust'?day.gustMaxMean:day.windMean??day.windMaxMean);
 if(!Number.isFinite(direction)||direction<0||direction>360||!Number.isFinite(speed)||speed<0)return null;
 return{direction:direction===360?0:direction,speed};
}
/** Availability changes chart display but must not overwrite an explicit user preference. */
export function climateWindDisplayMode(preferred:ClimateWindMode,gustAvailable:boolean):ClimateWindMode{
 return preferred==='gust'&&gustAvailable?'gust':'wind';
}
