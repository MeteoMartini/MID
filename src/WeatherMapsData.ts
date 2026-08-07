import {buildWorkerUrl,configuredWorkerBase,fetchWorkerJson} from './workerClient';

export type WeatherMapModelId='icon-eu'|'icon'|'icon-eps'|'nowcastmix'|'meteosat';
export type WeatherMapCategory='surface'|'upper-air'|'ensemble'|'significant'|'satellite';

export type WeatherMapProduct={
 id:string;
 modelId:WeatherMapModelId;
 category:WeatherMapCategory;
 label:string;
 detail:string;
 layer:string;
 levels?:number[];
 defaultLevel?:number;
 timeDependent?:boolean;
 forecast?:boolean;
 defaultZoom:number;
 opacity?:number;
 disclaimer?:string;
};

export type WeatherMapMetadata={
 layer:string;
 times:string[];
 referenceTimes:string[];
 elevations:number[];
 provider?:string;
 checkedAt?:string;
 error?:string;
};

export const WEATHER_MAP_MODELS:{id:WeatherMapModelId;label:string;detail:string}[]=[
 {id:'icon-eu',label:'DWD ICON-EU',detail:'Europa · hochaufgelöste Kurzfrist'},
 {id:'icon',label:'DWD ICON Global',detail:'Global · Boden- und Druckflächen'},
 {id:'icon-eps',label:'DWD ICON-EPS',detail:'Globales Ensemble'},
 {id:'nowcastmix',label:'DWD NowCastMIX',detail:'Signifikante Wettererscheinungen'},
 {id:'meteosat',label:'DWD Meteosat',detail:'Satellitenbeobachtung Europa'}
];

const PRESSURE_LEVELS=[1000,925,850,700,500,400,300,250,200];

export const WEATHER_MAP_PRODUCTS:WeatherMapProduct[]=[
 {id:'icon-eu-qff',modelId:'icon-eu',category:'surface',label:'Bodendruck / QFF',detail:'Auf Meereshöhe reduzierter Luftdruck',layer:'dwd:Icon-eu_reg00625_fd_sl_QFF',timeDependent:true,forecast:true,defaultZoom:5,opacity:76},
 {id:'icon-eu-rain-1h',modelId:'icon-eu',category:'surface',label:'Niederschlag · 1 Stunde',detail:'Stündliche Niederschlagsmenge',layer:'dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H',timeDependent:true,forecast:true,defaultZoom:6,opacity:72},
 {id:'icon-eu-rain-3h',modelId:'icon-eu',category:'surface',label:'Niederschlag · 3 Stunden',detail:'Dreistündliche Niederschlagsmenge',layer:'dwd:Icon-eu_reg00625_fd_sl_TOTPREC03H',timeDependent:true,forecast:true,defaultZoom:5,opacity:72},
 {id:'icon-pmsl',modelId:'icon',category:'surface',label:'Bodendruck / MSL',detail:'Globales Luftdruckfeld am Boden',layer:'dwd:Icon_reg025_fd_sl_PMSL',timeDependent:true,forecast:true,defaultZoom:4,opacity:76},
 {id:'icon-t2m',modelId:'icon',category:'surface',label:'Temperatur · 2 Meter',detail:'Globale bodennahe Lufttemperatur',layer:'dwd:Icon_reg025_fd_sl_T2M',timeDependent:true,forecast:true,defaultZoom:4,opacity:72},
 {id:'icon-rain-6h',modelId:'icon',category:'surface',label:'Niederschlag · 6 Stunden',detail:'Sechsstündliche Niederschlagsmenge',layer:'dwd:Icon_reg025_fd_sl_TOTPREC06H',timeDependent:true,forecast:true,defaultZoom:4,opacity:72},
 {id:'icon-gh',modelId:'icon',category:'upper-air',label:'Geopotential / Höhenkarte',detail:'Geopotentielle Höhe auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_GH',levels:PRESSURE_LEVELS,defaultLevel:500,timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'icon-temperature',modelId:'icon',category:'upper-air',label:'Temperatur auf Druckfläche',detail:'Lufttemperatur in der freien Atmosphäre',layer:'dwd:Icon_reg025_fd_pl_T',levels:PRESSURE_LEVELS,defaultLevel:850,timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-relative-humidity',modelId:'icon',category:'upper-air',label:'Relative Feuchte auf Druckfläche',detail:'Feuchteverteilung in der freien Atmosphäre',layer:'dwd:Icon_reg025_fd_pl_RELHUM',levels:PRESSURE_LEVELS,defaultLevel:700,timeDependent:true,forecast:true,defaultZoom:4,opacity:72},
 {id:'icon-upper-wind',modelId:'icon',category:'upper-air',label:'Höhenwind',detail:'Windgeschwindigkeit und -richtung auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_UV',levels:PRESSURE_LEVELS,defaultLevel:300,timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'icon-eps-gh',modelId:'icon-eps',category:'ensemble',label:'Ensemble-Geopotential',detail:'Geopotential auf Druckflächen aus ICON-EPS',layer:'dwd:Icon-eps_reg025_fd_pl_GH',levels:PRESSURE_LEVELS,defaultLevel:500,timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'icon-eps-temperature-anomaly',modelId:'icon-eps',category:'ensemble',label:'Temperaturanomalie',detail:'Ensemble-Abweichung der Temperatur auf Druckflächen',layer:'dwd:Icon-eps_reg025_fd_pl_TA',levels:PRESSURE_LEVELS,defaultLevel:850,timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-eps-wind',modelId:'icon-eps',category:'ensemble',label:'Ensemble-Höhenwind',detail:'Mittlere Windgeschwindigkeit auf Druckflächen',layer:'dwd:Icon-eps_reg025_fd_pl_SP',levels:PRESSURE_LEVELS,defaultLevel:300,timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'significant-analysis',modelId:'nowcastmix',category:'significant',label:'Signifikantes Wetter · Analyse',detail:'Automatisch erkannte aktuelle Wettergefahren',layer:'dwd:Autowarn_Analyse',timeDependent:false,defaultZoom:6,opacity:82,disclaimer:'Automatische DWD-NowCastMIX-Auswertung · keine Flugwetterberatung und keine amtliche Einzelwarnung.'},
 {id:'significant-forecast',modelId:'nowcastmix',category:'significant',label:'Signifikantes Wetter · +60 Minuten',detail:'Verlagerungsprognose signifikanter Wettererscheinungen',layer:'dwd:Autowarn_Vorhersage',timeDependent:false,forecast:true,defaultZoom:6,opacity:82,disclaimer:'Automatische 60-Minuten-Verlagerung aus NowCastMIX · keine Flugwetterberatung.'},
 {id:'meteosat-rgb',modelId:'meteosat',category:'satellite',label:'Satellit RGB · Europa',detail:'Meteosat-Tag-/Nachtkomposit im 3-Stunden-Raster',layer:'dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h',timeDependent:true,forecast:false,defaultZoom:4,opacity:86}
];

export function weatherMapProductsForModel(modelId:WeatherMapModelId){return WEATHER_MAP_PRODUCTS.filter(product=>product.modelId===modelId)}
export function weatherMapProduct(productId:string){return WEATHER_MAP_PRODUCTS.find(product=>product.id===productId)??WEATHER_MAP_PRODUCTS[0]}
export function weatherMapModel(modelId:WeatherMapModelId){return WEATHER_MAP_MODELS.find(model=>model.id===modelId)??WEATHER_MAP_MODELS[0]}

export function weatherMapWmsProxy(){
 const configured=configuredWorkerBase('radar');
 if(!configured)return'';
 return buildWorkerUrl(configured,'weather-map-wms',{provider:'dwd'}).toString();
}

export async function loadWeatherMapMetadata(layer:string,signal?:AbortSignal){
 return fetchWorkerJson<WeatherMapMetadata>('weather-map-metadata',{layer},{purpose:'radar',signal,timeoutMs:12000,maxAgeMs:5*60000,staleIfErrorMs:30*60000,cacheKey:layer});
}

export function preferredWeatherMapTimeIndex(times:string[],reference=Date.now()){
 if(!times.length)return 0;
 const parsed=times.map(value=>Date.parse(value));
 const firstCurrent=parsed.findIndex(value=>Number.isFinite(value)&&value>=reference-15*60000);
 if(firstCurrent>=0)return firstCurrent;
 let best=0,distance=Number.POSITIVE_INFINITY;
 parsed.forEach((value,index)=>{const next=Math.abs(value-reference);if(Number.isFinite(next)&&next<distance){distance=next;best=index}});
 return best;
}
