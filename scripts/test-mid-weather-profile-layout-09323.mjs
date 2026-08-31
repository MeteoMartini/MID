import {readFile} from 'node:fs/promises';
const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 'chartHeight=632',
 'chartCanvasHeight=chartHeight',
 'timeLabelStepMs=(chartViewportWidth<=560?6:chartViewportWidth<=860?4:3)*3600000',
 'weatherPictogramStep=1',
 'y={78}',
 "const visibleTemperatureExtreme=(kind:'max'|'min')",
 "label:`${Math.round(item.point.temperature)}°`",
 "temperatureExtremes=[visibleTemperatureExtreme('max'),visibleTemperatureExtreme('min')]",
 'className={`temperature-extreme ${extreme.kind}`}',
 'PROFILE_LEGEND_KEY',
 'useState(readProfileLegendVisible)',
 "localStorage.setItem(PROFILE_LEGEND_KEY,profileLegendVisible?'1':'0')",
 "profileLegendVisible?'Legende ausblenden':'Legende einblenden'",
 'cockpit-weather-profile__icon-toggle compact',
 'Stärkste Einschränkung',
 'relativePointTime=(point:ShortTermForecastPoint)',
 'plain/>',
 'onClick={()=>activatePoint(item.point)}'
])need('24-h-Wetterprofil',cockpit,token);
for(const token of ['onPointerDown={()=>activatePoint(item.point)}','onTouchStart={()=>activatePoint(item.point)}'])reject('Mehrfachaktivierung',cockpit,token);
for(const token of ['Wetterberuhigung','Max. Wetter-Hazard','Stündlich · ein Blick','Seitlich wischbar','Darstellung durchgängig einstündig.','Tag antippen: stündlicher Verlauf.','Kompakt pro Tag: Temperaturabweichung · Niederschlagssignal · Wind/Böen · Konsistenz.','Temperatur, gefühlte Temperatur, thermisches Empfinden, Niederschlag, Wind/Böen, Wolkenschichten und Wetter-Hazards in einer gemeinsamen Zeitachse.','Tendenz des Luftdrucks im kurzfristigen Verlauf.','Höchstes Nebel- oder Sichtsignal im dargestellten Zeitraum.','shortTermCalmWindow(','dailyTemperatureExtremes=chartDayBands.flatMap'])reject('Altvertrag',cockpit,token);
for(const token of [
 '.cockpit-weather-profile .cockpit-meteogram-pro__canvas{height:auto;min-height:0}',
 '.cockpit-weather-profile__icon-toggle.compact{',
 '.cockpit-weather-profile__data-title{',
 '.cockpit-weather-profile__signals .impact-level-1{border-color:#e6c229}',
 '.cockpit-weather-profile__signals .impact-level-4{border-color:#9b59c6}'
])need('Styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID Wetterprofil-Layoutprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: responsives Wetterprofil, persistente Legende, 24-h-Tmin/Tmax und kompakte Info-Schaltflächen geprüft.');
