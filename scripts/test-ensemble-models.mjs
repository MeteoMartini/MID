import fs from 'node:fs';
const weather=fs.readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const failures=[];
const memberIds=['icon_seamless_eps','icon_global_eps','icon_eu_eps','icon_d2_eps','ncep_gefs_seamless','ncep_gefs025','ncep_gefs05','ncep_aigefs025','ecmwf_ifs025_ensemble','ecmwf_aifs025_ensemble','gem_global_ensemble','bom_access_global_ensemble','ukmo_global_ensemble_20km','ukmo_uk_ensemble_2km','meteoswiss_icon_ch1_ensemble','meteoswiss_icon_ch2_ensemble','google_weathernext2_ensemble'];
const meanIds=['dwd_icon_eps_ensemble_mean_seamless','ncep_gefs_ensemble_mean_seamless','ecmwf_ifs025_ensemble_mean','ecmwf_aifs025_ensemble_mean','cmc_gem_geps_ensemble_mean','google_weathernext2_ensemble_mean'];
for(const id of [...memberIds,...meanIds])if(!weather.includes(`'${id}'`))failures.push(`Aktuelle Open-Meteo-Modellkennung fehlt: ${id}`);
for(const stale of ["id:'icon_seamless'","id:'gfs_seamless'","id:'gfs025'","id:'ecmwf_ifs025'","id:'gem_global'","id:'bom_access_global'","'gfs025_ensemble_mean'","'gem_global_ensemble_mean'","'ukmo_global_ensemble_mean'"])if(weather.includes(stale))failures.push(`Veraltete Ensemble-Modellkennung ist noch aktiv: ${stale}`);
for(const token of ['selectedEnsembleModels(lat,lon)','slice(0,8)','settledMapLimited(selected,2','settledMapLimited(meanModels,2','fetchEnsembleRequest','[429,500,502,503,504]','temperature_2m_spread,precipitation,precipitation_spread','pseudoModelFromMeanSpread','ENSEMBLE_CACHE_PREFIX'])if(!weather.includes(token))failures.push(`Robuste Ensemble-Abruflogik fehlt: ${token}`);
for(const token of ["mode==='ensemble-proxy'","mode==='model-meta'",'openMeteoEnsembleProxy','openMeteoModelMeta'])if(!worker.includes(token))failures.push(`Ensemble-Workerpfad fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Modellprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Modellprüfung bestanden: priorisierte Mitglieder, offizielle Mittel-/Spread-Reserve, Workerproxy und lokaler letzter Stand sind vorhanden.');
