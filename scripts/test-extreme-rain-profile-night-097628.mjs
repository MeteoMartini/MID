import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [panel,cockpit,stylesSource,styles,worker,direct,pkgRaw,baselineRaw]=await Promise.all([
  read('src/ExtremeWeatherOutlookPanel.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/styles-src/30-modern.css'),
  read('src/styles.css'),
  read('worker/metar-proxy.js'),
  read('src/extremeWeatherOutlookDirect.generated.js'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const needPattern=(label,text,pattern,description)=>{if(!pattern.test(text))failures.push(`${label}: ${description}`)};

need('Extrem-UI',panel,'function roundedTerrainElevation(value:unknown)');
need('Extrem-UI',panel,'function rainMetricDisplay(metric:ResolvedExtremeSignal[\'metrics\'])');
// Seit v0.9.77.8 werden I-Schwelle und das tatsächliche Modellsignal bewusst gemeinsam gezeigt.
need('Extrem-UI',panel,"if(signal.hazard==='rain')return`${threshold} · ${source} ${rainMetricLabel(metric)}`");
need('Extrem-UI',panel,"['Intensitätsschwelle',threshold]");
need('Extrem-UI',panel,"[`${source} Akkumulation`,rainMetricLabel(metric)]");
need('Extrem-UI',panel,"['Überschreitungswahrscheinlichkeit',probabilityEvidenceLabel(signal)]");
need('Extrem-UI',panel,'EPS-Streuung Akkumulation');
need('Extrem-UI',panel,"['Geländehöhe',terrainElevationLabel(metric.elevationM)]");

function checkRainSupport(label,text){
  need(label,text,"if(kind==='rain'){");
  need(label,text,'support.precipitationMm');
  need(label,text,'support.max1hMm');
  need(label,text,'coverage>=5.9?dachExtremeRucSupportProbability(');
  need(label,text,'level.values[6]');
  need(label,text,'dachExtremeRucSupportProbability(max1,level.values[1])');
  need(label,text,'rucEvidence=[null,null,null,null]');
  need(label,text,'rucEvidence[i]=six>=one?{value:total,window:6}:{value:max1,window:1}');
  need(label,text,"if(evidence&&number(rapid[index])>number(base[index]))");
  need(label,text,"metrics.evidenceSource='ICON-D2-RUC'");
  need(label,text,'metrics.rainMm=Number(number(evidence.value).toFixed(1))');
  need(label,text,'metrics.windowHours=number(evidence.window)||1');
}
checkRainSupport('Worker',worker);
checkRainSupport('Direktausblick',direct);

need('24-h-Profil',cockpit,'const nightBandOpacity=.4,midnightBoundary=chartDayBands[1]??null,nightBands=(()=>');
need('24-h-Profil',cockpit,'nightBands.map(item=><linearGradient');
need('24-h-Profil',cockpit,'{midnightBoundary?<line className="day-separator"');
need('24-h-Profil',cockpit,'className="hour-line"');
if(cockpit.includes('className={`hour-line${item.showDateMarker?\' major\':\'\'}`}'))failures.push('24-h-Profil: stundenweise Vollhöhenlinie verwendet noch major-Variante.');
need('Styles 30-modern',stylesSource,'.cockpit-weather-profile .cockpit-meteogram-pro__svg .night-band{pointer-events:none}');
need('Styles Build',styles,'.cockpit-weather-profile .cockpit-meteogram-pro__svg .night-band{pointer-events:none}');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),version=pkg.version,workerVersion=worker.match(/const WORKER_VERSION='([^']+)'/)?.[1];
if(version!==baseline.releaseVersion||version!==workerVersion)failures.push(`Versionsabweichung: ${version}/${baseline.releaseVersion}/${workerVersion}`);
if(!baseline.regressionTests?.includes('scripts/test-extreme-rain-profile-night-097628.mjs'))failures.push('Baseline regressionTests fehlt neuer Test.');
if(!baseline.requiredRegressionTests?.includes('scripts/test-extreme-rain-profile-night-097628.mjs'))failures.push('Baseline requiredRegressionTests fehlt neuer Test.');
if(failures.length){
  console.error('Extremregen-/24h-Profil-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Extremregen-Metrik, I-Schwellenvergleich, RUC-Fallback, Geländehöhen-Rundung und 24-h-Nachtprofil erfolgreich geprüft.');
