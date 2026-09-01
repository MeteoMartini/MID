export type DailyTemperatureKind='min'|'max';
export type DailyTemperatureTone={
 color:string;
 background:string;
 border:string;
 anomaly:number|null;
 title:string;
};

export function dailyTemperatureTone(value:number,climateMean:number|undefined,kind:DailyTemperatureKind):DailyTemperatureTone{
 const validValue=Number.isFinite(value),validMean=Number.isFinite(climateMean),anomaly=validValue&&validMean?value-Number(climateMean):null;
 const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)';
 const label=kind==='max'?'Tmax':'Tmin';
 return{color:token,background:`color-mix(in srgb,${token} 10%,transparent)`,border:`color-mix(in srgb,${token} 25%,transparent)`,anomaly,title:anomaly===null?(kind==='max'?'Tageshöchsttemperatur':'Tagestiefsttemperatur'):`${label} ${anomaly>=0?'+':''}${anomaly.toFixed(1).replace('.',',')} K zum Klimamittel`};
}
