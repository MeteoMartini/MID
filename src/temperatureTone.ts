export type DailyTemperatureKind='min'|'max';

export type EcmwfTemperatureTone={
 color:string;
 background:string;
 border:string;
 title:string;
};

type EcmwfTemperatureStop={value:number;color:[number,number,number]};
// ECMWF-inspirierte 2-m-Temperaturpalette: kalte Werte blau/violett, milde Werte
// grün/gelb, warme Werte orange/rot. Die Kennlinie ist wertbasiert, nicht klimatologisch.
const ECMWF_TEMPERATURE_STOPS:EcmwfTemperatureStop[]=[
 {value:-30,color:[87,53,151]},
 {value:-20,color:[68,83,178]},
 {value:-10,color:[56,132,205]},
 {value:0,color:[69,177,204]},
 {value:5,color:[82,188,151]},
 {value:10,color:[157,201,83]},
 {value:15,color:[236,201,55]},
 {value:20,color:[244,151,42]},
 {value:25,color:[234,91,39]},
 {value:30,color:[210,54,49]},
 {value:35,color:[164,34,49]},
 {value:40,color:[112,21,47]}
];
function mixChannel(a:number,b:number,ratio:number){return Math.round(a+(b-a)*ratio)}
export function ecmwfTemperatureColor(value:number){
 const numeric=Number(value);if(!Number.isFinite(numeric))return'var(--param-temperature)';
 if(numeric<=ECMWF_TEMPERATURE_STOPS[0].value){const [r,g,b]=ECMWF_TEMPERATURE_STOPS[0].color;return`rgb(${r} ${g} ${b})`}
 const last=ECMWF_TEMPERATURE_STOPS[ECMWF_TEMPERATURE_STOPS.length-1];if(numeric>=last.value){const[r,g,b]=last.color;return`rgb(${r} ${g} ${b})`}
 for(let index=0;index<ECMWF_TEMPERATURE_STOPS.length-1;index++){
  const a=ECMWF_TEMPERATURE_STOPS[index],b=ECMWF_TEMPERATURE_STOPS[index+1];if(numeric<a.value||numeric>b.value)continue;
  const ratio=(numeric-a.value)/Math.max(.001,b.value-a.value),r=mixChannel(a.color[0],b.color[0],ratio),g=mixChannel(a.color[1],b.color[1],ratio),blue=mixChannel(a.color[2],b.color[2],ratio);return`rgb(${r} ${g} ${blue})`;
 }
 return'var(--param-temperature)';
}
export function ecmwfTemperatureTone(value:number):EcmwfTemperatureTone{
 const color=ecmwfTemperatureColor(value),rounded=Number.isFinite(Number(value))?`${Math.round(Number(value))} °C`:'–';
 return{color,background:`color-mix(in srgb,${color} 10%,transparent)`,border:`color-mix(in srgb,${color} 46%,var(--border))`,title:`Temperatur ${rounded} · ECMWF-Farbskala`};
}
export type DailyTemperatureTone={
 color:string;
 background:string;
 border:string;
 anomaly:number|null;
 title:string;
};

function clamp01(value:number){return Math.min(1,Math.max(0,value))}
function decimal(value:number){return value.toFixed(1).replace('.',',')}
export function dailyTemperatureAnomalyLabel(anomaly:number|null){return anomaly===null||!Number.isFinite(anomaly)?'–':`${anomaly>=0?'+':''}${decimal(anomaly)} K`}
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
 const bounded=clamp01(intensity),textShare=Math.round(74+bounded*24),backgroundShare=Math.round(5+bounded*11),borderShare=Math.round(20+bounded*26);
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
 return{...tone,anomaly,title:anomaly===null?(kind==='max'?'Tageshöchsttemperatur':'Tagestiefsttemperatur'):`${label} ${dailyTemperatureAnomalyLabel(anomaly)} zum Klimamittel`};
}

export function hourlyTemperatureTone(value:number,climateMin:number|undefined,climateMax:number|undefined):DailyTemperatureTone{
 void climateMin;void climateMax;
 const tone=neutralHourlyTone();
 return{...tone,anomaly:null,title:Number.isFinite(value)?`Temperatur · ${Math.round(value)} °C`:'Temperatur'};
}
