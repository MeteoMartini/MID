function normalizedFractionDigits(value:number,fallback:number){
 const numeric=Number(value);
 return Number.isFinite(numeric)?Math.max(0,Math.min(20,Math.trunc(numeric))):fallback;
}

export function formatDecimal(value:number,maximumFractionDigits=1,minimumFractionDigits=0){
 if(!Number.isFinite(value))return'–';
 const normalizedMaximum=normalizedFractionDigits(maximumFractionDigits,1),normalizedMinimum=normalizedFractionDigits(minimumFractionDigits,0);
 const safeMinimum=Math.min(normalizedMinimum,normalizedMaximum),safeMaximum=Math.max(normalizedMinimum,normalizedMaximum);
 return new Intl.NumberFormat('de-DE',{useGrouping:false,minimumFractionDigits:safeMinimum,maximumFractionDigits:safeMaximum}).format(value);
}

export function formatDecimalFixed(value:number,fractionDigits=1){
 return formatDecimal(value,fractionDigits,fractionDigits);
}

export function formatUvi(value:number){
 if(!Number.isFinite(value))return'–';
 return String(Math.max(0,Math.round(value)));
}
