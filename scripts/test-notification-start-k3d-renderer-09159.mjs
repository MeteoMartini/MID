import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,radar,styles,serviceWorker,legacyServiceWorker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../public/service-worker.js',import.meta.url),'utf8'),
 readFile(new URL('../public/sw.js',import.meta.url),'utf8'),
]);
for(const [name,sw] of [['service-worker.js',serviceWorker],['sw.js',legacyServiceWorker]]){
 assert.match(sw,/targetUrl=new URL\('\.\/'\s*,self\.registration\.scope\)/,`${name}: notification click must open the app root`);
 assert.match(sw,/targetUrl\.hash='';targetUrl\.search=''/,`${name}: notification click must discard settings/deep-link state`);
 assert.match(sw,/mid-notification/,`${name}: notification start marker missing`);
 assert.doesNotMatch(sw,/targetUrl=new URL\(String\(data\.url/,`${name}: payload URL must no longer control the opened view`);
 assert.match(sw,/MID_NOTIFICATION_OPEN/,`${name}: existing client reset message missing`);
}
assert.match(app,/event\.data\?\.type!=='MID_NOTIFICATION_OPEN'/,'App does not close overlays after a notification click');
assert.match(app,/setSettingsOpen\(false\)/,'notification click does not close settings');
assert.match(app,/setImprintOpen\(false\)/,'notification click does not close modal overlays');
assert.match(app,/mid-notification/,'notification query marker is not cleaned after startup');

assert.doesNotMatch(radar,/L\.svg\(\{pane:'mid-nowcast-objects'/,'premature custom renderer must not bypass the dedicated pane renderer');
assert.ok((radar.match(/pane="mid-nowcast-vectors"/g)||[]).length>=8,'all K3D vector primitives must use the dedicated vector pane');
assert.match(radar,/pane="mid-nowcast-labels"/,'K3D HTML marker pane missing');
assert.match(radar,/konrad-current-footprint-halo/,'visible K3D cell footprint halo missing');
assert.match(radar,/konrad-probability-corridor-halo/,'visible K3D corridor halo missing');
assert.match(radar,/konradForecastNodeIcon\(point,color,showLabel,timezone\)/,'K3D forecast time labels are not rendered');
assert.match(radar,/else\{const geometry=forecastConeGeometry\(cell\)/,'endpoint-only K3D fallback track missing');
assert.match(styles,/maplibre-mid-nowcast-vectors-pane/,'dedicated K3D vector pane styling missing');
assert.match(styles,/konrad-forecast-label/,'K3D permanent forecast label styling missing');

console.log('MID v0.9.15.9 notification start and K3D renderer regression passed.');
