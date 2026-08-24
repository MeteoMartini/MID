import {readFile} from 'node:fs/promises';
const [cockpit,shortTerm,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 "const PROFILE_LEGEND_KEY='mid:forecastCockpit:profileLegendVisible'",
 'useState(readProfileLegendVisible)',
 "localStorage.setItem(PROFILE_LEGEND_KEY,profileLegendVisible?'1':'0')",
 "label:'Stärkste Einschränkung'",
 'summarizeDwdWarnings(horizon.map(shortTermHourWarningSample),elevation,24)',
 'shortTermImpactForInterval(profileHazardSignals',
 'DWD_WARNING_COLORS[level]',
 'dailyMaxMarkers=chartDayBands.flatMap',
 'dailyMinMarkers=chartDayBands.flatMap',
 'temperatureExtremes=[...dailyMaxMarkers,...dailyMinMarkers]',
 'profile-axis precipitation-axis"><line className="profile-axis-spine" x1={chartPaddingLeft}',
 'profile-axis wind-axis"><line className="profile-axis-spine" x1={chartPaddingLeft}',
 'cockpit-weather-profile__data-title',
 'profileDetailInfoOpen',
 "relativePointTime=(point:ShortTermForecastPoint)=>`${dateOnlyFromEpoch(point.epoch,timezone)===todayDate?'heute':'morgen'} ${point.timeLabel}`",
 'relativePointTime(peakWarmPoint)',
 'relativePointTime(coolestPoint)',
 'relativePointTime(peakGustPoint)',
 'relativePointTime(peakRainPoint)'
])need('Wetterprofil/24-h-Leiste',cockpit,token);
for(const token of ['Wetterberuhigung','Max. Wetter-Hazard','Stündlich · ein Blick','Seitlich wischbar – mobil flach verdichtet','function shortTermCalmWindow('])reject('Entfernte Alttexte/-logik',cockpit,token);
for(const token of ['rain:number;','showers:number;','snowfall:number;','rain:signal.rain','showers:signal.showers','snowfall:signal.snowfall'])need('Kurzfrist-Niederschlagskomponenten',shortTerm,token);
for(const token of [
 '.cockpit-weather-profile__signals .impact-level-1{border-color:#e6c229}',
 '.cockpit-weather-profile__signals .impact-level-2{border-color:#ef8d32}',
 '.cockpit-weather-profile__signals .impact-level-3{border-color:#e74a4a}',
 '.cockpit-weather-profile__signals .impact-level-4{border-color:#9b59c6}',
 '.cockpit-weather-profile__icon-toggle.compact{',
 '.cockpit-weather-profile__data-title{'
])need('Styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID v0.9.32.6 Wetterprofil-UX/Hazard-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: persistente Legende, zentrale Warnschwellen/-farben, linke Achsen, appweit konsistente Tages-Tmin/Tmax und bereinigte 24-h-Texte geprüft.');
