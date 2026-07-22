export type PrecipType='none'|'drizzle'|'freezingDrizzle'|'rain'|'freezingRain'|'showers'|'snow'|'snowGrains'|'snowShowers'|'sleet'|'sleetShowers'|'thunderstorm'|'thunderstormHail';

export type PrecipSample={
 time?:string;
 epoch?:number;
 timezone?:string;
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
};

export type PrecipitationParts={
 total:number;
 type:PrecipType;
 label:string;
 code:number;
};

export const WMO_PRECIP_TYPE:Partial<Record<number,PrecipType>>={
 51:'drizzle',53:'drizzle',55:'drizzle',
 56:'freezingDrizzle',57:'freezingDrizzle',
 61:'rain',63:'rain',65:'rain',
 66:'freezingRain',67:'freezingRain',
 68:'sleet',69:'sleet',
 71:'snow',73:'snow',75:'snow',77:'snowGrains',
 80:'showers',81:'showers',82:'showers',
 83:'sleetShowers',84:'sleetShowers',
 85:'snowShowers',86:'snowShowers',
 95:'thunderstorm',97:'thunderstorm',
 96:'thunderstormHail',99:'thunderstormHail'
};

const PRECIP_LABEL:Record<Exclude<PrecipType,'none'>,string>={
 drizzle:'Sprühregen',
 freezingDrizzle:'Gefrierender Sprühregen',
 rain:'Regen',
 freezingRain:'Gefrierender Regen',
 showers:'Regenschauer',
 snow:'Schneefall',
 snowGrains:'Schneegriesel',
 snowShowers:'Schneeschauer',
 sleet:'Schneeregen',
 sleetShowers:'Schneeregenschauer',
 thunderstorm:'Gewitterniederschlag',
 thunderstormHail:'Gewitter mit Hagel'
};

/**
 * Bestimmt die Niederschlagsform für Diagramm, Legende und Stunden-Tooltip.
 * Ein vorhandener WMO-Wettercode ist die maßgebliche Phasenangabe und wird
 * deshalb nicht durch parallel gelieferte Mengenfelder umgedeutet. Das ist
 * besonders für Schnee wichtig: precipitation enthält dort das flüssige
 * Wasseräquivalent und darf nicht als zusätzlicher Regenanteil gelten.
 */
export function precipitationParts(h:PrecipSample):PrecipitationParts{
 const total=Math.max(0,Number(h.precipitation)||0);
 const rainValue=Math.max(0,Number(h.rain)||0);
 const showerValue=Math.max(0,Number(h.showers)||0);
 const snowCm=Math.max(0,Number(h.snowfall)||0);
 const code=Math.round(Number(h.code)||0);
 const measurable=total>=.01||rainValue>=.01||showerValue>=.01||snowCm>=.01;
 if(!measurable)return{total,type:'none',label:'kein Niederschlag',code};

 const codedType=WMO_PRECIP_TYPE[code];
 const hasRain=rainValue>=.05;
 const hasShowers=showerValue>=.05;
 const hasSnow=snowCm>=.05;
 let type:PrecipType;

 // Der WMO-Code steuert dieselbe Niederschlagsform wie Wettertext und Symbol.
 // Nur bei fehlendem/ungeeignetem Code wird aus den Mengenfeldern abgeleitet.
 if(codedType)type=codedType;
 else if(hasSnow&&hasShowers)type='sleetShowers';
 else if(hasSnow&&hasRain)type='sleet';
 else if(hasSnow)type='snow';
 else if(hasShowers)type='showers';
 else if(hasRain||total>=.01)type='rain';
 else type='none';

 if(type==='none')return{total,type,label:'kein Niederschlag',code};
 const amount=type==='snow'||type==='snowShowers'||type==='snowGrains'
  ?`${snowCm.toFixed(1)} cm`
  :type==='sleet'||type==='sleetShowers'
   ?`${total.toFixed(1)} mm · ${snowCm.toFixed(1)} cm`
   :`${total.toFixed(1)} mm`;
 return{total,type,label:`${PRECIP_LABEL[type]} ${amount}`,code};
}

const PRECIP_TYPE_ORDER:PrecipType[]=['drizzle','freezingDrizzle','rain','freezingRain','showers','sleet','sleetShowers','snow','snowGrains','snowShowers','thunderstorm','thunderstormHail'];

export function presentPrecipTypes(series:{type:PrecipType}[]){
 return PRECIP_TYPE_ORDER.filter(type=>series.some(item=>item.type===type)) as Exclude<PrecipType,'none'>[];
}
