export function mountainSnowfallLabel(value:unknown):string{
 if(value===null||value===undefined||(typeof value==='string'&&value.trim()===''))return'–';
 const amount=typeof value==='number'?value:typeof value==='string'?Number(value):Number.NaN;
 if(!Number.isFinite(amount))return'–';
 if(amount<0)return'–';
 if(amount===0)return'0 cm';
 if(amount<1)return'<1 cm';
 return`${Math.round(amount)} cm`;
}

export function mountainSnowfallClass(value:unknown):string{
 const amount=typeof value==='number'?value:typeof value==='string'&&value.trim()!==''?Number(value):Number.NaN;
 if(!Number.isFinite(amount)||amount<=.05)return'';
 if(amount<1)return'mountain-snow-trace';
 if(amount<3)return'mountain-snow-light';
 if(amount<8)return'mountain-snow-moderate';
 return'mountain-snow-heavy';
}