/**
 * MID current air-moisture integrity contract. DWD "Handbuch Flugwetterdienste",
 * Band Tech v4.0, section 6.3 (2024), p.43: vapor pressure over liquid water,
 * different Magnus coefficients above/below 0 °C, repeat cold inversion when
 * positive air temperature produces a subzero dew point.
 *
 * This reconciles *selected* fields; never rewrites a raw observation, changes
 * original model frames, invents a missing zero or represents a derived point
 * as a measured dew point. Relative humidity is WMO water-referenced.
 * https://www.dwd.de/DE/leistungen/lf_11_flugwetterbetriebsdienste/handbuch_band_tech_v4.0_mod.pdf
 */
export type CurrentMoistureOrigin='station'|'model'|'unknown';
export type CurrentMoistureSource='reported'|'calculated'|'unavailable';
export type CurrentMoistureReason='consistent'|'missing-dew-point'|'reported-conflict'|'source-mix'|'time-mismatch'|'insufficient-data';
export type CurrentMoistureInput={
 temperature:unknown;
 relativeHumidity:unknown;
 dewPoint:unknown;
 temperatureOrigin?:CurrentMoistureOrigin;
 humidityOrigin?:CurrentMoistureOrigin;
 dewPointOrigin?:CurrentMoistureOrigin;
 temperatureEpochMs?:number;
 humidityEpochMs?:number;
 dewPointEpochMs?:number;
};
export type CurrentMoistureResult={
 dewPoint:number|undefined;
 relativeHumidity:number|undefined;
 source:CurrentMoistureSource;
 reason:CurrentMoistureReason;
 mixedSources:boolean;
 expectedHumidityFromReported:number|undefined;
};
const WARM={c2:17.08085,c3:234.175},COLD={c2:17.84362,c3:245.425};
const C1=6.10780,MAX_SKEW_MS=30*60*1000,MAX_RH_SPREAD_PP=5;
function numeric(value:unknown):number|undefined{
 return typeof value==='number'&&Number.isFinite(value)?value:undefined;
}
function parameters(temperature:number){return temperature<0?COLD:WARM}
function vaporPressure(temperature:number):number{
 const {c2,c3}=parameters(temperature);
 return C1*Math.exp(c2*temperature/(c3+temperature));
}
function inverseVaporPressure(pressure:number,coeff:{c2:number;c3:number}):number{
 const log=Math.log(pressure/C1);
 return coeff.c3*log/(coeff.c2-log);
}
/** Returns undefined at a valid 0% RH (zero vapor pressure has no finite dew point). */
export function dwdDewPointFromHumidity(temperature:unknown,relativeHumidity:unknown):number|undefined{
 const t=numeric(temperature),rh=numeric(relativeHumidity);
 if(t===undefined||t< -90||t>60||rh===undefined||rh<=0||rh>100)return undefined;
 if(rh===100)return t; // Exact DWD saturation: dew point equals air temperature.
 const pressure=vaporPressure(t)*rh/100;
 if(!Number.isFinite(pressure)||pressure<=0)return undefined;
 let dew=inverseVaporPressure(pressure,parameters(t));
 if(t>=0&&dew<0)dew=inverseVaporPressure(pressure,COLD);
 return Number.isFinite(dew)&&dew<=t+1e-8?Math.min(t,dew):undefined;
}
export function dwdHumidityFromDewPoint(temperature:unknown,dewPoint:unknown):number|undefined{
 const t=numeric(temperature),dew=numeric(dewPoint);
 if(t===undefined||dew===undefined||t< -90||t>60||dew< -100||dew>60)return undefined;
 const rh=100*vaporPressure(dew)/vaporPressure(t);
 return Number.isFinite(rh)?rh:undefined; // never clip a supersaturated/conflicting raw field
}
function timesMatch(a:unknown,b:unknown):boolean{
 const x=numeric(a),y=numeric(b);
 return x===undefined||y===undefined||Math.abs(x-y)<=MAX_SKEW_MS;
}
/**
 * A physically consistent raw dew point is retained only for a coherent source
 * pair and when a present RH agrees within 5 percentage points (sensor tolerance).
 * When selected fields conflict, derive from the *displayed* temperature/RH,
 * label the result, and do not claim it is a measurement. If the T/RH pair is
 * over 30 minutes apart or missing, return unknown rather than a false estimate.
 */
export function reconcileCurrentMoisture(input:CurrentMoistureInput):CurrentMoistureResult{
 const t=numeric(input.temperature),rawRh=numeric(input.relativeHumidity),rawTd=numeric(input.dewPoint);
 const rh=rawRh!==undefined&&rawRh>=0&&rawRh<=100?rawRh:undefined;
 const td=rawTd!==undefined&&rawTd>=-100&&rawTd<=60?rawTd:undefined;
 const origins=[input.temperatureOrigin??'unknown',input.humidityOrigin??'unknown',input.dewPointOrigin??'unknown'];
 const mixedSources=new Set(origins.filter(x=>x!=='unknown')).size>1;
 const blank=(reason:CurrentMoistureReason):CurrentMoistureResult=>({dewPoint:undefined,relativeHumidity:rh,source:'unavailable',reason,mixedSources,expectedHumidityFromReported:undefined});
 if(t===undefined||t< -90||t>60)return blank('insufficient-data');
 const reportedRh=td===undefined?undefined:dwdHumidityFromDewPoint(t,td);
 const validRaw=td!==undefined&&td<=t&&
  (rh===undefined||(reportedRh!==undefined&&Math.abs(reportedRh-rh)<=MAX_RH_SPREAD_PP));
 const coherentDewTime=timesMatch(input.temperatureEpochMs,input.dewPointEpochMs);
 const coherentRhTime=timesMatch(input.temperatureEpochMs,input.humidityEpochMs);
 const rawOriginMatches=input.temperatureOrigin===undefined||input.dewPointOrigin===undefined||
  input.temperatureOrigin==='unknown'||input.dewPointOrigin==='unknown'||
  input.temperatureOrigin===input.dewPointOrigin;
 const rhOriginMatches=rh===undefined||input.temperatureOrigin===undefined||input.humidityOrigin===undefined||
  input.temperatureOrigin==='unknown'||input.humidityOrigin==='unknown'||
  input.temperatureOrigin===input.humidityOrigin;
 if(validRaw&&coherentDewTime&&coherentRhTime&&rawOriginMatches&&rhOriginMatches){
  return{dewPoint:td,relativeHumidity:rh,source:'reported',reason:'consistent',mixedSources,expectedHumidityFromReported:reportedRh};
 }
 if(rh===undefined||rh===0)return blank('insufficient-data');
 if(!coherentRhTime)return blank('time-mismatch');
 const computed=dwdDewPointFromHumidity(t,rh);
 if(computed===undefined)return blank('insufficient-data');
 const reason:CurrentMoistureReason=!coherentDewTime?'time-mismatch':mixedSources?'source-mix':
  td===undefined?'missing-dew-point':'reported-conflict';
 return{dewPoint:computed,relativeHumidity:rh,source:'calculated',reason,mixedSources,expectedHumidityFromReported:reportedRh};
}
