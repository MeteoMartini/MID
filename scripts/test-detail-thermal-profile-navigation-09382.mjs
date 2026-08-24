import {readFile} from 'node:fs/promises';
const [app,cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 'function detailThermalFeel(hour:Hour):DetailThermalFeel',
 "if(felt>38){label='sehr heiß'",
 "else if(felt>=32){label='heiß'",
 "else if(felt>=26){label='warm'",
 "else if(felt>=20){label='leicht warm'",
 "else if(felt>=0){label='behaglich'",
 'thermalFeelHeight=narrowChart?10:12',
 'const thermalFeelTop=sectionCursor,thermalFeelBottom=thermalFeelTop+thermalFeelHeight',
 'className="detail-thermal-feel-bg"',
 'className={`detail-thermal-feel-band${i===selectedHour?\' active\':\'\'}`}',
 'Thermisches Empfinden: {currentThermal.label} · {currentThermal.burden}'
])need('Tagesdetail-Thermik',app,token);
const temperaturePosition=app.indexOf('const tempTop=sectionCursor'),thermalPosition=app.indexOf('const thermalFeelTop=sectionCursor'),pressurePosition=app.indexOf('const pressureTop=sectionCursor');
if(!(temperaturePosition>=0&&thermalPosition>temperaturePosition&&pressurePosition>thermalPosition))failures.push('Thermisches Empfinden liegt geometrisch nicht zwischen Temperatur und Luftdruck.');
for(const token of [
 'chartPlotRef=useRef<SVGSVGElement|null>(null)',
 'profileWheelGateRef=useRef(0)',
 'const moveProfileHour=(delta:-1|1)',
 "event.key!=='ArrowLeft'&&event.key!=='ArrowRight'",
 "plot.addEventListener('wheel',wheel,{passive:false})",
 'tabIndex={0} role="application" aria-label="24-Stunden-Wetterprofil. Pfeil links und rechts wechseln stündlich; das Mausrad wirkt nur über der Diagrammfläche."',
 'className="cockpit-weather-profile__stepper"',
 'aria-label="Vorheriger Zeitpunkt"',
 'aria-label="Nächster Zeitpunkt"',
 'function shortTermImpactDetail(impact:ShortTermImpact,point:ShortTermForecastPoint,unit:WindUnit)',
 "impact.reason.replace(/\\b\\d+(?:[.,]\\d+)?\\s*km\\/h\\b/g,selectedWind)",
 'detail:shortTermImpactDetail(maxImpact,maxImpactPoint,unit)',
 'shortTermWindDetail(selectedPoint,unit)',
 'compactGustLabel(point.gust,unit)'
])need('24h-Bedienung/Einheiten',cockpit,token);
for(const token of ['.detail-thermal-feel-bg{','.detail-thermal-feel-band.active{','.hour-tooltip-grid.compact .hour-tooltip-thermal-feel{','.cockpit-weather-profile__stepper{','.cockpit-weather-profile .cockpit-meteogram-pro__canvas:focus-visible{'])need('Styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('Tagesdetail-/24h-Profil-Erweiterung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tagesdetail-Thermik sowie 24h-Pfeil-/Mausradbedienung und einheitentreue Böenanzeige geprüft.');
