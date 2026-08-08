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
 'timeLabelStep=chartViewportWidth<=1100?6:3',
 'chartPoints.map(item=><WeatherPictogram',
 'className="temperature-extreme max"',
 'className="temperature-extreme min"',
 'profileLegendVisible',
 "profileLegendVisible?'Legende ausblenden':'Legende einblenden'",
 'cockpit-weather-profile__icon-toggle',
 'Temperatur + gefühlt',
 'Taupunkt + Schwüle',
 'Sichtweite + Nebelrisiko',
 'calmWindowRelevant=Boolean(calmWindow&&calmWindow.hours>=3',
 "label:'Wetterberuhigung'",
 'formatProfilePointTime(maxImpactPoint)',
 'Math.abs(currentCloud-previousCloud)>=35'
])need('24-h-Wetterprofil v0.9.32.3',cockpit,token);
for(const token of ['Ruhiges Fenster','chartHeight=474','/^(00|03|06|09|12|15|18|21):/.test(point.timeLabel)'])reject('Altvertrag',cockpit,token);
for(const token of [
 '.cockpit-weather-profile .cockpit-meteogram-pro__canvas{height:auto;min-height:446px}',
 'filter:contrast(1.18)',
 '.cockpit-weather-profile__toolbar{',
 '.cockpit-weather-profile .temperature-extreme.max',
 '.cockpit-weather-profile .temperature-extreme.min'
])need('Styles v0.9.32.3',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);if(pv!=='0.9.32.3')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.32.3 Wetterprofil-Layoutprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.3: kompakteres Wetterprofil, adaptive Signale, stündliche Piktogramme, Tagesextreme und kombinierte Datenfelder geprüft.');
