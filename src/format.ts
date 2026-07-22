export function formatDecimal(value:number,maximumFractionDigits=1,minimumFractionDigits=0){
 if(!Number.isFinite(value))return'–';
 return new Intl.NumberFormat('de-DE',{useGrouping:false,minimumFractionDigits,maximumFractionDigits}).format(value);
}

export function formatDecimalFixed(value:number,fractionDigits=1){
 return formatDecimal(value,fractionDigits,fractionDigits);
}
