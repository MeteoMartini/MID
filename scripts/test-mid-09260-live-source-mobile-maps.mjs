import {readFile} from 'node:fs/promises';
const [radar,map,cockpit,maps,data,styles,worker,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ["buildWorkerUrl(base,'dwd-precipitation-type-image'","response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')",'Originales DWD-Kombinationsbild · unverändert'])need('Live-Quellenprüfung',radar,token);
reject('Kein rekonstruierter Satellitenlayer',radar,'loadCompositeTimes');
for(const token of ['minimum=Number.isFinite(target)?target-15*60000:now-90*60000','ageMinutes>90','Kein frischer HymecNG-Datensatz verfügbar'])need('HymecNG-Freshness',worker,token);
reject('Kein beliebiger alter HymecNG-Fallback',worker,"selected=Number.isFinite(target)?eligible.sort((a,b)=>Math.abs(a.dataTime-target)-Math.abs(b.dataTime-target))[0]:entries.at(-1)");
for(const token of ['[hourlyExpanded,setHourlyExpanded]=useState(false)',"hourlyExpanded?'weniger anzeigen':'mehr anzeigen'",'<dt><i className="dew"/>Taupunkt</dt><dd>{Math.round(selectedPoint.dewPoint)} °C</dd>'])need('24h mobil/Taupunkt',cockpit,token);
for(const token of ['.cockpit-hourly-preview.collapsed>.cockpit-hourly-chip:nth-child(n+7){display:none}','.cockpit-hourly-more{display:inline-flex}','.weather-maps-validity{'])need('Responsive CSS',styles,token);
for(const token of ['icon-d2-pressure-thetae','icon-d2-pressure-sigwx','icon-d2-pressure-precip','loadWeatherMapGrid'])need('ICON-D2-Kombinationskarten',data,token);
for(const token of ['className="weather-maps-validity"','<small>INIT</small>','<small>GÜLTIG</small>','WeatherMapGridOverlay'])need('Gültigkeitsanzeige',maps,token);
for(const token of ["modelCandidates=['dwd_icon_d2','icon_d2']",'pressure_msl,temperature_850hPa,relative_humidity_850hPa,weather_code,precipitation',"mode==='weather-map-grid'"])need('ICON-D2 Worker',worker,token);
if(!baseline.includes('scripts/test-mid-09260-live-source-mobile-maps.mjs'))failures.push('Baseline-Test fehlt');
if(failures.length){console.error('Live-Quellen-/24h-/Wetterkartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Live-Quellen, mobile 24-h-Aufklappung, ganzzahliger Taupunkt, ICON-D2-Kombinationskarten und Gültigkeitszeiten erfolgreich geprüft.');
