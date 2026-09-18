import {readFile} from 'node:fs/promises';

const [radar,cockpit,maps,data,styles,worker,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of ["buildWorkerUrl(base,'dwd-precipitation-type-image'",'dwd-precip-type-radar__original-viewport','changeZoom','x-mid-radar-at','x-mid-satellite-at'])need('DWD-Livebild',radar,token);
for(const token of ['[hourlyExpanded,setHourlyExpanded]=useState(false)',"hourlyExpanded?'weniger anzeigen':'mehr anzeigen'",'24-h-Wetterprofil','Math.round(selectedPoint.dewPoint)'])need('24h mobil/Profil',cockpit,token);
for(const token of ['.cockpit-hourly-preview.collapsed>.cockpit-hourly-chip:nth-child(n+7){display:none}','.cockpit-hourly-more{display:inline-flex}','.dwd-precip-type-radar__original-viewport{'])need('Responsive CSS',styles,token);
for(const token of ['icon-d2-pressure-thetae','icon-d2-pressure-sigwx','icon-d2-pressure-precip','loadWeatherMapGrid'])need('ICON-D2-Karten',data,token);
for(const token of ['className="weather-maps-map-status"','className="weather-maps-controls"','className="weather-maps-timeline"','className="weather-maps-meta-details"','leadTimeLabel(selectedTime,referenceTime)','referenceTimeLabel(referenceTime,timezone)'])need('Kartenzeit und Laufdetails',maps,token);
reject('Keine doppelte alte Gültigkeitsbox',maps,'className="weather-maps-validity"');
reject('Keine zweite Zeitschrittauswahl',maps,'<label><span>Zeitschritt</span>');
for(const token of ["mode==='dwd-precipitation-type-image'","mode==='weather-map-grid'"])need('Worker',worker,token);
if(!baseline.includes('scripts/test-mid-09260-live-source-mobile-maps.mjs'))failures.push('Baseline-Test fehlt');

if(failures.length){
 console.error('Live-Quellen-/24h-/Wetterkartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('DWD-Originalprodukt, mobile 24-h-Aufklappung sowie gemeinsame Wetterkarten-Zeitachse mit einklappbaren Laufdetails geprüft.');
