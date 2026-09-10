import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [worker,fusion,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('src/forecastFusion.ts',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('MID_MOSMIX_FRESHNESS_CONTRACT.md',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-mosmix-contribution-freshness-097915.mjs';
for(const token of [
 "const DWD_MOSMIX_S_INDEX='https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_S/all_stations/kml/'",
 "const DWD_MOSMIX_L_INDEX='https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/all_stations/kml/'",
 "function dwdMosmixRunMetaFromIndex(html,product='L')",
 '/MOSMIX_S_(\\d{10})_240\\.kmz/',
 '/MOSMIX_L_(\\d{10})\\.kmz/',
 "metadataSource:`DWD Open Data · MOSMIX-${kind} Laufindex`",
 'runMetaPromise=fetchDwdMosmixRunMeta(refresh)',
 'initialisationTime:shortRun?.initialisationTime',
 'availabilityTime:shortRun?.availabilityTime',
 'runFreshness:mosmixRunFreshness(shortRun?.initialisationTime,1)',
 'shortInitialisationTime:shortRun?.initialisationTime',
 'longInitialisationTime:longRun?.initialisationTime',
 'initialisationTime:mosmix.shortInitialisationTime',
 'availabilityTime:mosmix.shortAvailabilityTime'
])assert.ok(worker.includes(token),`MOSMIX-Laufmetadatenvertrag fehlt: ${token}`);
for(const token of [
 'initialisationTime?:string;',
 'runMetaSource?:string;',
 'coverageUntil?:string;',
 'function smoothLeadTransition(leadHours:number,startHours:number,endHours:number,startWeight:number,endWeight:number)',
 'export function mosmixHourlyLeadStrength(leadHours:number){const lead=Math.max(0,Number(leadHours)||0);if(lead<=3)return .18;if(lead<12)return smoothLeadTransition(lead,3,12,.18,.38)',
 'export function forecastFusionMosmixContributionRanges',
 'precipitation0to6:.28*q',
 'precipitation6to14:.20*q',
 'const leadStrength=mosmixHourlyLeadStrength(leadHours)'
])assert.ok(fusion.includes(token),`Frontend-MOSMIX-Anteilsvertrag fehlt: ${token}`);
for(const token of [
 'function cockpitModelFreshnessLabel(row:ModelRunMeta)',
 "return'Aktualität nicht verifizierbar'",
 "mosmix&&cadenceHours<=1?2.5:mosmix?Math.max(8.5,cadenceHours*1.45):Math.max(3,cadenceHours*1.6)",
 'function mosmixContributionDetail',
 'MOSMIX-Anteil ca. vor Begrenzungen',
 'Temperatur stündlich',
 'Tmin/Tmax',
 'Niederschlagsmenge bis',
 '${cockpitModelFreshnessLabel(row)}'
])assert.ok(cockpit.includes(token),`Modellstand-Transparenz fehlt: ${token}`);
for(const token of ['MOSMIX-L-Init zurückfallen','2,5 h','direkte Korrekturanteile','28 %','20 %'])assert.ok(contract.includes(token),`MOSMIX-Vertrag unvollständig: ${token}`);

assert.ok(!fusion.includes('leadHours<=6?.18:leadHours<=48?.38:leadHours<=120?.3:.16'),'MOSMIX-Gewicht darf nicht mehr hart an +6/+48/+120 h springen.');
for(const token of ['smoothLeadTransition(lead,3,12,.18,.38)','smoothLeadTransition(lead,42,60,.38,.3)','smoothLeadTransition(lead,108,132,.3,.16)'])assert.ok(fusion.includes(token),`MOSMIX-Übergangsfenster fehlt: ${token}`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline/Paketversion nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),`${test} fehlt in requiredFiles.`);
assert.ok(baseline.requiredFiles?.includes('MID_MOSMIX_FRESHNESS_CONTRACT.md'),'MOSMIX-Vertrag fehlt in requiredFiles.');
console.log(`MID v${pkg.version}: MOSMIX-Anteile, offizieller Init-Zyklus und Aktualitätswarnung sind abgesichert.`);
