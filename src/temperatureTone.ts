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
function dailyIntensity(anomaly:number|null,kind:DailyTemperatureKind){
 if(anomaly===null)return kind==='min'?.56:.62;
 // Kleine Abweichungen um das Klimamittel sollen bereits sichtbar reagieren.
 // Wurzelkennlinie: ±0,5…1 K verändert die Tonstufe deutlich, große Abweichungen sättigen sanft.
 const signed=Math.max(-1,Math.min(1,anomaly/3));
 const response=Math.sign(signed)*Math.sqrt(Math.abs(signed));
 const directional=kind==='min'?-response:response;
 return clamp01(.52+directional*.43);
}
function dailyTone(token:string,intensity:number){
 const bounded=clamp01(intensity),textShare=Math.round(72+bounded*27),backgroundShare=Math.round(9+bounded*19),borderShare=Math.round(24+bounded*34);
 return{
  color:`color-mix(in srgb,${token} ${textShare}%,var(--text))`,
  background:`color-mix(in srgb,${token} ${backgroundShare}%,transparent)`,
  border:`color-mix(in srgb,${token} ${borderShare}%,var(--border))`
 };
}
function neutralHourlyTone(){
 return{
  color:'var(--text)',
  background:'color-mix(in srgb,var(--text) 4%,transparent)',
  border:'color-mix(in srgb,var(--text) 12%,transparent)'
 };
}

export function dailyTemperatureTone(value:number,climateMean:number|undefined,kind:DailyTemperatureKind):DailyTemperatureTone{
 const validValue=Number.isFinite(value),validMean=Number.isFinite(climateMean),anomaly=validValue&&validMean?value-Number(climateMean):null;
 const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)',label=kind==='max'?'Tmax':'Tmin',tone=dailyTone(token,dailyIntensity(anomaly,kind));
 return{...tone,anomaly,title:anomaly===null?(kind==='max'?'Tageshöchsttemperatur':'Tagestiefsttemperatur'):`${label} ${anomaly>=0?'+':''}${decimal(anomaly)} K zum Klimamittel`};
}

export function hourlyTemperatureTone(value:number,climateMin:number|undefined,climateMax:number|undefined):DailyTemperatureTone{
 void climateMin;void climateMax;
 const tone=neutralHourlyTone();
 return{...tone,anomaly:null,title:Number.isFinite(value)?`Temperatur · ${Math.round(value)} °C`:'Temperatur'};
}
