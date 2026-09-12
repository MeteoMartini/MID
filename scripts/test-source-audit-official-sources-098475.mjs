import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const [core,composite,radar,router,weatherFrag,waterPanel,app,worker,wisSchema]=await Promise.all([
 read('worker-src/00-core-observations.js'),
 read('worker-src/20-composite-models.js'),
 read('worker-src/10-radar-nowcast.js'),
 read('worker-src/40-aviation-router.js'),
 read('src/weather-src/10-observations-specialized.tsfrag'),
 read('src/WaterSportsPanel.tsx'),
 read('src/App.tsx'),
 read('worker/metar-proxy.js'),
 read('contracts/wis2-normalized-observation.schema.json')
]);
const failures=[];
const need=(text,token,msg)=>{if(!text.includes(token))failures.push(msg)};

// 1) EUMETSAT MTG FCI + LI: existing official imagery retained, LI time axis + optional normalized L2 point feed.
for(const token of ["mtg_fd:li_afa","MID_EUMETSAT_LI_POINT_ENDPOINT","product','total-lightning-l2","dwdTimesFromCapabilities(capabilities.eumetsat||'','mtg_fd:li_afa')","result.mtgLightning=liTimes.map"])
 need(composite,token,`MTG-FCI/LI-Vertrag fehlt: ${token}`);

// 2) Official Observation Broker: UBA + SwissMetNet STAC + current KNMI EDR; EEA fallback remains.
for(const token of ["MID_UBA_AIR_QUALITY_POINT_ENDPOINT","source:'uba-api-v4'","api_version:'4'","observation:true","preliminary:true"])
 need(composite,token,`UBA-Vertrag fehlt: ${token}`);
for(const token of ["ch.meteoschweiz.ogd-smn","10-minute-in-situ-meteorological-observations","https://api.dataplatform.knmi.nl/edr/v1/collections/10-minute-in-situ-meteorological-observations","KNMI-Beobachtungsadapter verweist auf eine stillgelegte 10-Minuten-Quelle"])
 need(core,token,`CH/NL-Beobachtungsvertrag fehlt: ${token}`);
need(worker,'EEA_AIR_QUALITY_STATION_ENDPOINTS','Bestehender EEA-Fallback wurde entfernt.');
need(app,'fallbackModelProvider','Luftqualitäts-UI trennt Messung und Modellfallback nicht.');

// 3) PEGELONLINE REST v2: UUID + W/WV and forecast discovery.
for(const token of ["https://www.pegelonline.wsv.de/webservices/rest-api/v2/","includeForecastTimeseries:true","WV/measurements.json","if(!uuid)throw new Error('PEGELONLINE-Station ohne UUID')","==='W'","==='WV'","official-raw-observation"])
 need(composite,token,`PEGELONLINE-Vertrag fehlt: ${token}`);
need(router,"mode==='official-water'",'PEGELONLINE-Workerroute fehlt.');
need(waterPanel,'Amtlicher Pegel','PEGELONLINE-Anzeige fehlt im Wasserbereich.');

// 4) ECMWF 50r1: scan executable source only for removed stream/type combinations.
const prodRoots=['worker-src','src','tools','ci/github'];
async function collectFiles(dir){const out=[];for(const ent of await readdir(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,ent.name);if(ent.isDirectory())out.push(...await collectFiles(rel));else if(/\.(?:js|mjs|cjs|ts|tsx|py|ya?ml)$/.test(ent.name))out.push(rel)}return out}
const prodFiles=(await Promise.all(prodRoots.map(async dir=>{try{return await collectFiles(dir)}catch{return[]} }))).flat();
for(const rel of prodFiles){const text=await read(rel);if(/\bscda\b|\bscwv\b/i.test(text))failures.push(`ECMWF-50r1: Legacy-Stream in ausführbarem Code: ${rel}`);if(/stream[^\n]{0,80}enfo[^\n]{0,80}type[^\n]{0,40}(?:=|:)["']?cf\b/i.test(text))failures.push(`ECMWF-50r1: altes enfo/type=cf in ausführbarem Code: ${rel}`)}

// 5) MeteoAlarm modern EDR/CAP adapter with national fallback.
for(const token of ["MID_METEOALARM_EDR_POINT_ENDPOINT","const METEOALARM_EDR_COLLECTION='warnings'","active','now'","language",'officialAlertsWithModernMeteoAlarm'])
 need(core,token,`MeteoAlarm-EDR-Vertrag fehlt: ${token}`);
need(router,'officialAlertsWithModernMeteoAlarm','Neue MeteoAlarm-Quelle ist nicht in die bestehende Warnroute eingebunden.');

// 6) MRMS is US-regional, after DWD and before RainViewer fallback.
for(const token of ["MID_NOAA_MRMS_POINT_ENDPOINT","source:'mrms'","NOAA / NSSL MRMS","countryCode==='US'"])
 need(radar,token,`MRMS-Vertrag fehlt: ${token}`);
const dwd=radar.indexOf('if(!rainViewerOnly&&dwdExpected)'),mrms=radar.indexOf("countryCode==='US'"),rain=radar.indexOf('rainViewerRadarNowcast',mrms);
if(dwd<0||mrms<dwd||rain<mrms)failures.push('Radarreihenfolge DWD -> US-MRMS -> RainViewer ist nicht erkennbar.');

// 7) WIS2 remains a normalized backend strategy, never a BUFR decoder in the request worker.
for(const token of ["MID_WIS2_OBSERVATION_POINT_ENDPOINT","WMO WIS2 normalized observations","mid-official-observation-v1","!['DE','AT','CH','NL','SE','FI','US','CA','ES','FR'].includes(country)"])
 need(core+router,token,`WIS2-Vertrag fehlt: ${token}`);
const schema=JSON.parse(wisSchema);if(schema?.title!=='MID official observation v1'||schema?.properties?.schema?.const!=='mid-official-observation-v1')failures.push('WIS2-Normalisierungsschema ist unvollständig.');
if(/(?:import|require|new|function|class|await)\s*[^\n;]{0,80}(?:eccodes|bufr[_-]?decode|decode[_-]?bufr|BUFRDecoder)/i.test(worker))failures.push('BUFR-Decodierung wurde fälschlich in den Cloudflare-Request-Worker eingebaut.');

// 8) Copernicus Marine before Open-Meteo fallback.
for(const token of ["MID_COPERNICUS_MARINE_POINT_ENDPOINT","Copernicus Marine Service","serverSideSubset:true"])
 need(composite,token,`Copernicus-Marine-Vertrag fehlt: ${token}`);
const subset=weatherFrag.indexOf("fetchWorkerJson<MarineForecast&{available?:boolean;error?:string}>('marine-subset'"),fallback=weatherFrag.indexOf('https://marine-api.open-meteo.com/v1/marine');
if(subset<0||fallback<subset)failures.push('Copernicus Marine wird nicht vor Open-Meteo Marine versucht.');

// 9) GloFAS is a model outlook only. Public EFAS realtime must not be represented as current flood forecast.
for(const token of ["MID_GLOFAS_POINT_ENDPOINT","provider:'Copernicus EMS GloFAS'","modelled:true","measurement:false","officialWarning:false"])
 need(composite,token,`GloFAS-Vertrag fehlt: ${token}`);
need(waterPanel,'Modellprognose, keine Messung und keine amtliche Hochwasserwarnung','GloFAS-Abgrenzung in der UI fehlt.');
if(/MID_EFAS|efas[_-]?(?:forecast|realtime)|EFAS[^\n]{0,80}(?:real.?time|Echtzeit)/i.test(worker))failures.push('EFAS ist fälschlich als aktuelle Worker-Prognose eingebunden.');

if(failures.length){console.error('Quellen-Audit v0.9.84.75 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Quellen-Audit geprüft: MTG FCI/LI, Official Observation Broker, PEGELONLINE, ECMWF 50r1, MeteoAlarm EDR, MRMS, WIS2, Copernicus Marine und GloFAS sind abgesichert; OPERA/EEA bleiben erhalten, EFAS wird nicht als Echtzeitquelle verwendet.');
