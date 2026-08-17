import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const read=p=>readFile(new URL(p,root),'utf8');
const [weather,app,cockpit,ensemble,meteogram,mountain,worker,baselineText]=await Promise.all(['src/weather.ts','src/App.tsx','src/ForecastCockpit.tsx','src/EnsemblePanel.tsx','src/MeteogramPanel.tsx','src/mountainSports.ts','worker.js','MID_BASELINE.json'].map(read));
const full=['icon_seamless_eps','icon_global_eps','icon_eu_eps','icon_d2_eps','knmi_harmonie_arome_cy43_eps','ncep_gefs_seamless','ncep_gefs025','ncep_gefs05','ncep_aigefs025','ecmwf_ifs_europe_ensemble','ecmwf_aifs_europe_ensemble','ecmwf_ifs025_ensemble','ecmwf_aifs025_ensemble','gem_global_ensemble','eccc_reps','bom_access_global_ensemble','ukmo_global_ensemble_20km','ukmo_uk_ensemble_2km','meteoswiss_icon_ch1_ensemble','meteoswiss_icon_ch2_ensemble','google_weathernext2_ensemble'];
for(const id of full)assert.ok(weather.includes(`id:'${id}'`),`Full-member Ensemble fehlt: ${id}`);
for(const id of ['dwd_icon_d2_eps_ensemble_mean','dwd_icon_eu_eps_ensemble_mean','dwd_icon_eps_ensemble_mean','dwd_icon_eps_ensemble_mean_seamless','ncep_hgefs025_ensemble_mean','ncep_gefs025_ensemble_mean','ncep_gefs05_ensemble_mean','ncep_aigefs025_ensemble_mean'])assert.ok(weather.includes(`id:'${id}'`),`Mean/Spread Reserve fehlt: ${id}`);
assert.ok(!weather.includes("id:'ncep_hgefs025'"),'HGEFS darf nicht als Full-member Ensemble erfunden werden.');
for(const id of ['jma_msm','jma_seamless','jma_gsm']){assert.ok(weather.includes(id),`JMA deterministic catalog fehlt ${id}`);assert.ok(meteogram.includes(id),`Meteogramm fehlt ${id}`)}
assert.ok(worker.includes("id:'jma_msm'")&&worker.includes("id:'jma_gsm'"),'Worker-Fusion muss JMA MSM/GSM führen.');
assert.ok(!/jma_[a-z0-9_]*ensemble/.test(weather),'JMA darf ohne native Ensemblequelle nicht als Ensemble ausgewiesen werden.');
assert.ok(app.includes('const modelStatusRuns=useMemo'),'14-Tage-Modellstatus muss Ensemble + deterministische Kontrollläufe zusammenführen.');
assert.ok((app.match(/runs=\{modelStatusRuns\}/g)||[]).length>=2,'EnsemblePanel/Cockpit müssen vollständige Modellstatusläufe erhalten.');
assert.ok(cockpit.includes('Deterministische Kontrolle / Best Match')&&cockpit.includes('nicht als Ensemble-Mitglieder gewichtet'),'Cockpit trennt Modellarten nicht sauber.');
assert.ok(ensemble.includes('Deterministische Kontrolle / Best Match')&&ensemble.includes('nicht als Ensemble-Mitglieder gewichtet'),'Ensemble-Info trennt Modellarten nicht sauber.');
assert.ok(mountain.includes("meteoswiss_icon_ch1_ensemble_mean")&&mountain.includes("meteoswiss_icon_ch2_ensemble_mean")&&mountain.includes("'bbox'in model"),'Alpine Snowline-Analyse soll MeteoSwiss regional nutzen.');
const baseline=JSON.parse(baselineText);assert.ok(baseline.requiredRegressionTests.includes('scripts/test-model-family-completeness-09550.mjs'));
console.log('MID Modellfamilien vollständig geprüft: Full-member, Mean/Spread, deterministische JMA-Kontrolle und regionale Spezialmodelle bleiben fachlich getrennt.');
