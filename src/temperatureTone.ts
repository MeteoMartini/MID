export type DailyTemperatureKind='min'|'max';
export type DailyTemperatureTone={
 color:string;
 background:string;
 border:string;
 anomaly:number|null;
 title:string;
};

function clamp(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}
function mixChannel(a:number,b:number,ratio:number){return Math.round(a+(b-a)*ratio)}
function mixColor(a:[number,number,number],b:[number,number,number],ratio:number){
 const t=clamp(ratio,0,1),rgb:[number,number,number]=[mixChannel(a[0],b[0],t),mixChannel(a[1],b[1],t),mixChannel(a[2],b[2],t)];
 return{hex:`#${rgb.map(value=>value.toString(16).padStart(2,'0')).join('')}`,rgba:(alpha:number)=>`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`};
}

export function dailyTemperatureTone(value:number,climateMean:number|undefined,kind:DailyTemperatureKind):DailyTemperatureTone{
 const validValue=Number.isFinite(value),validMean=Number.isFinite(climateMean),anomaly=validValue&&validMean?value-Number(climateMean):null;
 if(kind==='max'){
  const ratio=anomaly===null?.36:clamp((anomaly+3)/12,0,1),mixed=mixColor([246,158,69],[174,30,28],ratio);
  return{color:mixed.hex,background:mixed.rgba(.11),border:mixed.rgba(.2),anomaly,title:anomaly===null?'Tageshöchsttemperatur':`Tmax ${anomaly>=0?'+':''}${anomaly.toFixed(1).replace('.',',')} K zum Klimamittel`};
 }
 const coldStrength=anomaly===null?.4:clamp((-anomaly+3)/12,0,1),mixed=mixColor([99,188,255],[28,76,177],coldStrength);
 return{color:mixed.hex,background:mixed.rgba(.1),border:mixed.rgba(.18),anomaly,title:anomaly===null?'Tagestiefsttemperatur':`Tmin ${anomaly>=0?'+':''}${anomaly.toFixed(1).replace('.',',')} K zum Klimamittel`};
}
