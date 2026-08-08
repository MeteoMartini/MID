import {readFile} from 'node:fs/promises';

const [cockpit,shortTerm,ensemble,styles]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};

for(const token of [
  'function shortTermThermalFeel(point:ShortTermForecastPoint)',
  "if(felt>38){label='sehr heiß'",
  "else if(felt>=32){label='heiß'",
  "else if(felt>=26){label='warm'",
  "else if(felt>=20){label='leicht warm'",
  "else if(felt>=0){label='behaglich'",
  "else if(felt>=-13){label='leicht kühl'",
  "else if(felt>=-26){label='kühl'",
  "else if(felt>=-39){label='kalt'",
  "label='sehr kalt'",
  'function shortTermFogRisk(point:ShortTermForecastPoint)',
  'className="selected-time-line"',
  "dateValue!==chartPoints[0]?.dateValue?'other-day':''",
  "<small>{formatDate(item.dateValue,{day:'2-digit',month:'2-digit'})}</small>",
  'SvgProfileWindDirectionArrow',
  'windSignalColor(gust)',
  'chartPoints.map(item=><SvgProfileWindDirectionArrow',
  "shortTermCloudGradientStops(chartPoints,chartPaddingLeft,chartPlotWidth,'highCloud')",
  "shortTermCloudGradientStops(chartPoints,chartPaddingLeft,chartPlotWidth,'midCloud')",
  "shortTermCloudGradientStops(chartPoints,chartPaddingLeft,chartPlotWidth,'lowCloud')",
  'Math.abs(currentCloud-previousCloud)>=35',
  'className="cloud-band high"',
  'className="cloud-band mid"',
  'className="cloud-band low"',
  'Thermisches Empfinden',
  'Temperatur + gefühlt',
  ' K</dd>',
  'Schwüle',
  'Wolken H/M/L',
  'Wetter-Hazards',
  'Thermische Einordnung nach den DWD-Klassen der Gefühlten Temperatur'
])need('24-h-Wetterprofil',cockpit,token);
for(const token of ['shortTermCloudBaseApprox','Wolkenbasis*'])reject('24-h-Wetterprofil',cockpit,token);

need('Kurzfristdaten',shortTerm,'sunshineDuration?:number;');
need('Kurzfristdaten',shortTerm,'sunshineDuration:base.sunshineDuration');

for(const token of [
  'const value=clamp((clamp(sunShare,0,1)-.5)/.5,0,1)',
  '<b>100 %</b><em>≤ 50 %</em>',
  '50 Prozent oder weniger',
  '50 % oder weniger der astronomisch möglichen Sonnenscheindauer ist bereits Grau'
])need('Ensemble-Sonnenband',ensemble,token);

for(const token of [
  '.cockpit-weather-profile .selected-time-line',
  '.cockpit-weather-profile .thermal-feel-band',
  '.cockpit-weather-profile .profile-wind-direction-arrow',
  '.cockpit-meteogram-pro__overlay.time>span.other-day b'
])need('Styles',styles,token);

const high=cockpit.indexOf('className="cloud-band high"'),mid=cockpit.indexOf('className="cloud-band mid"'),low=cockpit.indexOf('className="cloud-band low"');
if(high<0||mid<0||low<0||!(high<mid&&mid<low))failures.push('Wolkenreihenfolge muss visuell H oben, M mittig, L unten sein.');
if(cockpit.includes('cloudBandGap'))failures.push('Zwischen Wolkenschichten darf kein cloudBandGap bestehen.');

if(failures.length){
 console.error('MID v0.9.32.0 24-h-Thermik-/Hazard-/Ensemble-Sonnenband-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('MID v0.9.32.0: 24-h-Auswahl, Thermik/Hazards, Windpfeile, Wolkenfading und Ensemble-Sonnenband erfolgreich geprüft.');
