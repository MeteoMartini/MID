import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const [core,composite,router,weather,water,models]=await Promise.all([
 read('worker-src/00-core-observations.js'),read('worker-src/20-composite-models.js'),read('worker-src/40-aviation-router.js'),read('src/weather-src/10-observations-specialized.tsfrag'),read('src/WaterSportsPanel.tsx'),read('src/weather-src/00-types-models-search.tsfrag')
]);
const failures=[];const need=(text,token,msg)=>{if(!text.includes(token))failures.push(msg)};

// PEGELONLINE: stable UUID station discovery plus actual future WV values, not only forecast discovery metadata.
for(const token of ["https://m.pegelonline.wsv.de/webservices/rest-api/v2/","https://www.pegelonline.wsv.de/webservices/rest-api/v2/","WV/measurements.json","forecastType","percentile10","percentile90","initializedAt","slice(0,16)"])
 need(composite,token,`PEGELONLINE-WV-Vertrag fehlt: ${token}`);
need(water,'WV ${Math.round(officialWater.forecast.valueCm!)} cm','Amtliche WV-Vorhersage wird im Wasserbereich nicht kompakt angezeigt.');

// Official point feeds must not outrank fresher fallbacks after an upstream outage.
for(const token of ['officialAdapterMaxAgeMinutes','officialAdapterFresh','ageMinutes>=-20','MeteoSwiss|KNMI 10-min','return 90','WMO WIS2'])
 need(core,token,`Freshness-Vertrag für amtliche Adapter fehlt: ${token}`);

// UBA is measured/current, with documented attribution and stale guard; model remains forecast/fallback.
for(const token of ["time_basis:'MEZ'","ageMinutes>180","Umweltbundesamt mit Daten der Messnetze der Länder und des Bundes","preliminary:true"])
 need(composite,token,`UBA-v4-Vertrag fehlt: ${token}`);

// AviationWeather remains API-friendly and resilient to empty 204 responses.
for(const token of ["'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`","if(response.status===204)return{type:'FeatureCollection',features:[]}"])
 need(router,token,`AviationWeather-Vertrag fehlt: ${token}`);

// DWD direct severe-convection sources are retained; do not replace a good official path with another aggregator.
for(const token of ['DWD_MESOCYCLONE_ROOTS','latestMesocycloneDetections','attachMesocyclones'])need(core,token,`DWD-Mesozyklonenpfad fehlt: ${token}`);

// Current Open-Meteo ensemble/model catalogue remains aligned with available modern families; suspended KMA stays out.
for(const token of ['google_weathernext2_ensemble','ncep_aigefs025','ukmo_uk_ensemble_2km'])need(models,token,`Aktueller Ensemblevertrag fehlt: ${token}`);
for(const legacy of ['kma_ldps','kma_gdps'])if(models.includes(`id:'${legacy}'`))failures.push(`Suspendierter KMA-Pfad ist wieder aktiv: ${legacy}`);

if(failures.length){console.error('Quellen-Wartung v0.9.84.76 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Quellen-Wartung geprüft: PEGELONLINE WV, Freshness-Schutz, UBA v4, AviationWeather, DWD-Mesozyklonen und aktuelle Ensemblefamilien.');
