import {readFile} from 'node:fs/promises';
const [panel,map,hymec,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of [
 'dwdReferenceSatelliteProduct','freshVerifiedHymec','classificationVerified!==true',
 '<b>Radar</b>','<b>Art</b>','<b>Sat</b>',
 'DWD-Radarintensität wird unabhängig davon immer separat dargestellt',
 'Die 11 HymecNG-Klassen erscheinen nur bei einem frischen, verifizierten DWD-Datensatz.'
])need('Panel',panel,token);
for(const token of [
 "BKG_BASEMAP_COLOR_URL='https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{z}/{y}/{x}.png'",
 'BKG_RELIEF_WMS', 'de_basemapde_web_raster_colordem', 'de_basemapde_web_raster_combshade',
 'canShowRadar=Boolean','canShowRadar?<WMSTileLayer','opacity={.78} zIndex={390}','radarLatestOnly',
 "verifiedHymec=Boolean(hymecMeta?.available&&hymecMeta.fileUrl&&hymecMeta.classificationVerified===true)",
 "precipSource:DwdCompositePrecipSource=verifiedHymec?'hymecng':'none'",
 'opacity={.52} zIndex={240}',
 'Marker position={[latitude,longitude]}'
])need('Kartenkomposition',map,token);
for(const token of ['HYMEC_NG_CLASS_LEGEND','if(!raster.classificationVerified)return UNVERIFIED_CLASS','keine Codes ableiten'])need('Hymec-Sicherheitslogik',hymec,token);
for(const token of ["{code:1,label:'großer Hagel'","{code:8,label:'Regen'","CLASS_BY_CODE"])reject('Keine geratenen Hymec-Rohwertcodes',hymec,token);
for(const token of ['rainViewer.host','/512/{z}/{x}/{y}/2/1_1.png',"DwdCompositePrecipSource='hymecng'|'rainviewer'"])reject('Kein fremder Phasenlayer im DWD-Komposit',map,token);
for(const token of ['DWD_REFERENCE_SATELLITE_CANDIDATES','Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h','result.dwdReferenceSatelliteProduct=satelliteProduct','classificationVerified:false','result.dwdRadarLatestOnly=result.dwdRadarLayer===alias||!observed.length'])need('Worker',worker,token);
need('CSS',styles,'grid-template-columns:repeat(3,minmax(0,1fr))');
if(!JSON.parse(pkg).scripts?.['test:dwd-composite-source-integrity'])failures.push('Package-Test fehlt.');
if(!baseline.includes('scripts/test-dwd-composite-source-integrity-09300.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Komposit-Quellenintegrität fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Komposit geprüft: amtliche basemap.de-Farbe+Relief, DWD-naher Satellit, sichtbarer stabiler Radaralias und keine geratenen HymecNG-/Fallback-Klassen.');
