import {readFile} from 'node:fs/promises';
const [app,cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
 // NoData-Sonnenscheindauer ist keine nachgewiesene 0; bei bekannter Bewölkung
 // darf nur die bestehende, als Näherung verwendete Wolkenlücke einspringen.
 need('Tagesdetail-Thermik NoData',app,'sunshine=Number(hour.sunshineDuration??NaN),cloud=');
 for(const [input,expected] of [[null,NaN],[undefined,NaN],[0,0],[1800,1800],[3600,3600]]){
  const value=Number(input??NaN);
  if(Number.isNaN(expected)?!Number.isNaN(value):value!==expected)failures.push('Sonnenschein-Koerzierung: '+String(input));
 }
 const knownCloud=20,openSkyShare=1-knownCloud/100,missingSun=Number(null??NaN),actualShare=Number.isFinite(missingSun)?missingSun/3600:openSkyShare;
 if(Math.abs(actualShare-.8)>1e-9)failures.push('Null-Sonnenschein muss bei bekannter Bewölkung die Wolkenlücken-Näherung verwenden');



 // Nicht vorhandene Tooltip-Werte sind unbekannt (–), keine erfundenen 0 °C.
 need('Stundentooltip NoData',app,"detailDegree(currentHour.temperature)} / {detailDegree(currentHour.apparent)");
 need('Stundentooltip NoData',app,"detailDegree(currentHour.dewPoint)} · {Number.isFinite(currentHour.humidity)");
 const degreeStart=app.indexOf('const detailDegree='),degreeEnd=app.indexOf('\\nfunction detailSaturationVaporPressureHpa(',degreeStart);
 if(degreeStart<0||degreeEnd<=degreeStart)failures.push('Produktiver NoData-Formatierer fehlt');
 else{
  const expression=app.slice(degreeStart,degreeEnd).replace('(value:number)','(value)');
  const format=new Function(expression+';return detailDegree;')();
  if(format(0)!=='0°'||format(13.5)!=='14°'||format(null)!=='–'||format(undefined)!=='–'||format(NaN)!=='–')failures.push('Fehlende Gradwerte dürfen nicht als 0 oder NaN angezeigt werden');
 }

 // Quellbasierte NoData-Regression: Null bei apparent/dewpoint ist nicht 0 °C.
 need('Tagesdetail-Thermik NoData',app,'apparent=Number(hour.apparent??NaN),felt=');
 need('Tagesdetail-Thermik NoData',app,'dew=Number(hour.dewPoint??NaN),humidity=');
 const thermalStart=app.indexOf('function detailSaturationVaporPressureHpa('),thermalEnd=app.indexOf('function detailCalendarAxis(',thermalStart);
 if(!(thermalStart>=0&&thermalEnd>thermalStart))failures.push('Produktive thermische Berechnung nicht auffindbar');
 else {
  const thermalCode=app.slice(thermalStart,thermalEnd).replace('temperature:number','temperature').replace('hour:Hour):DetailThermalFeel','hour)');
  const calc=new Function('clamp','utciCategory','utciStressScore',thermalCode+';return detailThermalFeel;')(
   (x,min,max)=>Math.min(max,Math.max(min,x)),x=>({shortLabel:String(x),label:String(x),color:'test'}),()=>8
  );
  const baseHour={temperature:26,apparent:26,dewPoint:20,humidity:90,wind:2,isDay:true,sunshineDuration:1800,cloud:10};
  const missingApparent=calc({...baseHour,apparent:null});
  if(missingApparent.label!=='26'||missingApparent.delta!==0||missingApparent.sultry!==true)failures.push('Fehlende gefühlte Temperatur muss auf die reale Lufttemperatur zurückfallen, nicht auf 0 °C');
  const missingDew=calc({...baseHour,temperature:29,apparent:29,dewPoint:null,wind:1,sunshineDuration:3600,cloud:0});
  if(missingDew.sultry!==true)failures.push('Fehlender Taupunkt muss auf bekannte relative Feuchte zurückfallen, statt Taupunkt 0 °C zu erfinden');
  const realZero=calc({...baseHour,temperature:29,apparent:0,dewPoint:0,wind:1,sunshineDuration:3600,cloud:0});
  if(realZero.label!=='0'||realZero.delta!==-29||realZero.sultry!==false)failures.push('Echte 0 °C für apparent und Taupunkt bleiben unverändert');
 }

for(const token of [
 'function detailThermalFeel(hour:Hour):DetailThermalFeel',
 'category=utciCategory(felt)',
 'score:utciStressScore(felt)',
 'label:category.shortLabel',
 'burden:category.label',
 'color:category.color',
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
