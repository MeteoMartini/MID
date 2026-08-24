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
 temperature?:number;
 dewPoint?:number;
 humidity?:number;
 cloud?:number;
 lowCloud?:number;
 cloudBaseHft?:number;
 ceilingHft?:number;
 cape?:number;
 liftedIndex?:number;
 convectiveInhibition?:number;
 sunshineDuration?:number|null;
 isDay?:boolean;
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

export type ForecastPrecipitationConsistencyInput={
 precipitation:number;
 rain?:number;
 showers?:number;
 snowfall?:number;
 probability:number;
 code:number;
 temperature?:number;
 dewPoint?:number;
 cloud?:number;
 lowCloud?:number;
 humidity?:number;
 cape?:number;
 liftedIndex?:number;
 convectiveInhibition?:number;
 sunshineDuration?:number|null;
 isDay?:boolean;
 leadHours?:number;
 observed?:boolean;
 probabilityUnavailable?:boolean;
};

export type PrecipitationCharacter='convective'|'stratiform'|'mixed'|'indeterminate';
export type PrecipitationCharacterEvidence={
 character:PrecipitationCharacter;
 convectiveScore:number;
 stratiformScore:number;
 convectiveFraction:number;
 directPartition:boolean;
};

export type ForecastPrecipitationConsistency={
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
 traceSuppressed:boolean;
 suppressionReason?:'probability'|'weak-distant-signal'|'sky-contradiction';
 phaseAdjusted?:boolean;
};

const UNSUPPORTED_FORECAST_MAX_PROBABILITY=5;
const WEAK_FORECAST_AMOUNT_MAX_MM=.35;

function dryForecastWeatherCode(code:number,cloud:unknown){
 if([45,48].includes(code))return code;
 const cover=Number(cloud);
 if(!Number.isFinite(cover))return 3;
 if(cover<=15)return 0;
 if(cover<=45)return 1;
 if(cover<=80)return 2;
 return 3;
}
function deterministicSignalMinimumProbability(leadHours:unknown){
 const lead=Math.max(0,Number(leadHours)||0);
 return lead<=24?10:lead<=72?15:20;
}
function stratiformCode(code:number){return[51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77].includes(code)}
function showerCode(code:number){return[80,81,82,83,84,85,86,95,96,97,99].includes(code)}
function showerEquivalentCode(code:number,total:number,snowfall:number){
 if([71,73,75,77].includes(code)||snowfall>=.05)return snowfall>=2?86:85;
 if([68,69].includes(code))return total>=2.5?84:83;
 if([95,96,97,99].includes(code))return code;
 return total>=10?82:total>=2.5?81:80;
}
function stratiformEquivalentCode(code:number,total:number,snowfall:number){
 if([85,86].includes(code)||snowfall>=.05)return snowfall>=2?75:snowfall>=.5?73:71;
 if([83,84].includes(code))return total>=2.5?69:68;
 if([95,96,97,99].includes(code))return code;
 return total>=10?65:total>=2.5?63:61;
}
function finiteNumber(value:unknown){const number=Number(value);return Number.isFinite(number)?number:Number.NaN}
function inhibitionMagnitude(value:unknown){const number=finiteNumber(value);return Number.isFinite(number)?Math.abs(number):Number.NaN}
function relativeHumidityFromDewPoint(temperature:number,dewPoint:number){const saturation=(value:number)=>Math.exp(17.625*value/(243.04+value));return Math.max(1,Math.min(100,100*saturation(dewPoint)/saturation(temperature)))}
function approximateWetBulbTemperature(input:Pick<ForecastPrecipitationConsistencyInput,'temperature'|'dewPoint'|'humidity'>){
 const temperature=finiteNumber(input.temperature);if(!Number.isFinite(temperature))return Number.NaN;
 const dewPoint=finiteNumber(input.dewPoint),providedHumidity=finiteNumber(input.humidity),humidity=Number.isFinite(providedHumidity)?Math.max(1,Math.min(100,providedHumidity)):Number.isFinite(dewPoint)?relativeHumidityFromDewPoint(temperature,dewPoint):Number.NaN;
 if(!Number.isFinite(humidity))return Number.NaN;
 // Stull-Näherung (°C) reicht hier ausschließlich zum Erkennen grober warmer
 // Phasenwidersprüche; Grenzlagen werden bewusst nicht umklassifiziert.
 return temperature*Math.atan(.151977*Math.sqrt(humidity+8.313659))+Math.atan(temperature+humidity)-Math.atan(humidity-1.676331)+.00391838*humidity**1.5*Math.atan(.023101*humidity)-4.686035;
}
function warmSurfaceRejectsFrozenPhase(input:Pick<ForecastPrecipitationConsistencyInput,'temperature'|'dewPoint'|'humidity'>){const temperature=finiteNumber(input.temperature);if(!Number.isFinite(temperature))return false;const wetBulb=approximateWetBulbTemperature(input);return temperature>=12||(Number.isFinite(wetBulb)?wetBulb>=4:temperature>=8)}
function warmLiquidEquivalentCode(code:number,total:number,showery:boolean){if(showery)return total>=10?82:total>=2.5?81:80;if([56,57].includes(code))return total>=.5?55:total>=.1?53:51;return total>=10?65:total>=2.5?63:61}

/**
 * Trennt konvektive und stratiforme Niederschlagssignale aus mehreren
 * unabhängigen Modellfamilien. Die explizite Modellaufteilung `showers` zu
 * `rain` ist das stärkste Signal; CAPE, Lifted Index und CIN dürfen eine
 * fehlende direkte Aufteilung nur stützen, niemals allein eine Schauerlage
 * erzwingen. Bewölkung, Feuchte und Sonnenscheindauer stützen großräumigen
 * stratiformen Niederschlag beziehungsweise eine tiefe Stratuslage.
 */
export function classifyPrecipitationCharacter(input:Pick<ForecastPrecipitationConsistencyInput,'rain'|'showers'|'code'|'cloud'|'lowCloud'|'humidity'|'cape'|'liftedIndex'|'convectiveInhibition'|'sunshineDuration'|'isDay'>):PrecipitationCharacterEvidence{
 const rain=Math.max(0,finiteNumber(input.rain)||0),showers=Math.max(0,finiteNumber(input.showers)||0),liquid=rain+showers,directPartition=liquid>=.03,convectiveFraction=directPartition?showers/liquid:0,code=Math.round(finiteNumber(input.code)||0),cloud=finiteNumber(input.cloud),lowCloud=finiteNumber(input.lowCloud),humidity=finiteNumber(input.humidity),cape=Math.max(0,finiteNumber(input.cape)||0),liftedIndex=finiteNumber(input.liftedIndex),cin=inhibitionMagnitude(input.convectiveInhibition),sunshine=finiteNumber(input.sunshineDuration),daylight=input.isDay!==false;
 let convectiveScore=0,stratiformScore=0;
 if(directPartition){
  if(showers>=.05&&convectiveFraction>=.65)convectiveScore+=6;
  else if(showers>=.03&&convectiveFraction>=.4)convectiveScore+=4;
  else if(showers>=.01&&convectiveFraction>=.25)convectiveScore+=2;
  if(rain>=.05&&convectiveFraction<=.2)stratiformScore+=6;
  else if(rain>=.03&&convectiveFraction<=.4)stratiformScore+=4;
  else if(rain>=.01&&convectiveFraction<.65)stratiformScore+=2;
 }
 if(showerCode(code))convectiveScore+=2;
 if(stratiformCode(code))stratiformScore+=2;
 if(cape>=1500)convectiveScore+=3;else if(cape>=800)convectiveScore+=2;else if(cape>=300)convectiveScore+=1;
 if(Number.isFinite(liftedIndex)){if(liftedIndex<=-4)convectiveScore+=2;else if(liftedIndex<=-1)convectiveScore+=1;else if(liftedIndex>=2)stratiformScore+=.5}
 if(Number.isFinite(cin)&&cape>=300){if(cin<=25)convectiveScore+=1;else if(cin<=75)convectiveScore+=.5;else if(cin>=200)convectiveScore-=1.5}
 const lowStratus=(Number.isFinite(lowCloud)&&lowCloud>=72)||(Number.isFinite(cloud)&&cloud>=88);
 if(lowStratus)stratiformScore+=1.5;
 if(Number.isFinite(humidity)&&humidity>=90)stratiformScore+=1;
 if(daylight&&Number.isFinite(sunshine)&&sunshine<=600)stratiformScore+=.5;
 if(Number.isFinite(cloud)&&cloud>=25&&cloud<82&&!lowStratus&&cape>=300)convectiveScore+=.5;
 let character:PrecipitationCharacter='indeterminate';
 if(directPartition&&rain>=.03&&showers>=.03&&convectiveFraction>=.3&&convectiveFraction<=.7)character='mixed';
 else if(directPartition&&showers>=.05&&convectiveFraction>=.6&&convectiveScore>=stratiformScore-1)character='convective';
 else if(directPartition&&rain>=.05&&convectiveFraction<=.25&&stratiformScore>=convectiveScore-1)character='stratiform';
 else if(convectiveScore>=5&&convectiveScore>=stratiformScore+2)character='convective';
 else if(stratiformScore>=5&&stratiformScore>=convectiveScore+2)character='stratiform';
 return{character,convectiveScore:Number(convectiveScore.toFixed(2)),stratiformScore:Number(stratiformScore.toFixed(2)),convectiveFraction:Number(convectiveFraction.toFixed(3)),directPartition};
}

/**
 * Hält den gesamten Wetterzustand einer Stunde zusammen. Menge, Phase,
 * Wettercode, Bewölkung und Wahrscheinlichkeit dürfen nicht aus voneinander
 * unabhängigen Modellpfaden zu einer scheinbar präzisen, aber physikalisch
 * widersprüchlichen Aussage zusammengesetzt werden.
 *
 * Kleine deterministische Signale benötigen mit wachsendem Vorhersagehorizont
 * eine stärkere probabilistische Stützung. Das ist keine zeitliche Glättung:
 * Die Rohwahrscheinlichkeit bleibt erhalten; nur eine nicht belastbare Menge
 * und der daraus abgeleitete Niederschlagszustand werden nicht als sicherer
 * Stundenwert ausgegeben. Beobachtete/radargestützte Werte sind ausgenommen.
 */
export function reconcileForecastPrecipitation(input:ForecastPrecipitationConsistencyInput):ForecastPrecipitationConsistency{
 let precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),probability=Math.max(0,Math.min(100,Number(input.probability)||0)),code=Math.round(Number(input.code)||0);
 const wetCode=Boolean(WMO_PRECIP_TYPE[code]),wetSignal=wetCode||precipitation>=.01||rain>=.01||showers>=.01||snowfall>=.01;
 if(!wetSignal)return{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false};
 const suppress=(reason:ForecastPrecipitationConsistency['suppressionReason']):ForecastPrecipitationConsistency=>({precipitation:0,rain:0,showers:0,snowfall:0,probability,code:dryForecastWeatherCode(code,input.cloud),traceSuppressed:true,suppressionReason:reason});
 if(!input.observed&&!input.probabilityUnavailable&&probability<=UNSUPPORTED_FORECAST_MAX_PROBABILITY)return suppress('probability');
 const supportMinimum=deterministicSignalMinimumProbability(input.leadHours),weakAmount=Math.max(precipitation,rain,showers,snowfall)<=WEAK_FORECAST_AMOUNT_MAX_MM;
 if(!input.observed&&!input.probabilityUnavailable&&weakAmount&&probability<supportMinimum)return suppress('weak-distant-signal');
 let phaseAdjusted=false;
 const frozenCode=[56,57,66,67,68,69,71,73,75,77,83,84,85,86].includes(code),frozenSignal=frozenCode||snowfall>=.05;
 if(!input.observed&&frozenSignal&&warmSurfaceRejectsFrozenPhase(input)){
  const total=Math.max(precipitation,rain+showers),showery=[83,84,85,86].includes(code)||showers>Math.max(.02,rain);
  code=warmLiquidEquivalentCode(code,total,showery);snowfall=0;
  if(showery){showers=Math.max(showers,precipitation);rain=0}else{rain=Math.max(rain,precipitation);showers=0}
  phaseAdjusted=true;
 }
 const evidence=classifyPrecipitationCharacter({...input,rain,showers,code}),cloud=Number(input.cloud),lowCloud=Number(input.lowCloud),humidity=Number(input.humidity),rawSunshine=Number(input.sunshineDuration),sunshine=Number.isFinite(rawSunshine)?Math.max(0,rawSunshine):Number.NaN,daylight=input.isDay!==false;
 const stratiformSupport=evidence.character==='stratiform'||(Number.isFinite(cloud)&&cloud>=82)||(Number.isFinite(lowCloud)&&lowCloud>=65)||(Number.isFinite(humidity)&&humidity>=92)||(daylight&&Number.isFinite(sunshine)&&sunshine<=600);
 const convectiveSupport=evidence.character==='convective';
 if(stratiformCode(code)&&convectiveSupport&&![56,57,66,67].includes(code)){
  const total=Math.max(precipitation,rain+showers,snowfall),nextCode=showerEquivalentCode(code,total,snowfall);
  if(![83,84,85,86].includes(nextCode)&&snowfall<.05){showers=Math.max(showers,precipitation);rain=0}
  code=nextCode;phaseAdjusted=true;
 }else if(showerCode(code)&&evidence.character==='stratiform'&&![95,96,97,99].includes(code)){
  const total=Math.max(precipitation,rain+showers,snowfall),nextCode=stratiformEquivalentCode(code,total,snowfall);
  if(![68,69,71,73,75].includes(nextCode)&&snowfall<.05){rain=Math.max(rain,precipitation);showers=0}
  code=nextCode;phaseAdjusted=true;
 }else if(!input.observed&&stratiformCode(code)&&!stratiformSupport&&!convectiveSupport&&weakAmount){
  return suppress('sky-contradiction');
 }else if(!input.observed&&showerCode(code)&&!convectiveSupport&&!stratiformSupport&&weakAmount){
  return suppress('sky-contradiction');
 }
 return{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false,phaseAdjusted};
}

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

function estimatedCloudBaseHft(h:PrecipSample){
 const observed=[finiteOrNaN(h.ceilingHft),finiteOrNaN(h.cloudBaseHft)].filter(Number.isFinite);
 if(observed.length)return Math.min(...observed);
 const temperature=finiteOrNaN(h.temperature),dewPoint=finiteOrNaN(h.dewPoint);
 // Näherung für die konvektive Kondensationshöhe: ca. 400 ft je Kelvin T−Td.
 return Number.isFinite(temperature)&&Number.isFinite(dewPoint)?Math.max(0,(temperature-dewPoint)*400):Number.NaN;
}

function lowStratusSignal(h:PrecipSample,{humidityMinimum,lowCloudMinimum}:{humidityMinimum:number;lowCloudMinimum:number}){
 const humidity=finiteOrNaN(h.humidity),lowCloud=finiteOrNaN(h.lowCloud),cloud=finiteOrNaN(h.cloud),baseHft=estimatedCloudBaseHft(h);
 const humidEnough=Number.isFinite(humidity)&&humidity>=humidityMinimum;
 const lowCloudEnough=Number.isFinite(lowCloud)?lowCloud>=lowCloudMinimum:Number.isFinite(cloud)&&cloud>=92;
 const lowCloudDominant=Number.isFinite(lowCloud)&&Number.isFinite(cloud)?lowCloud>=Math.max(lowCloudMinimum,cloud*.72):lowCloudEnough;
 const sufficientlyLow=Number.isFinite(baseHft)?baseHft<=3000:humidEnough&&humidity>=97&&lowCloudEnough;
 return humidEnough&&lowCloudEnough&&lowCloudDominant&&sufficientlyLow;
}

function drizzlePlausible(h:PrecipSample,total:number){
 const weakStratiformRate=total<=.6&&Math.max(0,Number(h.showers)||0)<.02;
 return lowStratusSignal(h,{humidityMinimum:93,lowCloudMinimum:84})&&weakStratiformRate;
}

function snowGrainsPlausible(h:PrecipSample,total:number){
 const weakNonConvective=total<=.5&&Math.max(0,Number(h.showers)||0)<.03;
 return lowStratusSignal(h,{humidityMinimum:88,lowCloudMinimum:75})&&weakNonConvective;
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
 * Bestimmt Niederschlagsart, Text und Symbol zentral für die gesamte App.
 * Der WMO-Code bleibt für die Phase (flüssig, gefrierend, gemischt oder fest)
 * maßgeblich. Die Plausibilitätsprüfung korrigiert ausschließlich die seltenen
 * Unterarten Sprühregen und Schneegriesel: fehlt die typische feuchte, tiefe
 * Stratuslage, eine sehr niedrige Wolkenbasis und eine schwache nicht-konvektive
 * Rate, wird innerhalb derselben Phase zu Regen bzw. Schnee verallgemeinert.
 */
export function precipitationParts(h:PrecipSample):PrecipitationParts{
 const total=Math.max(0,Number(h.precipitation)||0);
 const rainValue=Math.max(0,Number(h.rain)||0);
 const showerValue=Math.max(0,Number(h.showers)||0);
 const rawSnowCm=Math.max(0,Number(h.snowfall)||0);
 const code=Math.round(Number(h.code)||0);
 const rawCodedType=WMO_PRECIP_TYPE[code],frozenSignal=['freezingDrizzle','freezingRain','sleet','sleetShowers','snow','snowGrains','snowShowers'].includes(String(rawCodedType))||rawSnowCm>=.05,warmPhaseAdjusted=frozenSignal&&warmSurfaceRejectsFrozenPhase(h),showeryWarmPhase=['sleetShowers','snowShowers'].includes(String(rawCodedType))||showerValue>Math.max(.02,rainValue),effectiveCode=warmPhaseAdjusted?warmLiquidEquivalentCode(code,total,showeryWarmPhase):code,snowCm=warmPhaseAdjusted?0:rawSnowCm;
 const codedType=WMO_PRECIP_TYPE[effectiveCode];
 const hasRain=rainValue>=.05;
 const hasShowers=showerValue>=.05;
 const hasSnow=snowCm>=.05;
 let type:PrecipType;

 const character=classifyPrecipitationCharacter(h);
 const convectiveLean=character.character==='convective'||hasShowers||Math.max(0,Number(h.showers)||0)>=.02||((Number(h.cape)||0)>=200&&(Number(h.lowCloud)||0)<75&&total>=.1);
 if(codedType==='drizzle'){
  type=drizzlePlausible(h,total)?'drizzle':convectiveLean?'showers':'rain';
 }else if(codedType==='freezingDrizzle'){
  type=drizzlePlausible(h,total)?'freezingDrizzle':'freezingRain';
 }else if(codedType==='snowGrains'){
  type=snowGrainsPlausible(h,total)?'snowGrains':convectiveLean?'snowShowers':'snow';
 }else if(codedType==='rain')type=convectiveLean?'showers':'rain';
 else if(codedType==='showers')type=character.character==='stratiform'?'rain':'showers';
 else if(codedType==='snow')type=character.character==='convective'?'snowShowers':'snow';
 else if(codedType==='snowShowers')type=character.character==='stratiform'?'snow':'snowShowers';
 else if(codedType==='sleet')type=character.character==='convective'?'sleetShowers':'sleet';
 else if(codedType==='sleetShowers')type=character.character==='stratiform'?'sleet':'sleetShowers';
 else if(codedType){
  // Flüssig, gefrierend, gemischt oder fest bleibt phasentreu. Lediglich der
  // objektiv gestützte Charakter Schauer versus großräumig wird korrigiert.
  type=codedType;
 }else if(hasSnow&&hasShowers)type='sleetShowers';
 else if(hasSnow&&hasRain)type='sleet';
 else if(hasSnow)type='snow';
 else if(hasShowers)type='showers';
 else if(hasRain||total>=.01)type='rain';
 else type='none';

 if(type==='none')return{total,type,label:'kein Niederschlag',weatherLabel:'kein Niederschlag',code,displayCode:code};
 const amount=type==='snow'||type==='snowShowers'||type==='snowGrains'||type==='sleet'||type==='sleetShowers'
  ?precipitationAmountLabel({precipitation:total,snowfall:snowCm})
  :`${formatDecimalFixed(total,1)} mm`;
 const weatherLabel=type==='rain'
  ?`${rainIntensity(total)} Regen`
  :type==='drizzle'
   ?`${drizzleIntensity(total)} Sprühregen`
   :PRECIP_LABEL[type];
 const displayCode=codedType===type
  ?effectiveCode
  :representativePrecipitationCode(type,total,snowCm);
 const label=`${weatherLabel} ${amount}`;
 return{total,type,label,weatherLabel,code,displayCode};
}

const PRECIP_TYPE_ORDER:PrecipType[]=['drizzle','freezingDrizzle','rain','freezingRain','showers','sleet','sleetShowers','snow','snowGrains','snowShowers','thunderstorm','thunderstormHail'];

export function presentPrecipTypes(series:{type:PrecipType}[]){
 return PRECIP_TYPE_ORDER.filter(type=>series.some(item=>item.type===type)) as Exclude<PrecipType,'none'>[];
}

export function precipitationAmountLabel(input:{precipitation?:number;snowfall?:number},{snowSymbol=true}:{snowSymbol?:boolean}={}){
 const precipitation=Math.max(0,Number(input.precipitation)||0),snowfall=Math.max(0,Number(input.snowfall)||0),base=`${formatDecimalFixed(precipitation,1)} mm`;
 return snowfall>=.05?`${base} · ${snowSymbol?'❄ ':''}${formatDecimalFixed(snowfall,1)} cm`:base;
}

export function compactPrecipitationTypeLabel(type:PrecipType){
 if(type==='drizzle')return'Sprühregen';
 if(type==='freezingDrizzle')return'Gefr. Sprühregen';
 if(type==='rain')return'Regen';
 if(type==='freezingRain')return'Gefr. Regen';
 if(type==='showers')return'Regenschauer';
 if(type==='snow')return'Schnee';
 if(type==='snowGrains')return'Schneegriesel';
 if(type==='snowShowers')return'Schneeschauer';
 if(type==='sleet')return'Schneeregen';
 if(type==='sleetShowers')return'Schneeregenschauer';
 if(type==='thunderstormHail')return'Hagelgewitter';
 if(type==='thunderstorm')return'Gewitter';
 return'Kein Niederschlag';
}

export function dominantPrecipitationForm(samples:PrecipSample[]){
 const scored=new Map<Exclude<PrecipType,'none'>,{score:number;code:number}>();
 for(const sample of samples){
  const part=precipitationParts(sample);if(part.type==='none')continue;
  const type=part.type as Exclude<PrecipType,'none'>,probability=Math.max(0,Math.min(100,Number(sample.probability)||0)),liquid=Math.max(0,Number(sample.precipitation)||0),snow=Math.max(0,Number(sample.snowfall)||0);
  if(probability<20&&liquid<.05&&snow<.05)continue;
  const phaseWeight=type==='thunderstormHail'||type==='thunderstorm'?1.6:type==='freezingRain'||type==='freezingDrizzle'?1.45:type==='sleet'||type==='sleetShowers'?1.35:type==='snow'||type==='snowShowers'||type==='snowGrains'?1.3:type==='showers'?1.15:1;
  const score=(.25+probability/100)*(1+Math.min(3,liquid*1.25+snow*.28))*phaseWeight,current=scored.get(type);
  if(current)current.score+=score;else scored.set(type,{score,code:part.displayCode});
 }
 const winner=[...scored.entries()].sort((a,b)=>b[1].score-a[1].score)[0];
 if(!winner)return null;
 return{type:winner[0],label:compactPrecipitationTypeLabel(winner[0]),code:winner[1].code};
}
