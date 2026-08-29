import assert from 'node:assert/strict';
import {access,readFile,readdir} from 'node:fs/promises';
import {expectedIosNextMilestone,versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [appDelegate,push,background,plist,project,contract,roadmap,statusRaw,pkgRaw,baselineRaw]=await Promise.all([
 read('ios/App/App/AppDelegate.swift'),
 read('ios/App/App/MIDNativePushPreparation.swift'),
 read('ios/App/App/MIDBackgroundRefreshPreparation.swift'),
 read('ios/App/App/Info.plist'),
 read('ios/App/App.xcodeproj/project.pbxproj'),
 read('MID_APPLE_PUSH_BACKGROUND_CONTRACT.md'),
 read('MID_IOS_ROADMAP.md'),
 read('MID_IOS_STATUS.json'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const status=JSON.parse(statusRaw),pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-apple-push-background-source-preparation-09720.mjs';

for(const token of [
 'MIDNativePushPreparation.swift in Sources',
 'MIDBackgroundRefreshPreparation.swift in Sources',
 'path = MIDNativePushPreparation.swift;',
 'path = MIDBackgroundRefreshPreparation.swift;'
])assert.ok(project.includes(token),`Native Quellverdrahtung fehlt: ${token}`);

for(const token of [
 'didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data',
 'MIDNativePushPreparation.shared.receive(deviceToken: deviceToken)',
 'didFailToRegisterForRemoteNotificationsWithError error: Error',
 'didReceiveRemoteNotification userInfo: [AnyHashable: Any]',
 'handleBackgroundRemoteNotification'
])assert.ok(appDelegate.includes(token),`APNs-Callbackvorbereitung fehlt: ${token}`);
for(const forbidden of ['registerForRemoteNotifications()','requestAuthorization(','BGTaskScheduler.shared','registerPreparedTask()','schedulePreparedRefresh('])assert.ok(!appDelegate.includes(forbidden),`Apple-Funktion wurde vor dem Gate aktiviert: ${forbidden}`);

for(const token of [
 'deviceToken.map { String(format: "%02x", $0) }.joined()',
 'configureBackgroundPayloadHandler',
 'completion(.noData)',
 'static func safeDestination(from userInfo:',
 'host == "midwx.app"',
 'host == "www.midwx.app"',
 'host == "meteomartini.github.io"'
])assert.ok(push.includes(token),`Push-Quellvertrag fehlt: ${token}`);
for(const forbidden of ['UserDefaults','Keychain','URLSession','fetch(','registerForRemoteNotifications','requestAuthorization'])assert.ok(!push.includes(forbidden),`Push-Quellvorbereitung darf noch nicht aktiv/persistent sein: ${forbidden}`);

for(const token of [
 'static let taskIdentifier = "app.midwx.weather.background-refresh"',
 'BGTaskScheduler.shared.register(',
 'BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)',
 'BGTaskScheduler.shared.submit(request)',
 'task.expirationHandler',
 'task.setTaskCompleted(success: success)',
 'Bundle.main.object(forInfoDictionaryKey: "BGTaskSchedulerPermittedIdentifiers")'
])assert.ok(background.includes(token),`Background-Refresh-Quellvertrag fehlt: ${token}`);

for(const token of ['<key>BGTaskSchedulerPermittedIdentifiers</key>','<string>app.midwx.weather.background-refresh</string>'])assert.ok(plist.includes(token),`BGTask-Identifier fehlt: ${token}`);
assert.ok(!plist.includes('<key>UIBackgroundModes</key>'),'Background Modes dürfen in der Quellvorbereitung noch nicht aktiviert werden.');
assert.ok(!plist.includes('aps-environment'),'APNs-Entitlement darf nicht in Info.plist aktiviert werden.');
const appDir=await readdir(new URL('../ios/App/App/',import.meta.url));
assert.ok(!appDir.some(name=>/\.entitlements$/i.test(name)),'Vor dem Apple-Gate darf keine App-Entitlement-Datei erzeugt werden.');

for(const token of ['ruft **nicht** `registerForRemoteNotifications()` auf','`UIBackgroundModes` wird nicht aktiviert','APNs-Schlüssel/Zertifikate','gemeinsamen React/Vite-/Worker-Fachkern'])assert.ok(contract.includes(token),`Apple-Quellvertrag unvollständig: ${token}`);
assert.ok(roadmap.includes('Quellvorbereitung für Push und Hintergrundaktualisierung – **abgeschlossen in v0.9.72.0**'),'Roadmap markiert Push/Background nicht als abgeschlossen.');
assert.ok(versionAtLeast(pkg.version,'0.9.73.0')?roadmap.includes('Datenschutz- und Berechtigungsmanifest – abgeschlossen in v0.9.73.0'):roadmap.includes('Datenschutz- und Berechtigungsmanifest vollständig vorbereiten'),'Privacy-Meilenstein fehlt in der Roadmap.');
assert.ok(status.completed?.includes('apple-push-background-refresh-source-preparation-0.9.72.0'),'Status markiert den Meilenstein nicht als abgeschlossen.');
assert.equal(status.nextMilestone,expectedIosNextMilestone(pkg.version));
assert.ok(versionAtLeast(pkg.version,'0.9.72.0'));
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['MID_APPLE_PUSH_BACKGROUND_CONTRACT.md','ios/App/App/MIDNativePushPreparation.swift','ios/App/App/MIDBackgroundRefreshPreparation.swift'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);
for(const file of ['MID_APPLE_PUSH_BACKGROUND_CONTRACT.md','MID_IOS_ROADMAP.md','MID_IOS_STATUS.json'])assert.ok(baseline.protectedFiles?.includes(file),`${file} fehlt in protectedFiles.`);

await access(new URL('../ios/App/App/MIDNativePushPreparation.swift',import.meta.url));
await access(new URL('../ios/App/App/MIDBackgroundRefreshPreparation.swift',import.meta.url));
console.log(`MID v${pkg.version}: APNs- und BGAppRefresh-Quellen bleiben im iOS-Target vorbereitet, aber ohne vorzeitige Aktivierung.`);
