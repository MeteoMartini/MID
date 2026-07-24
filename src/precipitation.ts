function formatDecimalFixed(value:number,fractionDigits=1){return new Intl.NumberFormat('de-DE',{useGrouping:false,minimumFractionDigits:fractionDigits,maximumFractionDigits:fractionDigits}).format(value)}

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
 humidity?:number;
 cloud?:number;
 lowCloud?:number;
};

export type PrecipitationParts={
 total:number;
 type:PrecipType;
 label:string;
 weatherLabel:string;
 code:number;
 displayCode:number;
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
function finiteOrNaN(value:unknown){const number=Number(value);return Number.isFinite(number)?number:Number.NaN}

function drizzlePlausible(h:PrecipSample,total:number){
 const humidity=finiteOrNaN(h.humidity);
 const lowCloud=finiteOrNaN(h.lowCloud);
 const cloud=finiteOrNaN(h.cloud);
 const humidEnough=Number.isFinite(humidity)&&humidity>=88;
 const stratusSignal=Number.isFinite(lowCloud)?lowCloud>=70:Number.isFinite(cloud)&&cloud>=85;
 const weakStratiformRate=total<2.5&&Math.max(0,Number(h.showers)||0)<.05;
 return humidEnough&&stratusSignal&&weakStratiformRate;
}

function rainIntensity(total:number){
 if(total>=50)return'sehr starker';
 if(total>=10)return'starker';
 if(total>=2.5)return'mäßiger';
 return'leichter';
}

function drizzleIntensity(total:number){
 if(total>=.5)return'starker';
 if(total>=.1)return'mäßiger';
 return'leichter';
}

function representativePrecipitationCode(type:PrecipType,total:number,snowCm:number){
 if(type==='drizzle')return total>=.5?55:total>=.1?53:51;
 if(type==='freezingDrizzle')return total>=.5?57:56;
 if(type==='rain')return total>=10?65:total>=2.5?63:61;
 if(type==='freezingRain')return total>=2.5?67:66;
 if(type==='showers')return total>=10?82:total>=2.5?81:80;
 if(type==='snow')return snowCm>=2?75:snowCm>=.5?73:71;
 if(type==='snowGrains')return 77;
 if(type==='snowShowers')return snowCm>=2?86:85;
 if(type==='sleet')return total>=2.5?69:68;
 if(type==='sleetShowers')return total>=2.5?84:83;
 if(type==='thunderstormHail')return 96;
 if(type==='thunderstorm')return 95;
 return 3;
}

/**
 * Bestimmt die Niederschlagsform für Diagramm, Legende und Stunden-Tooltip.
 * WMO-Codes bleiben die primäre Phasenangabe. Sprühregen-Codes 51–55 werden
 * jedoch nur übernommen, wenn zugleich eine feuchte, tiefe Stratuslage und
 * eine schwache stratiforme Niederschlagsrate vorliegen. Fehlt diese
 * Plausibilität, wird nach DWD/WMO als Regen klassifiziert.
 */
export function precipitationParts(h:PrecipSample):PrecipitationParts{
 const total=Math.max(0,Number(h.precipitation)||0);
 const rainValue=Math.max(0,Number(h.rain)||0);
 const showerValue=Math.max(0,Number(h.showers)||0);
 const snowCm=Math.max(0,Number(h.snowfall)||0);
 const code=Math.round(Number(h.code)||0);
 const measurable=total>=.01||rainValue>=.01||showerValue>=.01||snowCm>=.01;
 if(!measurable)return{total,type:'none',label:'kein Niederschlag',weatherLabel:'kein Niederschlag',code,displayCode:code};

 const codedType=WMO_PRECIP_TYPE[code];
 const hasRain=rainValue>=.05;
 const hasShowers=showerValue>=.05;
 const hasSnow=snowCm>=.05;
 let type:PrecipType;

 if(codedType==='drizzle')type=drizzlePlausible(h,total)?'drizzle':'rain';
 else if(codedType)type=codedType;
 else if(hasSnow&&hasShowers)type='sleetShowers';
 else if(hasSnow&&hasRain)type='sleet';
 else if(hasSnow)type='snow';
 else if(hasShowers)type='showers';
 else if(hasRain||total>=.01)type='rain';
 else type='none';

 if(type==='none')return{total,type,label:'kein Niederschlag',weatherLabel:'kein Niederschlag',code,displayCode:code};
 const amount=type==='snow'||type==='snowShowers'||type==='snowGrains'
  ?`${formatDecimalFixed(snowCm,1)} cm`
  :type==='sleet'||type==='sleetShowers'
   ?`${formatDecimalFixed(total,1)} mm · ${formatDecimalFixed(snowCm,1)} cm`
   :`${formatDecimalFixed(total,1)} mm`;
 const weatherLabel=type==='rain'
  ?`${rainIntensity(total)} Regen`
  :type==='drizzle'
   ?`${drizzleIntensity(total)} Sprühregen`
   :PRECIP_LABEL[type];
 const displayCode=codedType===type
  ?code
  :representativePrecipitationCode(type,total,snowCm);
 const label=`${weatherLabel} ${amount}`;
 return{total,type,label,weatherLabel,code,displayCode};
}

const PRECIP_TYPE_ORDER:PrecipType[]=['drizzle','freezingDrizzle','rain','freezingRain','showers','sleet','sleetShowers','snow','snowGrains','snowShowers','thunderstorm','thunderstormHail'];

export function presentPrecipTypes(series:{type:PrecipType}[]){
 return PRECIP_TYPE_ORDER.filter(type=>series.some(item=>item.type===type)) as Exclude<PrecipType,'none'>[];
}
