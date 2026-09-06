/**
 * Temporal presentation helpers for hourly event cards.
 * Accumulations describe the preceding interval; instantaneous weather state
 * at the interval end must not retroactively overwrite a dry interval.
 */
export type EventIntervalSkyInput={cloud?:number|null;code?:number|null;isDay?:boolean};

export function eventIntervalSkyCode(hour:EventIntervalSkyInput,sunshineDuration:number|null,intervalSeconds:number){
 const sunshineShare=sunshineDuration!=null&&Number.isFinite(sunshineDuration)&&intervalSeconds>0?Math.max(0,Math.min(1,sunshineDuration/intervalSeconds)):null,rawCloud=hour.cloud==null?Number.NaN:Number(hour.cloud),cloud=Number.isFinite(rawCloud)?rawCloud:null;
 if(hour.isDay!==false&&sunshineShare!==null&&sunshineShare>=.82)return cloud!==null&&cloud>35?1:0;
 if(cloud!==null){if(cloud<=20)return 0;if(cloud<=50)return 1;if(cloud<=82)return 2;return 3}
 const rawCode=hour.code==null?Number.NaN:Number(hour.code),code=Number.isFinite(rawCode)?Math.round(rawCode):2;return [0,1,2,3,45,48].includes(code)?code:2;
}

export function eventIntervalHasPrecipitation(precipitation:number|null,rain:number|null,showers:number|null,snowfall:number|null){
 return Math.max(0,Number(precipitation)||0)>=.01||Math.max(0,Number(rain)||0)>=.05||Math.max(0,Number(showers)||0)>=.05||Math.max(0,Number(snowfall)||0)>=.05;
}
