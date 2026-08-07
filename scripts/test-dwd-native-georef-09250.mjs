import {readFile} from 'node:fs/promises';
const [radar,map,hymec,overlay,worker,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),readFile(new URL('../src/HymecNgOverlay.tsx',import.meta.url),'utf8'),readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ['latitude=Number(location.latitude)','longitude=Number(location.longitude)','coordinateLabel(latitude,longitude)','Standortmarker direkt aus WGS84-Koordinaten'])need('Location-Durchleitung',radar,token);
for(const token of ['center={[latitude,longitude]} zoom={8}','map.setView([latitude,longitude]','Marker position={[latitude,longitude]}','PointPicker onPoint={onPoint}'])need('Leaflet-WGS84',map,token);
for(const token of ['projectWgs84(latitude,longitude,raster.projection)','inverseProjectedPoint','hymecNgSourceIndex'])need('Hymec native Georeferenzierung',hymec,token);
need('Hymec Overlay',overlay,'sourceX=Math.floor((projectedX-raster.minX)/raster.xScale)');need('Hymec Overlay',overlay,'sourceY=Math.floor((raster.maxY-projectedY)/raster.yScale)');
for(const token of ['DWD_HYMECNG_ROOTS','dwd-hymecng-meta','dwd-hymecng-file','radarAt=pageTimes.radarAt||'])need('Worker',worker,token);
for(const token of ['DWD_DIRECT_IMAGE','dwdPrecipitationTypeImagePosition','radarCropWindow','RasterPolynomial','DWD_SOURCE_RASTER_GRID'])reject('Alte PNG-Pixelverortung',radar,token);
for(const token of ['50.78362','7.059056','Mondorf','Wiesbaden']){reject('Keine ortsspezifische Kalibrierung',radar,token);reject('Keine ortsspezifische Kalibrierung',map,token);reject('Keine ortsspezifische Kalibrierung',hymec,token)}
if(!baseline.includes('scripts/test-dwd-native-georef-09250.mjs'))failures.push('Neue native Georeferenzierungsregression fehlt in der Baseline.');
if(failures.length){console.error('DWD native WGS84-Georeferenzierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD native WGS84-Georeferenzierung geschützt: Standortkoordinate wird unverändert an Leaflet übergeben; Wetterraster werden separat projiziert.');
