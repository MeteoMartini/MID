import {readFile} from 'node:fs/promises';
const [component,map,hymec,app,cockpit,shortTerm,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),
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
 'Wolken + Niederschlagsart',"fetchWorkerJson<RadarMeta>('dwd-precipitation-type-meta'",'loadHymecNgMetadata(source.radarAt)','sampleHymecNg(hymecMeta,pointLat,pointLon)','formatDwdSourceTimestamp(meta?.radarAt||hymecMeta?.observedAt)','formatDwdSourceTimestamp(meta?.satelliteAt)','LazyDwdPrecipitationMap','Standortmarker direkt aus WGS84-Koordinaten'
])need('Radar-Komponente',component,token);
for(const token of ['compositeWmsProxy','satelliteProduct','closestProductTime','center={[latitude,longitude]} zoom={8}','map.setView([latitude,longitude]','Marker position={[latitude,longitude]}','<HymecNgOverlay'])need('Georeferenzierte Karte',map,token);
for(const token of ["fetchWorkerJson<HymecNgMeta>('dwd-hymecng-meta'",'projectWgs84(latitude,longitude,raster.projection)','hymecNgSourceIndex','sampleHymecNg'])need('HymecNG',hymec,token);
for(const token of ['DWD_HYMECNG_ROOTS',"mode==='dwd-hymecng-file'","mode==='dwd-hymecng-meta'",'radarAt=pageTimes.radarAt||','satelliteAt=pageTimes.satelliteAt||'])need('Worker',worker,token);
for(const token of ['showDwdPrecipitationTypeRadar:boolean','showDwdPrecipitationTypeRadar={forecastDisplaySettings.showDwdPrecipitationTypeRadar}'])need('App-Einstellung',app,token);
need('Cockpit',cockpit,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');need('Klassische Ansicht',shortTerm,'<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>');
for(const token of ['.dwd-precip-type-radar__map-shell','.dwd-precip-type-radar__leaflet','.mid-dwd-location-pin'])need('CSS',styles,token);
for(const token of ['DWD_DIRECT_IMAGE','dwdPrecipitationTypeImagePosition','radarCropWindow','geoFromImagePoint','DWD_SOURCE_RASTER_GRID','RasterPolynomial'])reject('Statische PNG-Georeferenzierung',component,token);
reject('Karte darf keine Beispielkoordinate enthalten',map,'50.78362');reject('Karte darf keinen Beispielort enthalten',map,'Mondorf');
need('Package-Test',pkg,'test:dwd-precipitation-type-radar');need('Baseline-Test',baseline,'scripts/test-dwd-precipitation-type-radar-09200.mjs');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);
if(failures.length){console.error('DWD Wolken + Niederschlagsart fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD Wolken + Niederschlagsart: WGS84-Marker, frische HymecNG-Prüfung und zeitnahes Satellitenprodukt erfolgreich geprüft.');
