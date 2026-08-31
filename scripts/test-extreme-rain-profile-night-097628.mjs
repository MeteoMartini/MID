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
need('Extrem-UI',panel,'function roundedTerrainElevation(value:unknown)');
need('Extrem-UI',panel,'function rainMetricDisplay(metric:ResolvedExtremeSignal[\'metrics\'])');
need('Extrem-UI',panel,"if(signal.hazard==='rain')return rainMetricLabel(metric)");
need('Extrem-UI',panel,"['Geländehöhe',terrainElevationLabel(metric.elevationM)]");
need('Worker',worker,"if(kind==='rain'){const existingRain=Math.max(0,number(metrics.rainMm)||0);if(existingRain<=.04&&rainTotal6>.04)");
need('Direktausblick',direct,"if(kind==='rain'){const existingRain=Math.max(0,number(metrics.rainMm)||0);if(existingRain<=.04&&rainTotal6>.04)");
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
console.log('Extremregen-Metrik, Geländehöhen-Rundung und 24-h-Nachtprofil erfolgreich geprüft.');
