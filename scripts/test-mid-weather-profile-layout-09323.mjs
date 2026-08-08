import {readFile} from 'node:fs/promises';
const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 'chartHeight=446',
 'function shortTermTickStep(range:number){if(range<=8)return 2;if(range<=18)return 5;if(range<=34)return 10;return 10}',
 'chartCanvasHeight=Math.max(300,Math.round(chartHeight*Math.min(1,chartViewportWidth/chartWidth)))',
 'timeLabelStep=chartViewportWidth<=560?6:chartViewportWidth<=860?4:3',
 'chartPoints.map(item=><WeatherPictogram',
 'dailyTemperatureExtremes=chartDayBands.flatMap',
 'className={`temperature-extreme ${extreme.kind}`}',
 'profileLegendVisible',
 "profileLegendVisible?'Legende ausblenden':'Legende einblenden'",
 'cockpit-weather-profile__icon-toggle',
 'Temperatur + gefühlt',
 'Taupunkt + Schwüle',
 'Sichtweite + Nebelrisiko',
 'calmWindowRelevant=Boolean(calmWindow&&calmWindow.hours>=3',
 "label:'Wetterberuhigung'",
 'formatProfilePointTime(maxImpactPoint)',
 'Math.abs(currentCloud-previousCloud)>=35',
 'plain/>',
 'onPointerDown={()=>activatePoint(item.point)}',
 'title="Erklärtexte anzeigen"'
])need('24-h-Wetterprofil v0.9.32.4',cockpit,token);
for(const token of ['Ruhiges Fenster','chartHeight=474','timeLabelStep=chartViewportWidth<=1100?6:3','<span>(i)</span>'])reject('Altvertrag',cockpit,token);
for(const token of [
 '.cockpit-weather-profile .cockpit-meteogram-pro__canvas{height:auto;min-height:0}',
 '.cockpit-weather-profile__icon-toggle{min-width:32px;width:32px;padding:5px 0}',
 '.cockpit-weather-profile__toolbar{',
 '.cockpit-weather-profile .temperature-extreme.max',
 '.cockpit-weather-profile .temperature-extreme.min'
])need('Styles v0.9.32.4',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);if(!/^0\.9\.32\.[4-9]$/.test(pv))failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID Wetterprofil-Layoutprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: responsiveres Wetterprofil, Tagesextreme je Kalendertag, tap-sichere Trefferflächen und bereinigte Info-Icons geprüft.');
