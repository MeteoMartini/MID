import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [capture,canonical,active,pkgRaw,baselineRaw]=await Promise.all([
 read('tools/widget-export/capture-widget.mjs'),
 read('ci/github/workflows/widget-export.yml'),
 read('.github/workflows/widget-export.yml'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-widget-export-browser-runtime-0985181.mjs';

assert.equal(active,canonical,'Aktiver und kanonischer Widget-Workflow müssen bytegleich sein.');
for(const token of [
 "process.env.MID_WIDGET_BROWSER",
 "/usr/bin/google-chrome-stable",
 "/usr/bin/google-chrome",
 "/usr/bin/chromium",
 "/usr/bin/chromium-browser",
 "--no-sandbox",
 "--disable-dev-shm-usage",
 "Browser-Debuggingport wurde nicht bereitgestellt",
 "Browser konnte nicht gestartet werden",
 "browserFailure"
])assert.ok(capture.includes(token),`Cross-Platform-Renderer fehlt: ${token}`);
assert.ok(!capture.includes("if(!edge)throw new Error('Microsoft Edge wurde nicht gefunden.')"),'Renderer darf Linux nicht mehr auf Microsoft Edge festnageln.');

for(const token of [
 'Chromium-Browser für CDP-Renderer festlegen',
 'command -v google-chrome-stable',
 'MID_WIDGET_BROWSER=$browser',
 'Auf diesem GitHub-Runner wurde kein Chrome/Chromium-Browser gefunden'
])assert.ok(canonical.includes(token),`Widget-Workflow-Browserpreflight fehlt: ${token}`);

assert.equal(pkg.scripts?.['test:widget-export-browser-runtime'],`node ${self}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes('tools/widget-export/capture-widget.mjs'),'capture-widget.mjs fehlt in requiredFiles.');

console.log(`MID v${pkg.version}: Widget-CDP-Renderer ist auf Windows/macOS/Linux browserportabel und CI-Linux wird vor dem Rendering fail-closed geprüft.`);
