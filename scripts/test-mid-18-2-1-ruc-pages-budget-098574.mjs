import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fetcher,pack,pages,worker,shortTerm,pkgRaw,baselineRaw]=await Promise.all([
 read('tools/ruc/fetch_and_build_ruc.py'),
 read('tools/ruc/ruc_pack.py'),
 read('tools/ruc/prepare_ruc_pages.py'),
 read('worker.js'),
 read('src/ShortTermForecast.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-mid-18-2-1-ruc-pages-budget-098574.mjs';

assert.ok(fetcher.includes("RAPID_STATE_OPTIONAL_15=('VIS','CEILING')"),'Native 15-min state must be restricted to fast-changing visibility/ceiling.');
for(const token of ["'HZEROCL','SNOWLMT','CLCM','CLCH','T_G','H_SNOW'","FORECAST_REQUIRED=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','TOT_PREC','CLCT','CLCL'"])assert.ok(fetcher.includes(token),'Hourly RUC fallback/specialist contract regressed: '+token);
assert.ok(!fetcher.match(/RAPID_OPTIONAL_15=.*ASOB_S/),'Unused 15-min solar fields must not be downloaded in the free production preprocessing path.');
assert.ok(pack.includes("FieldSpec('visibility', 'm', 10.0)")&&pack.includes("FieldSpec('ceiling', 'm', 1.0)"),'Rapid state pack must retain visibility and ceiling.');
const stateBlock=pack.slice(pack.indexOf('RAPID_STATE_15_FIELDS'),pack.indexOf('REFLECTIVITY_15M_FIELDS'));
for(const forbidden of ['freezing_level_height','snowline_height','cloud_cover','temperature_2m'])assert.ok(!stateBlock.includes(forbidden),'Slow/hourly field leaked into rapid state pack: '+forbidden);
assert.ok(pages.includes("PAGES_RUC_BUDGET_BYTES=900_000_000"),'Pages-free RUC budget must fail before the 950 MB combined-site guard.');
assert.ok(pages.includes("PAGES_OMIT_RAPID_PRODUCTS={'solar15'}"),'Unused solar15 full-grid product must be omitted from Pages.');
assert.ok(pages.includes("PAGES_STATE15_FIELDS={'visibility','ceiling'}"),'Pages state15 projection must keep only visibility and ceiling.');
assert.ok(pages.includes("raise ValueError(f'Pages-free RUC payload {total} bytes exceeds {PAGES_RUC_BUDGET_BYTES} byte budget')"),'Pages overflow must fail during preparation, before artifact upload/publish.');
assert.ok(worker.includes("rapidSolar15:false")&&worker.includes("rapidState15:false"),'Worker health must continue treating optional rapid products as optional.');
assert.ok(shortTerm.includes('stateCeiling=finite(quarter?.ceiling)??base.ceiling')&&shortTerm.includes('stateVisibility=finite(quarter?.visibility)??base.visibility'),'Short-term forecast must consume native 15-min visibility/ceiling when present and fall back hourly otherwise.');
assert.equal(pkg.version,'0.9.85.74');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} missing in ${key}`);

console.log('MID v0.9.85.74: RUC Pages payload prioritizes 15-min visibility/ceiling, keeps slow fields hourly and enforces a 900 MB RUC budget.');
