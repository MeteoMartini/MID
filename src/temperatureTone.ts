export type DailyTemperatureKind='min'|'max';
export type DailyTemperatureTone={
 color:string;
 background:string;
 border:string;
 anomaly:number|null;
 title:string;
};

function clamp01(value:number){return Math.min(1,Math.max(0,value))}
function decimal(value:number){return value.toFixed(1).replace('.',',')}
function toneForToken(token:string,intensity:number){
 const bounded=clamp01(intensity);
 const textShare=Math.round(78+bounded*20);
 const backgroundShare=Math.round(7+bounded*22);
 const borderShare=Math.round(22+bounded*38);
 return{
  color:`color-mix(in srgb,${token} ${textShare}%,var(--text))`,
  background:`color-mix(in srgb,${token} ${backgroundShare}%,transparent)`,
  border:`color-mix(in srgb,${token} ${borderShare}%,transparent)`
 };
}

export function dailyTemperatureTone(value:number,climateMean:number|undefined,kind:DailyTemperatureKind):DailyTemperatureTone{
 const validValue=Number.isFinite(value),validMean=Number.isFinite(climateMean),anomaly=validValue&&validMean?value-Number(climateMean):null;
 const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)';
 const label=kind==='max'?'Tmax':'Tmin';
 const intensity=anomaly===null?.18:clamp01(Math.abs(anomaly)/7);
 const tone=toneForToken(token,intensity);
 return{...tone,anomaly,title:anomaly===null?(kind==='max'?'Tageshöchsttemperatur':'Tagestiefsttemperatur'):`${label} ${anomaly>=0?'+':''}${decimal(anomaly)} K zum Klimamittel`};
}

export function hourlyTemperatureTone(value:number,climateMin:number|undefined,climateMax:number|undefined):DailyTemperatureTone{
 const validValue=Number.isFinite(value),validMin=Number.isFinite(climateMin),validMax=Number.isFinite(climateMax)&&Number(climateMax)>Number(climateMin);
 if(!validValue||!validMin||!validMax){
  const tone=toneForToken('var(--param-temperature)',.22);
  return{...tone,anomaly:null,title:Number.isFinite(value)?`Temperatur · ${Math.round(value)} °C`:'Temperatur'};
 }
 const min=Number(climateMin),max=Number(climateMax),fraction=clamp01((value-min)/(max-min)),kind:DailyTemperatureKind=fraction<.5?'min':'max',reference=kind==='min'?min:max,anomaly=value-reference,edgeStrength=clamp01(Math.abs(fraction-.5)*2),token=kind==='min'?'var(--param-temperature-min)':'var(--param-temperature-max)',tone=toneForToken(token,.18+.82*edgeStrength),label=kind==='min'?'klimatologischem Tmin':'klimatologischem Tmax';
 return{...tone,anomaly,title:`Temperatur ${decimal(Math.abs(anomaly))} K ${anomaly>=0?'über':'unter'} ${label}`};
}
