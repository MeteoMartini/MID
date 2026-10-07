import {weatherMapProductsForModel,WEATHER_MAP_MODELS,type WeatherMapModelId} from './WeatherMapsData';
/** Distinct accumulations, height levels, probabilities and instantaneous values must not be conflated. */
const PARAMETERS:Record<string,string>={
 'gdps-cloud':'cloud',
 'icon-eu-qff':'pressure','icon-pmsl':'pressure','icon-eps-pmsl':'ensemble-pressure','aicon-pmsl':'pressure',
 'icon-t2m':'temperature','aicon-t2m':'temperature',
 'icon-eu-temperature-height':'height-temperature','icon-temperature':'temperature-level',
 'icon-eu-rain-12h':'rain-12h','icon-rain-12h':'rain-12h',
 'icon-eu-rain-1h':'precipitation','icon-eu-rain-3h':'rain-3h','icon-rain-6h':'rain-6h','aicon-rain-6h':'rain-6h',
 'icon-rain-24h':'rain-24h','icon-eps-rain-24h':'ensemble-rain-24h','icon-total-precip':'total-precip','aicon-total-precip':'total-precip',
 'icon-wind-10m':'wind','aicon-wind-10m':'wind','icon-upper-wind':'upper-wind','icon-eps-wind-10m':'ensemble-wind',
 'icon-gh':'geopotential','icon-eps-gh':'ensemble-geopotential','icon-relative-humidity':'humidity','icon-omega':'omega',
 'icon-eps-temperature-anomaly':'temperature-anomaly','icon-eps-wind':'ensemble-upper-wind','icon-eps-gust-12h':'gust-probability'
};
export const UNIFIED_WMS_PARAMETERS=[
 {id:'ensemble-pressure',label:'Ensemble-Bodendruck · MSL',detail:'DWD-Ensembleprodukt'},
 {id:'height-temperature',label:'Temperatur · Höhe über Grund',detail:'Höhe in Metern'},
 {id:'temperature-level',label:'Temperatur · Druckfläche',detail:'Druckfläche in hPa'},
 {id:'rain-3h',label:'Niederschlag · 3 h',detail:'Rollende 3-h-Summe'},
 {id:'rain-12h',label:'Niederschlag · 12 h',detail:'Rollende 12-h-Summe'},
 {id:'rain-6h',label:'Niederschlag · 6 h',detail:'Rollende 6-h-Summe'},
 {id:'rain-24h',label:'Niederschlag · 24 h',detail:'Rollende 24-h-Summe'},
 {id:'total-precip',label:'Niederschlag · seit Modellstart',detail:'Akkumulation desselben Laufs'},
 {id:'upper-wind',label:'Höhenwind',detail:'Gewählte Druckfläche'},
 {id:'geopotential',label:'Geopotentielle Höhe',detail:'Gewählte Druckfläche'},
 {id:'humidity',label:'Relative Feuchte · Höhe',detail:'Gewählte Druckfläche'},
 {id:'omega',label:'Vertikalbewegung · Omega',detail:'Drucktendenz der Vertikalbewegung, keine Windgeschwindigkeit'},
 {id:'ensemble-rain-24h',label:'Ensemble-Niederschlag · 24 h',detail:'DWD-Ensembleprodukt'},
 {id:'ensemble-wind',label:'Ensemble-Mittelwind · 10 m',detail:'Ensemblemittel, keine Böe'},
 {id:'ensemble-upper-wind',label:'Ensemble-Mittelwind · Höhe',detail:'Gewählte Druckfläche'},
 {id:'ensemble-geopotential',label:'Ensemble-Geopotential',detail:'Gewählte Druckfläche'},
 {id:'temperature-anomaly',label:'Ensemble-Temperaturanomalie',detail:'DWD-Modellreferenz'},
 {id:'gust-probability',label:'Böenwahrscheinlichkeit · 12 h',detail:'DWD-Überschreitungsprodukt, keine Böengeschwindigkeit'}
];
export function unifiedWmsChoices(){return WEATHER_MAP_MODELS.flatMap(model=>weatherMapProductsForModel(model.id).filter(p=>!p.source&&PARAMETERS[p.id]).flatMap(product=>[{parameter:PARAMETERS[product.id],model,product},...(product.id==='icon-eu-temperature-height'?[{parameter:'temperature',model,product:{...product,id:'icon-eu-temperature-2m',levels:[2],defaultLevel:2}}]:[])]))}
export function unifiedWmsProduct(parameter:string,model:WeatherMapModelId){return unifiedWmsChoices().find(p=>p.parameter===parameter&&p.model.id===model)?.product}
