import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [audit,feasibility,decoderContract,pkgText,baselineText,worker]=await Promise.all([
 readFile(new URL('../MID_KNMI_HARMONIE_EPS_ACTIVATION_AUDIT_0.9.77.23.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_KNMI_HARMONIE_EPS_DECODER_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../worker.js',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-knmi-eps-wasm-feasibility-097723.mjs';
for(const token of ['@meri-imperiumi/eccodes-wasm','wasm32','MEMFS','codes_grib_find_nearest','3 MB','128 MB','10 ms','Cloudflare Queues','10.000 Queue-Operationen/Tag','5 Minuten CPU'])assert.ok(feasibility.includes(token),`Wasm-/Free-Runtime-Gate fehlt: ${token}`);
for(const token of ['keine neue Dependency','keine Queue','keine neue Cloudflare-Ressource'])assert.ok(feasibility.includes(token),`Fail-closed Aktivierungsgate fehlt: ${token}`);
assert.ok(audit.includes('kostenfreier Wasm-/Queue-Pfad'),'Aktivierungs-Audit muss den neuen kostenfreien Kandidaten nennen.');
assert.ok(decoderContract.includes('Kostenfreier Wasm-/Queue-Prototyp'),'Decodervertrag muss den Prototypstatus schützen.');
assert.ok(!pkg.dependencies?.['@meri-imperiumi/eccodes-wasm']&&!pkg.devDependencies?.['@meri-imperiumi/eccodes-wasm'],'Unvalidiertes ecCodes-Wasm darf noch keine npm-Dependency sein.');
assert.ok(!/\bqueues\b\s*[:=]/i.test(worker),'Produktiver Worker darf in diesem Release keine Queue-Bindings/Consumer-Logik erhalten.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),'Wasm-Machbarkeitsregression muss Pflichtdatei sein.');
assert.ok(baseline.requiredFiles.includes('MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md'),'Wasm-Machbarkeitsdokument muss Pflichtdatei sein.');
console.log(`MID v${pkg.version}: ecCodes-Wasm-/Free-Queue-Kandidat fail-closed dokumentiert; keine Dependency, Queue oder Worker-Aktivierung.`);
