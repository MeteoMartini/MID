import {buildWorkerUrl,configuredWorkerBase,fetchWorkerJson} from './workerClient';

export type WeatherMapModelId='icon-d2'|'icon-eu'|'icon'|'icon-eps'|'aicon'|'nowcastmix';
export type WeatherMapCategory='surface'|'upper-air'|'ensemble'|'significant';
export type WeatherMapLevelKind='pressure'|'height';
export type WeatherMapSource='wms'|'grid';
export type WeatherMapGridKind='pressure-thetae'|'pressure-sigwx'|'pressure-precip';

export type WeatherMapProduct={
 id:string;modelId:WeatherMapModelId;category:WeatherMapCategory;label:string;detail:string;layer:string;
 source?:WeatherMapSource;gridKind?:WeatherMapGridKind;levels?:number[];defaultLevel?:number;levelKind?:WeatherMapLevelKind;timeDependent?:boolean;forecast?:boolean;defaultZoom:number;opacity?:number;disclaimer?:string;
};
export type WeatherMapMetadata={layer:string;times:string[];referenceTimes:string[];elevations:number[];provider?:string;checkedAt?:string;error?:string};
export type WeatherMapGridContour={level:number;paths:[number,number][][]};
export type WeatherMapGridFrame={time:string;thetaE:number[];temperature2m?:number[];relativeHumidity2m?:number[];weatherCode:number[];precipitation:number[];snowfall?:number[];isobars:WeatherMapGridContour[]};
export type WeatherMapGridData={modelId:WeatherMapModelId;modelLabel:string;times:string[];referenceTime?:string;lats:number[];lons:number[];frames:WeatherMapGridFrame[];provider?:string;checkedAt?:string;error?:string};
export type WeatherPhaseGridFrame={time:string;temperature2m:number[];relativeHumidity2m:number[];wetBulbTemperature2m:number[];weatherCode:number[];precipitation:number[];rain:number[];showers:number[];snowfall:number[];snowfallHeight:number[];freezingLevelHeight:number[];elevation:number[]};
export type WeatherPhaseGridData={modelId:string;modelLabel:string;targetTime:string;referenceTime?:string;lats:number[];lons:number[];frame:WeatherPhaseGridFrame;provider?:string;checkedAt?:string;gridSpacingKm?:number;coverage?:string;stale?:boolean;fallbackReason?:string;rapidUpdate?:boolean;native15?:boolean;updateIntervalSeconds?:number;modelAgeHours?:number;selectionScore?:number;candidateModels?:Array<{id:string;label:string;rapidUpdate?:boolean;resolutionKm?:number;score?:number}>;requestBudget?:{locations:number;batches:number;variables:number};error?:string};

export const WEATHER_MAP_MODELS:{id:WeatherMapModelId;label:string;detail:string}[]=[
 {id:'icon-d2',label:'DWD ICON-D2',detail:'Deutschland · ca. 2 km · Kurzfrist bis rund +48 h'},
 {id:'icon-eu',label:'DWD ICON-EU',detail:'Europa · 0,0625° · Modellläufe 00/06/12/18 UTC'},
 {id:'icon',label:'DWD ICON Global',detail:'Global · Boden- und Druckflächen'},
 {id:'icon-eps',label:'DWD ICON-EPS',detail:'Globales Ensemble · Wahrscheinlichkeiten und Mittelwerte'},
 {id:'aicon',label:'DWD AICON',detail:'KI-gestützte globale Kurzfristvorhersage des DWD'},
 {id:'nowcastmix',label:'DWD NowCastMIX',detail:'Signifikante Wettererscheinungen und Konvektion'}
];

const PRESSURE_LEVELS=[1000,925,850,700,500,400,300,250,200];
const HEIGHT_LEVELS=[2,50,100,150,200,250,300,350,400,450,500];

export const WEATHER_MAP_PRODUCTS:WeatherMapProduct[]=[
 // ICON-D2 – aktueller Rasterpfad aus DWD ICON-D2 via Open-Meteo; kein nicht verfügbarer DWD-WMS-Layer
 {id:'icon-d2-pressure-thetae',modelId:'icon-d2',category:'upper-air',label:'Bodendruck + ThetaE 850 hPa',detail:'MSL-Druckkonturen mit äquivalentpotenzieller Temperatur in 850 hPa · ICON-D2',layer:'mid:grid:icon-d2:pressure-thetae',source:'grid',gridKind:'pressure-thetae',timeDependent:true,forecast:true,defaultZoom:7,opacity:82,disclaimer:'DWD ICON-D2-Modellfelder über den aktuellen Open-Meteo-DWD-Datenpfad. ThetaE 850 hPa wird aus Temperatur und relativer Feuchte berechnet; MSL-Druck als Isobaren.'},
 {id:'icon-d2-pressure-sigwx',modelId:'icon-d2',category:'significant',label:'Bodendruck + SIGWX',detail:'MSL-Druckkonturen mit modelliertem signifikantem Wetter · ICON-D2',layer:'mid:grid:icon-d2:pressure-sigwx',source:'grid',gridKind:'pressure-sigwx',timeDependent:true,forecast:true,defaultZoom:7,opacity:84,disclaimer:'SIGWX wird aus dem ICON-D2-Wettercodefeld dargestellt; MSL-Druckkonturen dienen der synoptischen Einordnung.'},
 {id:'icon-d2-pressure-precip',modelId:'icon-d2',category:'surface',label:'Bodendruck + Niederschlag',detail:'MSL-Druckkonturen mit stündlichem Niederschlag · ICON-D2',layer:'mid:grid:icon-d2:pressure-precip',source:'grid',gridKind:'pressure-precip',timeDependent:true,forecast:true,defaultZoom:7,opacity:80},

 // ICON-EU – komplette auf dem offenen DWD-WMS veröffentlichte ICON-EU-Serie
 {id:'icon-eu-qff',modelId:'icon-eu',category:'surface',label:'Bodendruck / QFF',detail:'Auf Meereshöhe reduzierter Luftdruck',layer:'dwd:Icon-eu_reg00625_fd_sl_QFF',timeDependent:true,forecast:true,defaultZoom:5,opacity:78},
 {id:'icon-eu-temperature-height',modelId:'icon-eu',category:'upper-air',label:'Temperatur auf Höhen über Grund',detail:'2 bis 500 m über Grund',layer:'dwd:Icon-eu_reg00625_fd_gl_T',levels:HEIGHT_LEVELS,defaultLevel:2,levelKind:'height',timeDependent:true,forecast:true,defaultZoom:5,opacity:76},
 {id:'icon-eu-rain-1h',modelId:'icon-eu',category:'surface',label:'Niederschlag · 1 Stunde',detail:'Stündliche Niederschlagsmenge · bis etwa +78 h',layer:'dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H',timeDependent:true,forecast:true,defaultZoom:6,opacity:74},
 {id:'icon-eu-rain-3h',modelId:'icon-eu',category:'surface',label:'Niederschlag · 3 Stunden',detail:'Dreistündliche Niederschlagsmenge · bis +120 h',layer:'dwd:Icon-eu_reg00625_fd_sl_TOTPREC03H',timeDependent:true,forecast:true,defaultZoom:5,opacity:74},
 {id:'icon-eu-sigwx',modelId:'icon-eu',category:'significant',label:'SIGWX / Wettercode',detail:'Modelliertes signifikantes Wetter bzw. Wettercode · ICON-EU',layer:'dwd:Icon-eu_reg00625_fd_sl_WW',timeDependent:true,forecast:true,defaultZoom:5,opacity:84,disclaimer:'Modelliertes signifikantes Wetter bzw. Wettercode des ICON-EU-Laufs. Je nach WMS-Verfügbarkeit kann der DWD diese Karte zeitweise nicht bereitstellen.'},

 // ICON Global – komplette auf dem offenen DWD-WMS veröffentlichte ICON-Serie
 {id:'icon-pmsl',modelId:'icon',category:'surface',label:'Bodendruck / MSL',detail:'Globales Luftdruckfeld am Boden',layer:'dwd:Icon_reg025_fd_sl_PMSL',timeDependent:true,forecast:true,defaultZoom:4,opacity:78},
 {id:'icon-t2m',modelId:'icon',category:'surface',label:'Temperatur · 2 Meter',detail:'Globale bodennahe Lufttemperatur',layer:'dwd:Icon_reg025_fd_sl_T2M',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-total-precip',modelId:'icon',category:'surface',label:'Niederschlag · seit Modellstart',detail:'Akkumulierter Gesamtniederschlag',layer:'dwd:Icon_reg025_fd_sl_TOTPREC',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-rain-6h',modelId:'icon',category:'surface',label:'Niederschlag · 6 Stunden',detail:'Sechsstündliche Niederschlagsmenge',layer:'dwd:Icon_reg025_fd_sl_TOTPREC06H',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-rain-24h',modelId:'icon',category:'surface',label:'Niederschlag · 24 Stunden',detail:'24-stündliche Niederschlagsmenge',layer:'dwd:Icon_reg025_fd_sl_TOTPREC24H',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-wind-10m',modelId:'icon',category:'surface',label:'Wind · 10 Meter',detail:'Mittelwind in 10 m über Grund',layer:'dwd:Icon_reg025_fd_sl_UV10M',timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'icon-gh',modelId:'icon',category:'upper-air',label:'Geopotential / Höhenkarte',detail:'Geopotentielle Höhe auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_GH',levels:PRESSURE_LEVELS,defaultLevel:500,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:84},
 {id:'icon-temperature',modelId:'icon',category:'upper-air',label:'Temperatur auf Druckfläche',detail:'Lufttemperatur in der freien Atmosphäre',layer:'dwd:Icon_reg025_fd_pl_T',levels:PRESSURE_LEVELS,defaultLevel:850,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:76},
 {id:'icon-relative-humidity',modelId:'icon',category:'upper-air',label:'Relative Feuchte',detail:'Relative Feuchte auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_RELHUM',levels:PRESSURE_LEVELS,defaultLevel:700,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-upper-wind',modelId:'icon',category:'upper-air',label:'Höhenwind',detail:'Windgeschwindigkeit und -richtung auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_UV',levels:PRESSURE_LEVELS,defaultLevel:300,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:84},
 {id:'icon-omega',modelId:'icon',category:'upper-air',label:'Vertikalbewegung / Omega',detail:'Vertikalbewegung auf Druckflächen',layer:'dwd:Icon_reg025_fd_pl_OMEGA',levels:PRESSURE_LEVELS,defaultLevel:500,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:78},
 {id:'icon-sigwx',modelId:'icon',category:'significant',label:'SIGWX / Wettercode',detail:'Modelliertes signifikantes Wetter bzw. Wettercode · ICON Global',layer:'dwd:Icon_reg025_fd_sl_WW',timeDependent:true,forecast:true,defaultZoom:4,opacity:84,disclaimer:'Modelliertes signifikantes Wetter bzw. Wettercode des ICON-Global-Laufs. Je nach WMS-Verfügbarkeit kann der DWD diese Karte zeitweise nicht bereitstellen.'},

 // ICON-EPS – vollständige öffentlich gelistete Kartenserie
 {id:'icon-eps-pmsl',modelId:'icon-eps',category:'ensemble',label:'Luftdruck MSL',detail:'Ensemble-Luftdruck auf Meereshöhe',layer:'dwd:Icon-eps_reg025_fd_sl_PMSL',timeDependent:true,forecast:true,defaultZoom:4,opacity:78},
 {id:'icon-eps-gh',modelId:'icon-eps',category:'ensemble',label:'Ensemble-Geopotential',detail:'Geopotential auf Druckflächen',layer:'dwd:Icon-eps_reg025_fd_pl_GH',levels:PRESSURE_LEVELS,defaultLevel:500,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:84},
 {id:'icon-eps-temperature-anomaly',modelId:'icon-eps',category:'ensemble',label:'Temperaturanomalie',detail:'Temperaturanomalie auf Druckflächen',layer:'dwd:Icon-eps_reg025_fd_pl_TA',levels:PRESSURE_LEVELS,defaultLevel:850,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:76},
 {id:'icon-eps-wind',modelId:'icon-eps',category:'ensemble',label:'Mittlere Windgeschwindigkeit · Höhe',detail:'Mittlere Windgeschwindigkeit auf Druckflächen',layer:'dwd:Icon-eps_reg025_fd_pl_SP',levels:PRESSURE_LEVELS,defaultLevel:300,levelKind:'pressure',timeDependent:true,forecast:true,defaultZoom:4,opacity:84},
 {id:'icon-eps-wind-10m',modelId:'icon-eps',category:'ensemble',label:'Mittlere Windgeschwindigkeit · 10 m',detail:'Ensemble-Mittelwind in 10 m',layer:'dwd:Icon-eps_reg025_fd_pl_SP10M',timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'icon-eps-rain-24h',modelId:'icon-eps',category:'ensemble',label:'Niederschlag · 24 Stunden',detail:'24-stündlicher Ensemble-Niederschlag',layer:'dwd:Icon-eps_reg025_fd_sl_TOTPREC24H',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'icon-eps-gust-12h',modelId:'icon-eps',category:'ensemble',label:'Windböen · 12 Stunden',detail:'Überschreitungswahrscheinlichkeit der 10-m-Böen',layer:'dwd:Icon-eps_reg025_fd_sl_VMAX10M12H',timeDependent:true,forecast:true,defaultZoom:4,opacity:80},

 // AICON
 {id:'aicon-pmsl',modelId:'aicon',category:'surface',label:'Bodendruck / MSL',detail:'Luftdruck MSL aus AICON',layer:'dwd:Aicon_reg025_fd_sl_PMSL',timeDependent:true,forecast:true,defaultZoom:4,opacity:78},
 {id:'aicon-t2m',modelId:'aicon',category:'surface',label:'Temperatur · 2 Meter',detail:'Bodennahe Lufttemperatur aus AICON',layer:'dwd:Aicon_reg025_fd_sl_T',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'aicon-total-precip',modelId:'aicon',category:'surface',label:'Niederschlag · seit Modellstart',detail:'Akkumulierter Niederschlag aus AICON',layer:'dwd:Aicon_reg025_fd_sl_TOTPREC',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'aicon-rain-6h',modelId:'aicon',category:'surface',label:'Niederschlag · 6 Stunden',detail:'Sechsstündlicher Niederschlag aus AICON',layer:'dwd:Aicon_reg025_fd_sl_TOTPREC06H',timeDependent:true,forecast:true,defaultZoom:4,opacity:74},
 {id:'aicon-wind-10m',modelId:'aicon',category:'surface',label:'Wind · 10 Meter',detail:'Mittelwind in 10 m aus AICON',layer:'dwd:Aicon_reg025_fd_sl_UV10M',timeDependent:true,forecast:true,defaultZoom:4,opacity:82},
 {id:'aicon-sigwx',modelId:'aicon',category:'significant',label:'SIGWX / Wettercode',detail:'Modelliertes signifikantes Wetter bzw. Wettercode · AICON',layer:'dwd:Aicon_reg025_fd_sl_WW',timeDependent:true,forecast:true,defaultZoom:4,opacity:84,disclaimer:'Modelliertes signifikantes Wetter bzw. Wettercode des AICON-Laufs. Je nach WMS-Verfügbarkeit kann der DWD diese Karte zeitweise nicht bereitstellen.'},

 // Signifikantes Wetter / NowCastMIX
 {id:'significant-analysis',modelId:'nowcastmix',category:'significant',label:'Signifikantes Wetter',detail:'Autowarn-Polygone für signifikante Wettererscheinungen',layer:'dwd:Autowarn_Analyse',timeDependent:false,defaultZoom:6,opacity:90,disclaimer:'NowCastMIX-Analyse: Polygone erscheinen nur dort, wo aktuell signifikante Wettererscheinungen erkannt werden. Keine amtliche Einzelwarnung.'},
 {id:'significant-forecast',modelId:'nowcastmix',category:'significant',label:'Signifikantes Wetter · +60 Minuten',detail:'Verlagerungsprognose signifikanter Wettererscheinungen',layer:'dwd:Autowarn_Vorhersage',timeDependent:false,forecast:true,defaultZoom:6,opacity:90,disclaimer:'NowCastMIX-Verlagerungsprognose bis +60 min; Polygone erscheinen nur bei erkannten Ereignissen.'},
 {id:'significant-cells',modelId:'nowcastmix',category:'significant',label:'Gewitterzellen',detail:'Automatisch erkannte konvektive Zellen aus NowCastMIX',layer:'dwd:Gewitterzellen',timeDependent:false,defaultZoom:7,opacity:92},
 {id:'significant-clusters',modelId:'nowcastmix',category:'significant',label:'Gewittercluster',detail:'Spuren und Zentroide konvektiver Zellcluster',layer:'dwd:Gewittercluster',timeDependent:false,defaultZoom:7,opacity:92},
 {id:'significant-lightning',modelId:'nowcastmix',category:'significant',label:'Blitz-Kurzzeitvorhersage · 0 bis +2 h',detail:'NowCastELEC-Polygone für detektierte und prognostizierte Blitze',layer:'dwd:NCEW_EU',timeDependent:true,forecast:true,defaultZoom:6,opacity:90}
];

export function weatherMapProductsForModel(modelId:WeatherMapModelId){return WEATHER_MAP_PRODUCTS.filter(product=>product.modelId===modelId)}
export function weatherMapProduct(productId:string){return WEATHER_MAP_PRODUCTS.find(product=>product.id===productId)??WEATHER_MAP_PRODUCTS[0]}
export function weatherMapModel(modelId:WeatherMapModelId){return WEATHER_MAP_MODELS.find(model=>model.id===modelId)??WEATHER_MAP_MODELS[0]}
export function weatherMapWmsProxy(){const configured=configuredWorkerBase('radar');if(!configured)return'';return buildWorkerUrl(configured,'weather-map-wms',{provider:'dwd'}).toString()}
export async function loadWeatherMapMetadata(layer:string,signal?:AbortSignal){return fetchWorkerJson<WeatherMapMetadata>('weather-map-metadata',{layer},{purpose:'radar',signal,timeoutMs:12000,maxAgeMs:5*60000,staleIfErrorMs:30*60000,cacheKey:layer})}
export function preferredWeatherMapTimeIndex(times:string[],reference=Date.now()){if(!times.length)return 0;const parsed=times.map(value=>Date.parse(value)),firstCurrent=parsed.findIndex(value=>Number.isFinite(value)&&value>=reference-15*60000);if(firstCurrent>=0)return firstCurrent;let best=0,distance=Infinity;parsed.forEach((value,index)=>{const next=Math.abs(value-reference);if(Number.isFinite(next)&&next<distance){distance=next;best=index}});return best}

export async function loadWeatherMapGrid(modelId:WeatherMapModelId,lat:number,lon:number,signal?:AbortSignal){return fetchWorkerJson<WeatherMapGridData>('weather-map-grid',{model:modelId,lat,lon},{purpose:'radar',signal,timeoutMs:24000,maxAgeMs:10*60000,staleIfErrorMs:30*60000,cacheKey:`weather-map-grid:${modelId}:${lat.toFixed(2)}:${lon.toFixed(2)}`})}
const lastWeatherPhaseGrid=new Map<string,WeatherPhaseGridData>();
export async function loadWeatherPhaseGrid(lat:number,lon:number,targetTime:string,signal?:AbortSignal){const parsed=Date.parse(targetTime),quarter=15*60000,normalizedTarget=Number.isFinite(parsed)?new Date(Math.round(parsed/quarter)*quarter).toISOString():targetTime,locationKey=`${(Math.round(lat*20)/20).toFixed(2)}:${(Math.round(lon*20)/20).toFixed(2)}`;try{const data=await fetchWorkerJson<WeatherPhaseGridData>('precipitation-phase-grid',{lat,lon,target:normalizedTarget},{purpose:'radar',signal,timeoutMs:28000,maxAgeMs:10*60000,staleIfErrorMs:20*60000,cacheKey:`precipitation-phase-grid:${locationKey}:${normalizedTarget.slice(0,16)}`});if(!data.error)lastWeatherPhaseGrid.set(locationKey,data);return data}catch(error){const message=error instanceof Error?error.message:String(error),cached=lastWeatherPhaseGrid.get(locationKey),cachedMs=Date.parse(cached?.frame?.time||''),targetMs=Date.parse(normalizedTarget);if(/(?:request|rate|minute|minutes|429).*limit|limit.*(?:request|rate|minute|minutes)|too many requests/i.test(message)&&cached&&Number.isFinite(cachedMs)&&Number.isFinite(targetMs)&&Math.abs(cachedMs-targetMs)<=45*60000)return{...cached,targetTime:normalizedTarget,stale:true,fallbackReason:'Open-Meteo-Minutenlimit: letztes lokal vorhandenes Phasenfeld wird vorübergehend weiterverwendet.'};throw error}}
