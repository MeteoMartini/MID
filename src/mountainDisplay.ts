export function mountainSnowfallLabel(value:unknown):string{
 if(value===null||value===undefined||(typeof value==='string'&&value.trim()===''))return'–';
 const amount=typeof value==='number'?value:typeof value==='string'?Number(value):Number.NaN;
 if(!Number.isFinite(amount))return'–';
 if(amount<0)return'–';
 if(amount===0)return'0 cm';
 if(amount<1)return'<1 cm';
 return`${Math.round(amount)} cm`;
}
/** Knot thresholds: Bft 6 / 8 / 10. Independent of the chosen display unit. */
export function mountainWindIntensityClass(wind:number,gust:number):string{
 const values=[wind,gust].filter(value=>Number.isFinite(value)&&value>=0);
 const peak=values.length?Math.max(...values):NaN;
 return peak>=48?'mountain-wind-heavy':peak>=34?'mountain-wind-moderate':peak>=22?'mountain-wind-light':'';
}
/** Amount per displayed interval (hour, period or day), in centimetres. */
export function mountainSnowIntensityClass(amount:number):string{
 if(!Number.isFinite(amount)||amount<=0)return'';
 return amount>=20?'mountain-snow-heavy':amount>=5?'mountain-snow-moderate':amount>=1?'mountain-snow-light':'mountain-snow-trace';
}
