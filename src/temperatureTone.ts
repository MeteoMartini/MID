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
 if(anomaly===null)return kind==='min'?.52:.62;
 const scaled=clamp01((anomaly+7)/14);
 // Tmin: kälter => stärker/dunkler blau, milder => heller/entsättigter blau.
 // Tmax: kühler => heller/entsättigter rot, wärmer => stärker/dunkler rot.
 return kind==='min'?1-scaled:clamp01(.14+scaled*.86);
}
function dailyTone(token:string,intensity:number){
 const bounded=clamp01(intensity),textShare=Math.round(48+bounded*50),backgroundShare=Math.round(4+bounded*28),borderShare=Math.round(16+bounded*46);
 return{
  color:`color-mix(in srgb,${token} ${textShare}%,var(--text))`,
  background:`color-mix(in srgb,${token} ${backgroundShare}%,transparent)`,
  border:`color-mix(in srgb,${token} ${borderShare}%,transparent)`
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
