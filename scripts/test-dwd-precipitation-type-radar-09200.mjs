import {readFile} from 'node:fs/promises';
const [component,app,cockpit,shortTerm,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of [
 "DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",
 'Wolken + Niederschlagsart',"buildWorkerUrl(base,'dwd-precipitation-type-image'","response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')",'formatDwdSourceTimestamp(meta?.radarAt)','formatDwdSourceTimestamp(meta?.satelliteAt)','DwdLocationLocator location={location}',"layers:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night'","layers:'dwd:Niederschlagsradar'",'dwd-precip-type-radar__source-image','Originales DWD-Kombinationsbild · unverändert'
])need('Radar-Komponente',component,token);
for(const token of ["headers.set('x-mid-radar-at',sourceTimes.radarAt)","headers.set('x-mid-satellite-at',sourceTimes.satelliteAt)",'radarAt=pageTimes.radarAt||','satelliteAt=pageTimes.satelliteAt||'])need('Worker',worker,token);
for(const token of ['loadCompositeTimes','loadHymecNgMetadata','LazyDwdPrecipitationMap','dwdPrecipitationTypeImagePosition','radarCropWindow'])reject('Keine rekonstruierte Ersatzdarstellung',component,token);
for(const token of ['showDwdPrecipitationTypeRadar:boolean','showDwdPrecipitationTypeRadar={forecastDisplaySettings.showDwdPrecipitationTypeRadar}'])need('App-Einstellung',app,token);
need('Cockpit',cockpit,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');need('Klassische Ansicht',shortTerm,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
for(const token of ['.dwd-precip-type-radar__source-frame','.dwd-precip-type-radar__source-image'])need('CSS',styles,token);
for(const token of ['DWD_DIRECT_IMAGE','dwdPrecipitationTypeImagePosition','radarCropWindow','geoFromImagePoint','DWD_SOURCE_RASTER_GRID','RasterPolynomial'])reject('Statische PNG-Georeferenzierung',component,token);
need('Package-Test',pkg,'test:dwd-precipitation-type-radar');need('Baseline-Test',baseline,'scripts/test-dwd-precipitation-type-radar-09200.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(failures.length){console.error('DWD Wolken + Niederschlagsart fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD Wolken + Niederschlagsart: unverändertes amtliches Kombinationsbild plus exakter WGS84-Locator mit DWD Radar/Sat erfolgreich geprüft.');
