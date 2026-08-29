import {readFile} from 'node:fs/promises';

const [cockpit,shortTerm,fogRisk,ensemble,styles]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/shortTermFogRisk.ts',import.meta.url),'utf8'),
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
  "import {shortTermFogRisk} from './shortTermFogRisk';",
  'className="selected-time-line"',
  "dateValue!==chartPoints[0]?.dateValue?'other-day':''",
  "<small>{formatDate(item.dateValue,{day:'2-digit',month:'2-digit'})}</small>",
  'SvgProfileWindDirectionArrow',
  'windSignalColor(gust)',
  'chartPoints.map(item=><SvgProfileWindDirectionArrow',
  'function shortTermCloudCellGradient(point:ShortTermForecastPoint,previous:ShortTermForecastPoint|undefined,next:ShortTermForecastPoint|undefined,key:CloudProfileLayer)',
  'cloudCellInset(item.columnWidth)',
  'cloud-cell-frame high',
  'cloud-cell-frame mid',
  'cloud-cell-frame low',
  'className="cloud-cell-frame high"',
  'className="cloud-cell-frame mid"',
  'className="cloud-cell-frame low"',
  'Thermisches Empfinden',
  'Temperatur / gefühlt / Taupunkt',
  ' K</dd>',
  'Schwüle',
  'Wolken hoch / mittel / tief + UVI',
  'Wetter-Hazards',
  'Thermische Einordnung nach den DWD-Klassen der Gefühlten Temperatur'
])need('24-h-Wetterprofil',cockpit,token);
for(const token of ['shortTermCloudBaseApprox','Wolkenbasis*'])reject('24-h-Wetterprofil',cockpit,token);
need('Nebelrisiko',fogRisk,'export function shortTermFogRisk(point:ShortTermFogRiskPoint):ShortTermFogRiskResult');
need('Nebelrisiko',fogRisk,'if(point.isDay&&!explicitFog&&!restrictedVisibility)score=Math.min(score,14)');

need('Kurzfristdaten',shortTerm,'sunshineDuration?:number|null;');
need('Kurzfristdaten',shortTerm,'const rawSunshineDuration=isQuarterInterval?');
need('Kurzfristdaten',shortTerm,'coherentSunshineDurationSeconds');

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

const high=cockpit.indexOf('className="cloud-cell-frame high"'),mid=cockpit.indexOf('className="cloud-cell-frame mid"'),low=cockpit.indexOf('className="cloud-cell-frame low"');
if(high<0||mid<0||low<0||!(high<mid&&mid<low))failures.push('Wolkenreihenfolge muss visuell H oben, M mittig, L unten sein.');
if(cockpit.includes('cloudBandGap'))failures.push('Zwischen Wolkenschichten darf kein cloudBandGap bestehen.');

if(failures.length){
 console.error('MID v0.9.32.0 24-h-Thermik-/Hazard-/Ensemble-Sonnenband-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('MID v0.9.32.0: 24-h-Auswahl, Thermik/Hazards, Windpfeile, Wolkenfading und Ensemble-Sonnenband erfolgreich geprüft.');
