import {readFile} from 'node:fs/promises';
const [radar,map,hymec,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ['Marker position={[latitude,longitude]}','map.setView([latitude,longitude]','center={[latitude,longitude]} zoom={7}'])need('Direkter WGS84-Marker',map,token);
for(const token of ['projectWgs84(latitude,longitude,raster.projection)','(projected[0]-raster.minX)/raster.xScale','(raster.maxY-projected[1])/raster.yScale'])need('Native Raster-Georeferenzierung',hymec,token);
for(const token of ['DWD_SOURCE_RASTER_GRID','RasterPolynomial','rasterPolynomialForward','rasterPolynomialInverse','dwdPrecipitationTypeImagePosition','radarCropWindow'])reject('Pixel-Georeferenzierung',radar,token);
for(const token of ['50.78362','7.059056','Wiesbaden','Mondorf']){reject('Keine Beispielort-Kalibrierung',map,token);reject('Keine Beispielort-Kalibrierung',hymec,token)}
if(!baseline.includes('scripts/test-dwd-raster-georef-09242.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD native Georeferenzierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Georeferenzierung geprüft: Standort bleibt unverändert WGS84; HymecNG wird ausschließlich über seine native Projektion abgetastet.');
