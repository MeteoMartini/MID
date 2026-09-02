import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {splitGrib1Messages} from '../tools/knmi_eps_wasm_prototype/adapter.mjs';

const [cSource,build,adapter,cloudflareAdapter,readme,feasibility,worker,pkgText,baselineText,statusText]=await Promise.all([
 readFile(new URL('../tools/knmi_eps_wasm_prototype/mid_eccodes_point.c',import.meta.url),'utf8'),
 readFile(new URL('../tools/knmi_eps_wasm_prototype/build_wasm32.sh',import.meta.url),'utf8'),
 readFile(new URL('../tools/knmi_eps_wasm_prototype/adapter.mjs',import.meta.url),'utf8'),
 readFile(new URL('../tools/knmi_eps_wasm_prototype/cloudflare_precompiled.mjs',import.meta.url),'utf8'),
 readFile(new URL('../tools/knmi_eps_wasm_prototype/README.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/20-composite-models.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_IOS_STATUS.json',import.meta.url),'utf8')
]);

for(const token of ['codes_handle_new_from_message_copy','codes_grib_nearest_new','codes_grib_nearest_find','indicatorOfParameter','indicatorOfTypeOfLevel','timeRangeIndicator','perturbationNumber'])assert.ok(cSource.includes(token),`Schmaler ecCodes-C-Punktvertrag fehlt: ${token}`);
assert.ok(!cSource.includes('codes_get_double_array')&&!cSource.includes('"values"'),'Wasm-Prototyp darf kein Vollgitter nach JavaScript kopieren.');
for(const token of ['ECCODES_VERSION="${ECCODES_VERSION:-2.48.1}"','759ca8e5c9b55883afff8cea5f9fe4d333e5b970','ENABLE_MEMFS=ON','ENABLE_PRODUCT_GRIB=ON','ENABLE_PRODUCT_BUFR=OFF','FILESYSTEM=0','INITIAL_MEMORY=25165824','MAXIMUM_MEMORY=100663296','ENVIRONMENT=\'web,worker\''])assert.ok(build.includes(token),`Reproduzierbarer Wasm32/MEMFS-Buildvertrag fehlt: ${token}`);
const executableBuild=build.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n');
assert.ok(!/(^|\s)-m64(?:\s|$)/m.test(executableBuild)&&!executableBuild.includes('-lnodefs.js'),'Wasm32-Prototyp darf weder wasm64 noch NODEFS aktivieren.');
assert.ok(build.includes("EXPORTED=\"['_mid_grib1_nearest','_malloc','_free']\""),'Nur schmale C-ABI darf exportiert werden.');
for(const token of ['splitGrib1Messages','_mid_grib1_nearest','HEAPU8','HEAPF64','HEAP32'])assert.ok(adapter.includes(token),`Wasm-JS-Adaptervertrag fehlt: ${token}`);
for(const token of ['WebAssembly.Module','instantiateWasm','new WebAssembly.Instance'])assert.ok(cloudflareAdapter.includes(token),`Precompiled-Wasm-Modulvertrag fehlt: ${token}`);
assert.ok(!cloudflareAdapter.includes('WebAssembly.compile')&&!cloudflareAdapter.includes('fetch(')&&!cloudflareAdapter.includes('instantiate(ArrayBuffer'),'Cloudflare-Prototyp darf Wasm nicht dynamisch aus Bytes kompilieren.');
for(const token of ['2.48.1','wasm32','ENABLE_MEMFS=ON','keine Queue','keine Cloudflare'])assert.ok(readme.includes(token),`Prototype-README fehlt: ${token}`);
assert.ok(feasibility.includes('fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Prototyp'),'Machbarkeitsvertrag muss diesen Prototyp als nächsten Schritt nennen.');

const fake=new Uint8Array(12);fake.set([0x47,0x52,0x49,0x42,0,0,12,1],0);fake.set([0x37,0x37,0x37,0x37],8);
const messages=splitGrib1Messages(fake);assert.equal(messages.length,1);assert.equal(messages[0].byteLength,12);
assert.throws(()=>splitGrib1Messages(Uint8Array.from([0x47,0x52,0x49,0x42,0,0,12,2,0x37,0x37,0x37,0x37])),/GRIB1/);

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),status=JSON.parse(statusText),test='scripts/test-knmi-eps-wasm32-prototype-097724.mjs';
assert.equal(pkg.version,'0.9.77.24');assert.equal(baseline.releaseVersion,'0.9.77.24');assert.equal(status.releaseVersion,'0.9.77.24');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
for(const path of ['tools/knmi_eps_wasm_prototype/mid_eccodes_point.c','tools/knmi_eps_wasm_prototype/build_wasm32.sh','tools/knmi_eps_wasm_prototype/adapter.mjs','tools/knmi_eps_wasm_prototype/cloudflare_precompiled.mjs','tools/knmi_eps_wasm_prototype/report_bundle.py','tools/knmi_eps_wasm_prototype/benchmark.mjs','tools/knmi_eps_wasm_prototype/README.md',test])assert.ok(baseline.requiredFiles.includes(path),`Pflichtdatei fehlt: ${path}`);
assert.ok(!pkg.dependencies?.['@meri-imperiumi/eccodes-wasm']&&!pkg.devDependencies?.['@meri-imperiumi/eccodes-wasm'],'Prototyp darf noch keine npm-Produktionsdependency einführen.');
assert.ok(!/\bqueues\b\s*[:=]/i.test(worker),'Produktiver Worker darf weiterhin keine Queue-Bindings/Consumer-Logik erhalten.');
console.log('MID v0.9.77.24: fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Prototyp fail-closed vorbereitet; kein NODEFS, Vollgitter, Queue- oder Worker-Aktivierungspfad.');
