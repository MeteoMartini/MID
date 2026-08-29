import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [adapter,app,runtime,pkgRaw,baselineRaw,statusRaw,plist,roadmap,implementation]=await Promise.all([
 read('src/locationPlatform.ts'),read('src/App.tsx'),read('src/runtimePlatform.ts'),read('package.json'),read('MID_BASELINE.json'),read('MID_IOS_STATUS.json'),read('ios/App/App/Info.plist'),read('MID_IOS_ROADMAP.md'),read('MID_IMPLEMENTATION_0.9.68.0.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),status=JSON.parse(statusRaw),test='scripts/test-native-location-adapter-09680.mjs';

assert.ok(versionAtLeast(pkg.version,'0.9.68.0'));
assert.equal(pkg.dependencies?.['@capacitor/geolocation'],'8.2.2');
assert.equal(pkg.scripts?.['test:native-location-adapter'],`node ${test}`);
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['src/locationPlatform.ts','MID_IMPLEMENTATION_0.9.68.0.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

assert.ok(runtime.includes('Capacitor.isNativePlatform()'));
assert.ok(adapter.includes("import('@capacitor/geolocation')"),'Native Geolocation muss lazy geladen werden.');
assert.ok(adapter.includes('Geolocation.checkPermissions()'));
assert.ok(adapter.includes("Geolocation.requestPermissions({permissions:['location']})"));
assert.ok(adapter.includes('Geolocation.getCurrentPosition(options)'));
assert.ok(adapter.includes('navigator.geolocation.getCurrentPosition('),'Browser-Fallback fehlt.');
assert.ok(adapter.includes("source:'native'")&&adapter.includes("source:'browser'"));
assert.ok(!adapter.includes('watchPosition('),'Der Einmal-Adapter darf kein Tracking starten.');
assert.ok(!adapter.includes('localStorage')&&!adapter.includes('sessionStorage'),'Der Adapter darf Koordinaten nicht selbst persistieren.');
assert.ok(app.includes("import {getMidCurrentPosition} from './locationPlatform';"));
assert.ok(app.includes('getMidCurrentPosition({enableHighAccuracy:true,timeout:15000,maximumAge:120000})'));
assert.ok(!app.includes('navigator.geolocation.getCurrentPosition('),'App muss ausschließlich den Plattformadapter nutzen.');

for(const key of ['NSLocationWhenInUseUsageDescription','NSLocationAlwaysAndWhenInUseUsageDescription'])assert.ok(plist.includes(key),`${key} fehlt.`);
assert.ok(plist.includes('Eine Hintergrund-Ortung findet nicht statt.'));
assert.ok(status.completed?.includes('native-location-adapter-with-browser-fallback'));
assert.equal(status.nextMilestone,versionAtLeast(pkg.version,'0.9.68.2')?'lifecycle-offline-resume-without-local-data-loss':versionAtLeast(pkg.version,'0.9.68.1')?'native-share-import-export-with-browser-fallback':'native-external-navigation-with-deep-link-return');
assert.ok(roadmap.includes('Standortadapter mit Browser-Fallback – abgeschlossen'));
assert.ok(implementation.includes('keine Hintergrund-Ortung')&&implementation.includes('navigator.geolocation'));

console.log('MID 0.9.68.0: nativer Einmal-Standortadapter, Berechtigung und Browser-Fallback geprüft.');
