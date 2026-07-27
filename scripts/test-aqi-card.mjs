import {readFile} from 'node:fs/promises';

const [app,weather,airQuality,styles,worker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/airQuality.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,label)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['function AqiIndicator','function AirQualityExplanation','classifyEuropeanAirQuality','Einzelwerte am Standort','Nächstgelegene EEA-Messstation','<AqiIndicator result={airClassification}/>'])need(app,token,'AQI-Karte unvollständig');
for(const token of ["label:'Gut'","label:'Mittelmäßig'","label:'Mittel'","label:'Schlecht'","label:'Sehr schlecht'","label:'Äußerst schlecht'",'#50F0E6','#50CCAA','#F0E641','#FF5050','#960032','#7D2181','thresholds:[5,15,50,90,140]','thresholds:[15,45,120,195,270]','thresholds:[60,100,120,160,180]','thresholds:[10,25,60,100,150]','thresholds:[20,40,125,190,275]'])need(airQuality,token,'Offizielle EU-AQI-Klassifikation fehlt');
for(const token of ['pm10','pm2_5','nitrogen_dioxide','sulphur_dioxide','ozone','airQualityStation'])need(weather,token,'AQI-Datenabruf unvollständig');
for(const token of ['EEA_AIR_QUALITY_STATION_ENDPOINTS','nearestEeaAirQualityStation','AQStationName','AirQualityStationEoICode',"mode==='air-quality-station'"])need(worker,token,'EEA-Messstationsmetadaten fehlen');
for(const token of ['.aqi-indicator{','.aqi-marker{','transform:rotate(45deg)','.aqi-segments{','grid-template-columns:repeat(6','.aqi-segments>i.active','.aqi-tooltip-values{'])need(styles,token,'AQI-Indikatordesign fehlt');
if(app.includes('Feinstaub wird über gleitende 24-Stunden-Mittel'))failures.push('Veraltete 24-h-Erklärung ist noch aktiv.');
if(failures.length){console.error(`AQI-Kartenprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('AQI-Karte geprüft: offizielle sechsstufige EEA-Bänder/Farben, stündliche Einzelwerte und nächstgelegene EEA-Messstation sind verdrahtet.');
