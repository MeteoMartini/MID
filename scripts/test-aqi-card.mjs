import {readFile} from 'node:fs/promises';

const [app,weather,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 'function AqiIndicator',
 'EUROPEAN_AQI_BANDS',
 'dominantEuropeanAqi',
 'AQI erklären',
 'Der Gesamt-AQI entspricht dem höchsten Teilindex aus PM2,5, PM10, NO₂, O₃ und SO₂',
 'Feinstaub wird über gleitende 24-Stunden-Mittel',
 "<AqiIndicator value={airAqi}/>",
 "className={x.label==='Luftqualität'?'air-quality-card':undefined}"
]){
 if(!app.includes(token))failures.push(`AQI-Karte unvollständig: ${token}`);
}
for(const token of [
 'european_aqi_pm2_5',
 'european_aqi_pm10',
 'european_aqi_nitrogen_dioxide',
 'european_aqi_ozone',
 'european_aqi_sulphur_dioxide',
 'sulphur_dioxide'
]){
 if(!weather.includes(token))failures.push(`AQI-Teilindex wird nicht geladen: ${token}`);
}
for(const token of [
 '.aqi-indicator{',
 '.aqi-marker{',
 'transform:rotate(45deg)',
 '.aqi-segments{',
 'grid-template-columns:repeat(6',
 '.aqi-segments>i.active',
 '.metrics .air-quality-card header>.mode-info'
]){
 if(!styles.includes(token))failures.push(`AQI-Indikatordesign fehlt: ${token}`);
}
if(failures.length){
 console.error(`AQI-Kartenprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('AQI-Karte geprüft: Erklärung, fünf Teilindizes, dominanter Schadstoff und eigenständiger sechsstufiger Indikator sind vorhanden.');
