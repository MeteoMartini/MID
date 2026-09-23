import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root),'utf8');

const thunder=read('src/thunderstorm.ts'),detail=read('src/detailThunderRisk.ts'),fusion=read('src/forecastFusion.ts'),water=read('src/WaterSportsPanel.tsx'),short=read('src/ShortTermForecast.tsx'),cockpit=read('src/ForecastCockpit.tsx');
assert.ok(detail.includes('signalScore:number')&&!detail.includes('percent:number'),'Detail-Gewittervertrag muss signalScore statt percent führen.');
assert.ok(!detail.includes('Gewitterrisiko'),'Kanonische Modelldiagnose darf nicht als Gewitterrisiko bezeichnet werden.');
assert.ok(!thunder.includes('numericalPercent')&&!thunder.includes('rapidRisk?.percent')&&!thunder.includes('modelRisk?.percent'),'ThunderInfo darf keine Legacy-Prozentdiagnose mehr verwenden.');
assert.ok(thunder.includes('Signal ${numericalSignalScore}/100')&&thunder.includes('ICON-D2-RUC Gewittersignal'),'ThunderInfo muss diagnostische Signalstärke anzeigen.');
assert.ok(!fusion.includes('percent:number;')&&fusion.includes('signalScore:number;'),'RapidThunderRisk darf keinen Prozentalias mehr besitzen.');
assert.ok(fusion.includes('rapidTimedIngredient')&&fusion.includes('capeMuEpoch?:number')&&fusion.includes('cinMuEpoch?:number'),'MU-CAPE/CIN brauchen eigene Valid-Time-Prüfung.');
assert.ok(!water.includes('thunderRisk?.percent')&&!short.includes('thunderPercent')&&!cockpit.includes('thunderPercent'),'Spezialansichten dürfen keinen alten Gewitter-Prozentpfad führen.');

const fetcher=read('tools/ruc/fetch_and_build_ruc.py'),packer=read('tools/ruc/ruc_pack.py'),builder=read('tools/ruc/build_ruc_bundle.py'),worker=read('worker-src/00-core-observations.js');
assert.ok(fetcher.includes("SPECIALIST_HOURLY_OPTIONAL=('CAPE_MU','CIN_MU'"),'MU-CAPE/CIN müssen stündliche Spezialfelder sein.');
const severeBlock=packer.slice(packer.indexOf('SEVERE_15M_FIELDS'),packer.indexOf('SOLAR_15M_FIELDS'));
assert.ok(!severeBlock.includes('cape_mu')&&!severeBlock.includes('cin_mu'),'MU-CAPE/CIN dürfen nicht im 15-min-Severe-Pack liegen.');
const specialistBlock=packer.slice(packer.indexOf('SPECIALIST_HOURLY_FIELDS'),packer.indexOf('PHASE_15M_FIELDS'));
assert.ok(specialistBlock.includes('cape_mu')&&specialistBlock.includes('cin_mu'),'MU-CAPE/CIN fehlen im stündlichen Specialist-Pack.');
assert.ok(builder.includes("SPECIALIST_PARAM_MAP={'CAPE_MU':'cape_mu','CIN_MU':'cin_mu'"),'Builder muss MU-CAPE/CIN stündlich abbilden.');
assert.ok(worker.includes('capeMuEpoch')&&worker.includes('cinMuEpoch'),'Worker muss MU-Gültigkeitszeiten an den Browser liefern.');
assert.ok(worker.includes('nativeVisibilitySeconds')&&worker.includes('nativeCeilingSeconds')&&!worker.includes('nativeStateSeconds:stateIndex===undefined?undefined:900'),'15-min-State darf nur feldspezifisch markiert werden.');

const sky=read('src/detailSkyBar.ts');
assert.ok(!sky.includes('komplementär zu'),'Skybar darf 1-Bewölkung nicht als Sonnenscheindauer etikettieren.');
assert.ok(sky.includes('Sonnenscheindauer nicht verfügbar')&&sky.includes('Wolkenlücken'),'Cloud-Fallback muss als Himmelsanteil statt Sonnenscheindauer benannt sein.');

const models=read('src/weather-src/00-types-models-search.tsfrag'),ensemble=read('src/weather-src/30-ensemble-climate-hazards.tsfrag');
assert.ok(models.includes("google_weathernext2_ensemble',label:'Google WeatherNext 2'")&&models.includes('nativeTemporalHours:6,interpolatedHourly:true'),'WeatherNext 2 braucht native 6-h-Provenienz.');
assert.ok(models.includes('(model.nativeTemporalHours??1)<=1'),'Stündliche Event-Ensembles müssen grobe interpolierte Modelle ausschließen.');
assert.ok(ensemble.includes('(model.nativeTemporalHours??1)<=1'),'Stündliche Warn-Ensembles müssen grobe interpolierte Modelle ausschließen.');
assert.ok(ensemble.includes('temporalWeight'),'Tagesensemble muss native Zeitauflösung in der Gewichtung berücksichtigen.');

assert.equal(fs.existsSync(new URL('src/weather.tsfrag',root)),false,'Obsoleter weather.tsfrag-Parallelstand darf nicht existieren.');
console.log('MID 18.2.8 J.1–J.5: Gewittersemantik, Valid-Time, Skybar, Ensemble-Provenienz und Aggregate-Härtung geprüft.');
