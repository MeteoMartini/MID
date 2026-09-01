import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const foundation=read('src/styles-src/00-foundation.css');
const features=read('src/styles-src/10-features.css');
const trend=read('src/SubseasonalTrendPanel.tsx');
const longRange=read('src/LongRangePanel.tsx');
const app=read('src/App.tsx');
const meteogram=read('src/MeteogramPanel.tsx');
const ensemble=read('src/EnsemblePanel.tsx');
for(const token of ['--param-temperature:','--param-temperature-min:','--param-temperature-max:','--param-precipitation:','--param-pressure:','--param-wind:','--param-gust:','--param-cloud:','--param-sunshine:']){
 if(!foundation.includes(token))throw new Error(`Parameter-Farbtoken fehlt: ${token}`);
}
for(const marker of ['modellkonsistente ECMWF-EC46-Klimamittel','climate-reference-line','metric===\'cloud\'','min:0,max:100','Math.max(940','Math.min(1060','windUnit:WindUnit','windUnit={windUnit}','weekly:WEEKLY_VARIABLES','pressure_msl_anomaly','cloud_cover_anomaly','wind_speed_10m_anomaly','subseasonal-metric-selector']){
 if(!trend.includes(marker))throw new Error(`Trend-14d+-Vertrag fehlt: ${marker}`);
}
if(!features.includes('.subseasonal-chart svg{min-width:0!important;width:100%!important}'))throw new Error('Mobile Trenddiagramme dürfen keinen erzwungenen Horizontal-Scroll haben.');
if(!features.includes('.subseasonal-head .long-range-head-actions{position:absolute'))throw new Error('Mobile Refresh/Info-Buttons sind nicht platzsparend im Kopf verankert.');
if(!longRange.includes('windUnit:WindUnit')||!app.includes('windUnit={unit}'))throw new Error('Gewählte Windeinheit erreicht die Trendsektion nicht.');
for(const marker of ['var(--param-temperature)','var(--param-pressure)','var(--param-wind)','var(--param-gust)'])if(!meteogram.includes(marker))throw new Error(`Meteogramm nutzt Farbvertrag nicht: ${marker}`);
for(const marker of ['var(--param-wind)','var(--param-gust)'])if(!ensemble.includes(marker))throw new Error(`Ensemble nutzt Farbvertrag nicht: ${marker}`);
console.log('MID v0.9.77.1: appweiter Parameter-Farbvertrag, klimabezogener Trend 14d+, mobile scrollfreie Diagramme, realistische Skalen und Windeinheiten geschützt.');
