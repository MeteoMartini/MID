import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const root=new URL("../",import.meta.url),read=p=>readFile(new URL(p,root),"utf8");
const [worker,source,forecast,contract,pkgRaw,baselineRaw]=await Promise.all([read("worker.js"),read("worker-src/00-core-observations.js"),read("src/ForecastCockpit.tsx"),read("MID_MOSMIX_FRESHNESS_CONTRACT.md"),read("package.json"),read("MID_BASELINE.json")]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test="scripts/test-mosmix-hourly-run-metadata-097916.mjs";
for(const code of [worker,source]){
 assert.ok(code.includes("DWD_MOSMIX_S_INDEX='https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_S/all_stations/kml/'"),'MOSMIX-S-Laufindex fehlt.');
 assert.ok(code.includes("/MOSMIX_S_(\\d{10})_240\\.kmz/"),'MOSMIX-S-Dateinamen werden nicht ausgewertet.');
 assert.ok(code.includes("fetchDwdMosmixRunIndex(DWD_MOSMIX_S_INDEX,'S',refresh)"),'MOSMIX-S wird nicht parallel verifiziert.');
 assert.ok(code.includes("updateHours:1"),'MOSMIX-S muss stündlich geführt werden.');
 assert.ok(code.includes("shortInitialisationTime:shortRun?.initialisationTime"),'Kurzfrist-Init muss separat ausgegeben werden.');
 assert.ok(code.includes("longInitialisationTime:longRun?.initialisationTime"),'MOSMIX-L-Init muss separat erhalten bleiben.');
 assert.ok(!code.includes("initialisationTime:longRun?.initialisationTime,availabilityTime:longRun?.availabilityTime,updateHours:1"),'MOSMIX-L darf nicht als stündlicher S-Fallback ausgegeben werden.');
}
assert.ok(forecast.includes("MOSMIX-S: stündliche Aktualisierung der ersten +24 h"),'Modellstand erklärt die stündliche MOSMIX-S-Aktualität nicht.');
assert.ok(forecast.includes("MOSMIX-L Langfrist-Init"),'Modellstand weist den separaten MOSMIX-L-Init nicht aus.');
assert.ok(contract.includes('MOSMIX-S: Solltakt 1 h')&&contract.includes('nicht')&&contract.includes('MOSMIX-L-Init'),'Frischevertrag sichert S/L-Trennung nicht.');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: MOSMIX-S stündlich und MOSMIX-L separat im Modellstand abgesichert.`);
