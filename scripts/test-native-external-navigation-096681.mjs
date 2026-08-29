import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [adapter,runtime,app,station,settings,pkgRaw,baselineRaw,statusRaw,plist,workerSource,roadmap,implementation]=await Promise.all([
 read('src/externalNavigation.ts'),read('src/runtimePlatform.ts'),read('src/App.tsx'),read('src/connectedStation.ts'),read('src/ConnectedStationSettings.tsx'),read('package.json'),read('MID_BASELINE.json'),read('MID_IOS_STATUS.json'),read('ios/App/App/Info.plist'),read('worker-src/30-push-events.js'),read('MID_IOS_ROADMAP.md'),read('MID_IMPLEMENTATION_0.9.68.1.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),status=JSON.parse(statusRaw),test='scripts/test-native-external-navigation-096681.mjs';

assert.ok(versionAtLeast(pkg.version,'0.9.68.1'));
assert.equal(pkg.dependencies?.['@capacitor/browser'],'8.0.4');
assert.equal(pkg.scripts?.['test:native-external-navigation'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['src/externalNavigation.ts','MID_IMPLEMENTATION_0.9.68.1.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

assert.ok(adapter.includes("import('@capacitor/browser')")&&adapter.includes('Browser.open('),'Nativer Systembrowser fehlt.');
assert.ok(adapter.includes("window.open(url.toString(),'_blank')")&&adapter.includes('window.location.assign(url.toString())'),'Browser-/PWA-Fallback fehlt.');
assert.ok(adapter.includes("url.protocol!=='https:'"),'Externe Zieladressen müssen auf HTTPS begrenzt sein.');
assert.ok(adapter.includes("url.protocol===MID_OAUTH_SCHEME")&&adapter.includes("url.hostname===MID_OAUTH_HOST")&&adapter.includes("url.pathname===NETATMO_CALLBACK_PATH"),'Deep-Link-Allowlist fehlt.');
assert.ok(adapter.includes("NETATMO_RESULTS.has(result)")&&adapter.includes("/^[A-Za-z0-9_-]{16,128}$/"),'Callback-Daten werden nicht ausreichend validiert.');
assert.ok(adapter.includes("Browser.close().catch"),'Sicherer Rücksprung schließt den nativen Browser nicht.');
assert.ok(!adapter.includes('localStorage.removeItem(CONNECTED_STATION_SETTINGS_KEY)'),'Adapter darf keine Fachdaten löschen.');

assert.ok(runtime.includes("App.addListener('appUrlOpen'")&&runtime.includes('App.getLaunchUrl()'),'Warme und kalte Deep-Link-Starts müssen verarbeitet werden.');
assert.ok(runtime.includes('pendingNativeUrl'),'Deep Link darf vor dem React-Mount nicht verloren gehen.');
assert.ok(app.includes("window.addEventListener('mid:native-url-open'")&&app.includes('captureMidExternalOAuthReturn'),'App konsumiert native Rücksprünge nicht.');
assert.ok(station.includes("midExternalOAuthReturnUrl('netatmo')")&&station.includes('openMidExternalAuthorization('),'Netatmo nutzt den Plattformadapter nicht.');
assert.ok(settings.includes("mode==='external-browser'||mode==='native-browser'"),'Native OAuth-Navigation fehlt in der UI.');

assert.ok(plist.includes('<string>midwx</string>')&&plist.includes('<string>app.midwx.weather.oauth</string>'),'iOS-URL-Schema fehlt.');
assert.ok(workerSource.includes("url.protocol==='midwx:'")&&workerSource.includes("url.hostname==='oauth'")&&workerSource.includes("url.pathname==='/netatmo'"),'Worker erlaubt den eng begrenzten nativen Rücksprung nicht.');
assert.ok(workerSource.includes("request.headers.get('origin')||'').toLowerCase()!=='capacitor://localhost'")&&workerSource.includes('!netatmoNativeOriginAllowed(request,body?.returnUrl)'),'Native WebView darf nur mit dem exakten OAuth-Rücksprung die Ursprungsgrenze passieren.');
assert.ok(status.completed?.includes('native-external-navigation-with-deep-link-return'));
assert.equal(status.nextMilestone,versionAtLeast(pkg.version,'0.9.70.1')?'widgetkit-xcode-structure-with-mid-native-widget-v1':versionAtLeast(pkg.version,'0.9.68.2')?'lifecycle-offline-resume-without-local-data-loss':'native-share-import-export-with-browser-fallback');
assert.ok(roadmap.includes('externe OAuth-Navigation und sichere Rückkehr – abgeschlossen in v0.9.68.1'));
assert.ok(implementation.includes('SFSafariViewController')&&implementation.includes('midwx://oauth/netatmo'));

console.log('MID 0.9.68.1: native externe OAuth-Navigation, validierter Deep-Link-Rücksprung und Browserfallback geprüft.');
