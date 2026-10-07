import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,baselineRaw,canonical,active,renderer,downloader,sync,runtimeTest]=await Promise.all([
 read('package.json'),
 read('MID_BASELINE.json'),
 read('ci/github/workflows/widget-export.yml'),
 read('.github/workflows/widget-export.yml'),
 read('tools/widget-export/render-widget-matrix.mjs'),
 read('tools/widget-export/Download-MID-Widgets.ps1'),
 read('scripts/sync-github-workflows.mjs'),
 read('scripts/test-github-actions-runtime.mjs')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-widget-export-automation-0985178.mjs';

assert.equal(active,canonical,'Aktiver und kanonischer Widget-Workflow müssen bytegleich sein.');
for(const token of [
 "cron: '17 0,6,12,18 * * *'",
 'workflow_dispatch:',
 'permissions:\n  contents: read',
 'ref: mid-stable',
 'https://www.midwx.app/version.json',
 'render-widget-matrix.mjs',
 'mid-widget-export-latest.zip',
 'widget-latest',
 'MID Release Bot Token für Widget-Publikation erzeugen',
 'permission-contents: write',
 'MID_RELEASE_APP_CLIENT_ID',
 '--clobber'
])assert.ok(canonical.includes(token),`Widget-Workflow fehlt: ${token}`);
assert.ok(!canonical.includes('workflow_run:'),'Widget-Workflow darf nicht mehr automatisch nach Releases laufen.');
assert.ok(!canonical.includes('push:\n    branches:\n      - mid-stable'),'Widget-Workflow darf nicht mehr automatisch bei mid-stable-Push laufen.');
assert.equal((canonical.match(/cron:/g)||[]).length,1,'Widget-Workflow darf genau einen automatischen Zeitplan besitzen.');
for(const sha of [
 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
 'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
 'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
 'actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
 'actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1'
])assert.ok(canonical.includes(sha),`Workflow-Action ist nicht freigegeben/gepinnt: ${sha}`);

assert.match(renderer,/widgetUrlExportVariants\('https:\/\/www\.midwx\.app\/'\)/,'Renderer nutzt nicht den zentralen Widget-URL-Vertrag.');
assert.match(renderer,/variants\.length!==12/,'Renderer erzwingt nicht exakt zwölf Varianten.');
for(const name of ['malatya-kurve-7d-light.png','kuerecik-kompakt-5d-dark.png','amari-kurve-7d-dark.png'])assert.ok(renderer.includes(name),`Renderer-Vertrag kennt ${name} nicht.`);
for(const token of ['createHash','sha256','PNG-IHDR','manifest.json','SHA256SUMS.txt','MID_STABLE_SHA','MID_PUBLIC_VERSION'])assert.ok(renderer.includes(token),`Renderer-Validierung fehlt: ${token}`);
for(const token of [
 'const captureAttempts=3',
 'const captureTimeoutSeconds=180',
 'for(let attempt=1;attempt<=captureAttempts;attempt++)',
 "await rm(target,{force:true})",
 "await rm(`${target}.part.png`,{force:true})",
 'Widget-Rendering endgültig fehlgeschlagen'
])assert.ok(renderer.includes(token),`Renderer-Retryvertrag fehlt: ${token}`);
assert.ok(canonical.includes('timeout-minutes: 45'),'Widget-Workflow lässt den begrenzten Retryspielraum nicht zu.');

assert.ok(downloader.includes('releases/download/widget-latest/mid-widget-export-latest.zip'),'Windows-Downloader nutzt nicht den festen rollierenden Download.');
for(const token of ['Get-FileHash','Expand-Archive','Manifest.count -ne 12','ConvertFrom-Json','USERPROFILE'])assert.ok(downloader.includes(token),`Windows-Downloader fehlt: ${token}`);

assert.ok(sync.includes("['workflows/widget-export.yml','workflows/widget-export.yml']"),'Widget-Workflow ist nicht Teil der kanonischen Workflow-Synchronisierung.');
assert.ok(runtimeTest.includes("'widget-export.yml'"),'Allgemeine Actions-Runtime-Prüfung umfasst den Widget-Workflow nicht.');
assert.equal(pkg.scripts?.['test:widget-export-automation'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['ci/github/workflows/widget-export.yml','tools/widget-export/render-widget-matrix.mjs','tools/widget-export/Download-MID-Widgets.ps1','tools/widget-export/README.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

console.log(`MID v${pkg.version}: serverseitiger Widget-Export, rollierendes geprüftes ZIP und adminfreier Windows-Downloader sind vertraglich abgesichert.`);
