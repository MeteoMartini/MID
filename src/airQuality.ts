export type EuropeanAqiBandKey='good'|'fair'|'moderate'|'poor'|'very-poor'|'extremely-poor';
export type EuropeanAqiPollutantKey='pm2_5'|'pm10'|'nitrogen_dioxide'|'ozone'|'sulphur_dioxide';
export type EuropeanAqiBand={key:EuropeanAqiBandKey;label:string;index:number;color:string;health:string};
export type EuropeanAqiPollutantResult={key:EuropeanAqiPollutantKey;label:string;formula:string;value:number;unit:'µg/m³';band:EuropeanAqiBand;aqi?:number};
export type EuropeanAirQualityResult={band:EuropeanAqiBand;dominant:EuropeanAqiPollutantResult;pollutants:EuropeanAqiPollutantResult[]};
export type EuropeanAqiPollutantScaleSegment={band:EuropeanAqiBand;min:number;max:number|null};
export type EuropeanAqiPollutantScale={segments:EuropeanAqiPollutantScaleSegment[];positionPct:number};
export type AirQualityStationMeta={available:boolean;name?:string;stationCode?:string;eoiCode?:string;country?:string;countryCode?:string;stationClass?:string;latitude?:number;longitude?:number;distanceKm?:number;provider?:string;checkedAt?:string;reason?:string;error?:string;sourceHost?:string;cached?:boolean;cachedAt?:string;diagnostics?:unknown};

export const EUROPEAN_AQI_BANDS:EuropeanAqiBand[]=[
 {key:'good',label:'Gut',index:0,color:'#50F0E6',health:'Die Luftqualität ist gut.'},
 {key:'fair',label:'Mittelmäßig',index:1,color:'#50CCAA',health:'Die Luftqualität ist akzeptabel.'},
 {key:'moderate',label:'Mittel',index:2,color:'#F0E641',health:'Empfindliche Personen können Beschwerden bemerken.'},
 {key:'poor',label:'Schlecht',index:3,color:'#FF5050',health:'Empfindliche Personen sollten anstrengende Aktivitäten im Freien reduzieren.'},
 {key:'very-poor',label:'Sehr schlecht',index:4,color:'#960032',health:'Gesundheitliche Auswirkungen sind möglich; körperliche Belastung im Freien reduzieren.'},
 {key:'extremely-poor',label:'Äußerst schlecht',index:5,color:'#7D2181',health:'Gesundheitsrisiko: anstrengende Aktivitäten im Freien vermeiden.'}
];


export const EUROPEAN_AQI_INDEX_THRESHOLDS=[20,40,60,80,100] as const;
const EUROPEAN_AQI_FIELD_BY_POLLUTANT:Record<EuropeanAqiPollutantKey,string>={pm2_5:'european_aqi_pm2_5',pm10:'european_aqi_pm10',nitrogen_dioxide:'european_aqi_nitrogen_dioxide',ozone:'european_aqi_ozone',sulphur_dioxide:'european_aqi_sulphur_dioxide'};
export function europeanAqiBandFromIndex(value:unknown):EuropeanAqiBand|null{const number=Number(value);if(!Number.isFinite(number)||number<0)return null;const index=EUROPEAN_AQI_INDEX_THRESHOLDS.findIndex(max=>number<=max);return EUROPEAN_AQI_BANDS[index<0?5:index]}

type PollutantDefinition={key:EuropeanAqiPollutantKey;label:string;formula:string;thresholds:[number,number,number,number,number]};
export const EUROPEAN_AQI_POLLUTANTS:PollutantDefinition[]=[
 {key:'pm2_5',label:'Feinstaub PM2,5',formula:'PM2,5',thresholds:[10,20,25,50,75]},
 {key:'pm10',label:'Feinstaub PM10',formula:'PM10',thresholds:[20,40,50,100,150]},
 {key:'nitrogen_dioxide',label:'Stickstoffdioxid',formula:'NO₂',thresholds:[40,90,120,230,340]},
 {key:'ozone',label:'Ozon',formula:'O₃',thresholds:[50,100,130,240,380]},
 {key:'sulphur_dioxide',label:'Schwefeldioxid',formula:'SO₂',thresholds:[100,200,350,500,750]}
];

export function classifyEuropeanAqiPollutant(key:EuropeanAqiPollutantKey,value:unknown):EuropeanAqiPollutantResult|null{
 const number=Number(value),definition=EUROPEAN_AQI_POLLUTANTS.find(item=>item.key===key);
 if(!definition||!Number.isFinite(number)||number<0)return null;
 const index=definition.thresholds.findIndex(max=>number<=max),band=EUROPEAN_AQI_BANDS[index<0?5:index];
 return{key,label:definition.label,formula:definition.formula,value:number,unit:'µg/m³',band};
}

export function classifyEuropeanAirQuality(current:Record<string,number|string>|undefined|null):EuropeanAirQualityResult|null{
 if(!current)return null;
 const pollutants:EuropeanAqiPollutantResult[]=EUROPEAN_AQI_POLLUTANTS.flatMap(item=>{
  const concentration=classifyEuropeanAqiPollutant(item.key,current[item.key]);if(!concentration)return[];
  const aqiValue=Number(current[EUROPEAN_AQI_FIELD_BY_POLLUTANT[item.key]]),aqiBand=europeanAqiBandFromIndex(aqiValue),result:EuropeanAqiPollutantResult={...concentration,band:aqiBand??concentration.band};
  if(Number.isFinite(aqiValue)&&aqiValue>=0)result.aqi=aqiValue;
  return[result];
 });
 if(!pollutants.length)return null;
 const dominant=[...pollutants].sort((a,b)=>b.band.index-a.band.index||(b.aqi??-1)-(a.aqi??-1)||b.value-a.value)[0],overallBand=europeanAqiBandFromIndex(current.european_aqi);
 return{band:overallBand??dominant.band,dominant,pollutants};
}


export function describeEuropeanAqiPollutantScale(key:EuropeanAqiPollutantKey,value:unknown,aqiValue?:unknown):EuropeanAqiPollutantScale|null{
 const number=Number(value),definition=EUROPEAN_AQI_POLLUTANTS.find(item=>item.key===key),classification=classifyEuropeanAqiPollutant(key,value);
 if(!definition||!classification||!Number.isFinite(number)||number<0)return null;
 const thresholds=[0,...definition.thresholds],lastThreshold=definition.thresholds[definition.thresholds.length-1],previousThreshold=definition.thresholds[definition.thresholds.length-2]??0,tailSpan=Math.max(1,lastThreshold-previousThreshold),displayCeiling=lastThreshold+tailSpan;
 const segments=EUROPEAN_AQI_BANDS.map((band,index)=>({band,min:thresholds[index]??0,max:index<definition.thresholds.length?definition.thresholds[index]:null}));
 const aqi=Number(aqiValue),aqiBand=Number.isFinite(aqi)&&aqi>=0?europeanAqiBandFromIndex(aqi):null;
 if(aqiBand){
  const aqiBounds=[0,...EUROPEAN_AQI_INDEX_THRESHOLDS],bandIndex=aqiBand.index,lower=aqiBounds[bandIndex]??0,upper=bandIndex<EUROPEAN_AQI_INDEX_THRESHOLDS.length?EUROPEAN_AQI_INDEX_THRESHOLDS[bandIndex]:120,span=Math.max(1,upper-lower),relative=Math.max(0,Math.min(.999,(aqi-lower)/span)),positionPct=Math.max(0,Math.min(100,((bandIndex+relative)/EUROPEAN_AQI_BANDS.length)*100));
  return{segments,positionPct};
 }
 const bandIndex=classification.band.index,lower=thresholds[bandIndex]??0,upper=bandIndex<definition.thresholds.length?definition.thresholds[bandIndex]:displayCeiling,span=Math.max(1,upper-lower),relative=Math.max(0,Math.min(.999,(number-lower)/span)),positionPct=Math.max(0,Math.min(100,((bandIndex+relative)/EUROPEAN_AQI_BANDS.length)*100));
 return{segments,positionPct};
}

export function stationClassLabel(value?:string){
 const key=String(value||'').trim().toLowerCase();
 if(key==='0'||key==='all-mandatory-pollutants')return'Messumfang: alle Pflichtschadstoffe';
 if(key==='1'||key==='main-pollutants')return'Messumfang: Hauptschadstoffe';
 if(key==='2'||key==='some-main-pollutants')return'Messumfang: einige Hauptschadstoffe';
 if(key==='3'||key==='other-pollutants')return'Messumfang: weitere Schadstoffe';
 if(key.includes('traffic'))return'verkehrsnah';
 if(key.includes('industrial'))return'industriegeprägt';
 if(key.includes('background'))return'Hintergrundstation';
 if(key.includes('urban'))return'städtisch';
 if(key.includes('suburban'))return'vorstädtisch';
 if(key.includes('rural'))return'ländlich';
 return value?.trim()||'Stationsklasse nicht angegeben';
}
