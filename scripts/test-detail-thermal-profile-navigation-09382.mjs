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
 // Exercise the exact production sunShare fallback, not a local formula
 // that could pass even when the on-screen solar assessment regresses.
 const shareStart=app.indexOf('sunShare=hour.isDay?'),shareEnd=app.indexOf(',radiationLoad=',shareStart);
 if(shareStart<0||shareEnd<=shareStart)failures.push('Produktiver Sonnenanteil-Fallback fehlt');
 else{
  const expression=app.slice(shareStart+'sunShare='.length,shareEnd);
  const actualShare=new Function('hour','sunshine','cloud','clamp','return ('+expression+');');
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  for(const [isDay,originalSun,cloud,expected] of [
   [true,null,20,.8],[true,0,20,0],[true,1800,20,.5],
   [true,undefined,80,.2],[true,Infinity,60,.4],[true,null,NaN,NaN],[true,0,NaN,0],[false,null,NaN,0],[false,null,20,0]
  ]){
   const sunshine=Number(originalSun??NaN),value=actualShare({isDay},sunshine,cloud,clamp);
   if(Number.isNaN(expected)?!Number.isNaN(value):!Number.isFinite(value)||Math.abs(value-expected)>1e-9)
    failures.push('Produktiver Sonnenanteil-Fallback '+String(originalSun)+' / '+String(cloud));
  }
 }



 // UTCI is computed upstream when valid; the Hour model flags provider fallback.
 need('UTCI/Fallback-Mischserie',app,'<i className="apparent"/>UTCI / gefühlt</button>');
 need('UTCI/Fallback-Mischserie',app,'<i className="apparent"/>UTCI / gefühlt</span>');
 need('UTCI/Fallback-Stundentooltip',app,"currentHour.apparentKind==='utci'?'UTCI-Näherung'");
 need('UTCI/Fallback-Stundentooltip',app,"currentHour.apparentKind==='provider-fallback'?'gefühlt (Anbieter)'");
 if(app.includes('<small>Temperatur / UTCI</small>')||app.includes('<small>Temperatur / gefühlt</small>'))failures.push('Hourly provenance must be source specific, not a blanket model claim');
 need('Stunden-Hitbereich NoData',app,'${detailDegree(x.temperature)} · Thermisches Empfinden');
 need('Stunden-Hitbereich NoData',app,'Taupunkt ${detailDegree(x.dewPoint)}');

 // Nicht vorhandene Tooltip-Werte sind unbekannt (–), keine erfundenen 0 °C.
 need('Stundentooltip NoData',app,"detailDegree(currentHour.temperature)} / {detailDegree(currentHour.apparent)");
 need('Stundentooltip NoData',app,"detailDegree(currentHour.dewPoint)} · {Number.isFinite(currentHour.humidity)");
 const degreeStart=app.indexOf('const detailDegree='),degreeEnd=app.indexOf('function detailSaturationVaporPressureHpa(',degreeStart);
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
  const baseHour={temperature:26,apparent:26,apparentKind:'utci',dewPoint:20,humidity:90,wind:2,isDay:true,sunshineDuration:1800,cloud:10};
  const missingApparent=calc({...baseHour,apparent:null});
  if(missingApparent.label!=='–'||missingApparent.score!==null||!Number.isNaN(missingApparent.delta)||missingApparent.sultry!==true)failures.push('Fehlender UTCI ist NoData und kann keine thermische Belastungsklasse erzeugen');
  const missingDew=calc({...baseHour,temperature:29,apparent:29,dewPoint:null,wind:1,sunshineDuration:3600,cloud:0});
  if(missingDew.score!==8||missingDew.sultry!==true)failures.push('Fehlender Taupunkt muss auf vorhandene relative Feuchte zurückfallen');
  const realZero=calc({...baseHour,temperature:29,apparent:0,dewPoint:0,wind:1,sunshineDuration:3600,cloud:0});
  if(realZero.label!=='0'||realZero.delta!==-29||realZero.score!==8||realZero.sultry!==false)failures.push('Echte UTCI-Null und echter Taupunkt 0°C bleiben unverändert');
  const providerFallback=calc({...baseHour,apparent:32,apparentKind:'provider-fallback'});
  if(providerFallback.score!==null||providerFallback.label!=='gefühlt'||!providerFallback.burden.includes('Anbieter-Fallback'))failures.push('Anbieter-gefühlte Temperatur darf keine UTCI-Belastungsklasse erzeugen');
  const unproven=calc({...baseHour,apparentKind:undefined});
  if(unproven.score!==null||!unproven.burden.includes('Provenienz'))failures.push('Fehlende UTCI-Provenienz wird nicht als klassifizierter UTCI angenommen');
  const missingAll=calc({...baseHour,temperature:null,apparent:null});
  if(missingAll.score!==null||missingAll.label!=='–')failures.push('Unbekannte Luft-/Index-Temperatur bleibt unbekannt, niemals 0°C');
  // Missing source values are not physical zeroes. Valid UTCI provenance
  // remains independent from this MID-only sultriness calculation.
  const missingCloud=calc({...baseHour,cloud:null,sunshineDuration:null});
  if(missingCloud.sultry!==null||missingCloud.score!==8)failures.push('Unknown sunshine and cloud cannot imply definite sultriness');
  const missingWind=calc({...baseHour,wind:null});
  if(missingWind.sultry!==null)failures.push('Unknown wind cannot be modeled as calm conditions');
  const missingHumidity=calc({...baseHour,humidity:null,dewPoint:null});
  if(missingHumidity.sultry!==null)failures.push('Unknown humidity and dew point cannot imply 0% humidity');
  const dewPointFallback=calc({...baseHour,humidity:null});
  if(dewPointFallback.sultry!==true)failures.push('Known dew point must support moisture evaluation even if RH is missing');
  const realZeros=calc({...baseHour,dewPoint:0,humidity:0,wind:0,cloud:0,sunshineDuration:0});
  if(realZeros.sultry!==false||realZeros.score!==8)failures.push('Genuine zero RH/wind/cloud/sunshine must remain valid zeros');
 }

for(const token of [
 'function detailThermalFeel(hour:Hour):DetailThermalFeel',
 "category=hour.apparentKind==='utci'&&Number.isFinite(apparent)?utciCategory(apparent):null",
 'score:category?utciStressScore(apparent):null',
 'label:category?.shortLabel',
 'burden:category?',
 'color:category?.color',
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
