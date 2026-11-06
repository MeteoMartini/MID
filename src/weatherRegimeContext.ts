import {fetchWorkerJson} from './workerClient';
import type {Location} from './weather';

export const ECMWF_REGIME_URL='https://charts.ecmwf.int/products/extended-regime-probabilities?forecast_from=latest';
export const DWD_REGIME_URL='https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/wetterlagenklassifikation.html';
export const DWD_REGIME_DATA_URL='https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/online_wlkvorhersage.txt?view=nasPublication&nn=16102';
export const DWD_REGIME_LEADS=[0,12,24,36,48,60,72,96,120,144,168] as const;
export type DwdRegimeFrame={leadHours:number;validAt:string;classId:number|null;code:string|null};
export type DwdRegimeData={schema:'mid.dwd.weather-regimes.v1';available:boolean;error?:string;analysisAt:string;checkedAt:string;sourceSha256:string;sourceUrl:string;frames:DwdRegimeFrame[]};
export function weatherRegimeRegion(location:Pick<Location,'latitude'|'longitude'|'country_code'|'country'>):'dwd'|'euro-atlantic'|null{
 const {latitude:lat,longitude:lon}=location;
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<30||lat>75||lon< -25||lon>45)return null;
 // Conservative relevance window within the published DWD grid. This regional
 // index is never presented as a classification of the favorite's local weather.
 return lat>=47&&lat<=55.76&&lon>=5&&lon<=16?'dwd':'euro-atlantic';
}
export function dwdRegimeDescription(classId:number,code:string){
 if(!Number.isInteger(classId)||classId<1||classId>40)return null;
 const directions=['XX','NO','SO','SW','NW'],pressure=Math.floor((classId-1)/10),wet=Math.floor((classId-1)/5)%2===1;
 const expected=directions[(classId-1)%5]+(pressure>=2?'Z':'A')+(pressure%2?'Z':'A')+(wet?'F':'T');
 if(code!==expected)return null;
 const direction=code.slice(0,2),flow=({XX:'Unbestimmt',NO:'Nordost',SO:'Südost',SW:'Südwest',NW:'Nordwest'} as Record<string,string>)[direction];
 return{flow,direction,wet,low:pressure>=2?'Tiefdruckprägung':'Hochdruckprägung',high:pressure%2?'zyklonal':'antizyklonal',label:`${flow} · ${wet?'feucht':'trocken'}`,detail:`${flow} · 950 hPa ${pressure>=2?'zyklonal':'antizyklonal'} · 500 hPa ${pressure%2?'zyklonal':'antizyklonal'} · ${wet?'feuchte':'trockene'} Luftmasse`};
}
export function validateDwdRegimes(value:DwdRegimeData,now=Date.now()){
 const base=Date.parse(value?.analysisAt||'');
 if(value?.sourceUrl!==DWD_REGIME_DATA_URL||!/^[a-f0-9]{64}$/.test(value?.sourceSha256||'')||new Date(base).getUTCHours()!==12||new Date(base).getUTCMinutes()!==0||new Date(base).getUTCSeconds()!==0||new Date(base).getUTCMilliseconds()!==0||value?.schema!=='mid.dwd.weather-regimes.v1'||!value.available||!Number.isFinite(base)||base>now+600000||now-base>48*3600000||!Array.isArray(value.frames)||value.frames.length!==DWD_REGIME_LEADS.length)throw Error('DWD-Wetterlagen derzeit nicht verfügbar.');
 for(const [index,frame] of value.frames.entries()){
  if(frame.leadHours!==DWD_REGIME_LEADS[index]||Date.parse(frame.validAt)!==base+frame.leadHours*3600000)throw Error('DWD-Wetterlagentermine sind nicht konsistent.');
  if(frame.classId===null&&frame.code===null)continue;
  if(typeof frame.classId!=='number'||typeof frame.code!=='string'||!dwdRegimeDescription(frame.classId,frame.code))throw Error('DWD-Wetterlagenklasse ist nicht verifiziert.');
 }
 if(!value.frames.some(frame=>frame.classId!==null&&Date.parse(frame.validAt)>=now))throw Error('DWD-Wetterlagen derzeit nicht verfügbar.');
 return value;
}
export async function loadDwdWeatherRegimes(signal:AbortSignal){
 const value=await fetchWorkerJson<DwdRegimeData>('dwd-weather-regimes',{},{signal,timeoutMs:18000,maxAgeMs:3600000,staleIfErrorMs:0,cacheKey:'dwd-weather-regimes:v1'});
 return validateDwdRegimes(value);
}
