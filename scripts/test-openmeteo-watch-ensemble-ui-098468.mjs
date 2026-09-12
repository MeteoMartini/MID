import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const weatherSource=read('src/weather-src/00-types-models-search.tsfrag');
const observations=read('src/weather-src/10-observations-specialized.tsfrag');
const weather=read('src/weather.ts');
const workerSource=read('worker-src/00-core-observations.js');
const worker=read('worker/metar-proxy.js');
const modern=read('src/styles-src/30-modern.css');
const styles=read('src/styles.css');

for(const token of ['kma_ldps','kma_gdps']){
 assert.ok(!weatherSource.includes(`id:'${token}'`),`Suspendiertes KMA-Modell noch im Frontend-Katalog: ${token}`);
 assert.ok(!workerSource.includes(`id:'${token}'`),`Suspendiertes KMA-Modell noch im Worker-Katalog: ${token}`);
}
assert.ok(observations.includes("country==='KR'?['jma_msm','jma_seamless']"),'Südkorea-Fallback muss JMA MSM/Seamless verwenden.');
assert.ok(!observations.includes("kma_ldps:'KMA LDPS"),'Veraltetes KMA-Label darf nicht im Hyperlokal-Pfad bleiben.');
assert.ok(workerSource.includes("apiIds:['meteofrance_arome_france_hd_15min','meteofrance_arome_france_hd'"),'AROME HD 15-min muss vor dem stündlichen AROME-HD-Fallback aktiv sein.');
assert.ok(!workerSource.includes("'jma_gsm','kma_gdps','bom_access_global'"),'Stale KMA-GDPS-Referenz darf nicht im globalIds-Auswahlpfad bleiben.');
for(const token of ["country==='KR'?['jma_msm','jma_seamless']","apiIds:['meteofrance_arome_france_hd_15min','meteofrance_arome_france_hd'"]){
 assert.ok((token.startsWith('country')?weather:worker).includes(token),`Generiertes Aggregat fehlt: ${token}`);
}

for(const token of [
 '.ensemble-advanced-toggle{min-height:40px}',
 '.ensemble-advanced-toggle small{font-size:var(--mid-text-micro)',
 '.ensemble-advanced-toggle em{font-size:var(--mid-text-xs)',
 '.ensemble-forecast-compass>header small{font-size:var(--mid-text-micro)',
 '.ensemble-forecast-compass>div small,.ensemble-forecast-compass>div em{font-size:var(--mid-text-micro)',
 '.quickfacts .quickfact.weather>small,.model-change-models{font-size:var(--mid-text-micro)',
 '@media(pointer:coarse){.ensemble-advanced-toggle{min-height:44px}'
]) assert.ok(modern.includes(token),`Ensemble-UI-Audit fehlt: ${token}`);
assert.ok(styles.includes('MID v0.9.84.68 · UI-Audit: Ensemble-Offenlegung'),'Generiertes Stylesheet enthält den 0.9.84.68-Audit nicht.');

console.log('Open-Meteo-Watch-Patch und Ensemble-UI-Audit 0.9.84.68 geprüft.');
