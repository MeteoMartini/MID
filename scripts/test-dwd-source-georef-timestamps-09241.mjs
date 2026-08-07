import {readFile} from 'node:fs/promises';
const [radar,map,hymec,worker,styles,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ['formatDwdSourceTimestamp(meta?.radarAt||hymecMeta?.observedAt)','formatDwdSourceTimestamp(meta?.satelliteAt)','<b>Radar</b>','<b>Sat</b>'])need('Quellzeiten UI',radar,token);
for(const token of ['Marker position={[latitude,longitude]}',"DWD_SATELLITE_LAYER='dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night'"])need('Georeferenzierte Karte',map,token);
need('Hymec native Projektion',hymec,'projectWgs84(latitude,longitude,raster.projection)');
for(const token of ["DWD_PRECIPITATION_TYPE_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",'DWD_HYMECNG_ROOTS',"DWD_PRECIPITATION_TYPE_SATELLITE_INDEX='https://opendata.dwd.de/weather/satellite/clouds/TS/'",'radarAt=pageTimes.radarAt||','satelliteAt=pageTimes.satelliteAt||','DWD-Produktseite verbindlich; Fallback HymecNG + NWCSAF OpenData'])need('Worker-Zeitquelle',worker,token);
reject('Alter HG-Pfad',worker,"weather/radar/composite/hg/'");
for(const token of ['.mid-dwd-location-pin','background:transparent'])need('Marker ohne Kreis',styles,token);
if(!baseline.includes('scripts/test-dwd-source-georef-timestamps-09241.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Quellzeit-/Georeferenzierungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Produktseiten-Zeitstempel, HymecNG-native Georeferenzierung und kreisfreier WGS84-Marker erfolgreich geprüft.');
