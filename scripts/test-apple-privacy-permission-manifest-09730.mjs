import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {expectedIosNextMilestone,versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [appPrivacy,widgetPrivacy,project,plist,filePlatform,deviceSync,analytics,widgetProvider,contract,roadmap,statusRaw,pkgRaw,baselineRaw,implementation,sourceTruth]=await Promise.all([
 read('ios/App/App/PrivacyInfo.xcprivacy'),read('ios/App/MIDWidgets/PrivacyInfo.xcprivacy'),read('ios/App/App.xcodeproj/project.pbxproj'),read('ios/App/App/Info.plist'),read('src/filePlatform.ts'),read('src/deviceSync.ts'),read('src/webAnalytics.ts'),read('ios/App/MIDWidgets/MIDWidgetProvider.swift'),read('MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md'),read('MID_IOS_ROADMAP.md'),read('MID_IOS_STATUS.json'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.73.0.md'),read('MID_SOURCE_OF_TRUTH.md')
]);
const status=JSON.parse(statusRaw),pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-apple-privacy-permission-manifest-09730.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.73.0'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(status.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:apple-privacy-permission-manifest'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['ios/App/App/PrivacyInfo.xcprivacy','ios/App/MIDWidgets/PrivacyInfo.xcprivacy','MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md','MID_IMPLEMENTATION_0.9.73.0.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);
for(const file of ['ios/App/App/PrivacyInfo.xcprivacy','ios/App/MIDWidgets/PrivacyInfo.xcprivacy','MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md','MID_IOS_ROADMAP.md','MID_IOS_STATUS.json'])assert.ok(baseline.protectedFiles?.includes(file),`${file} fehlt in protectedFiles.`);

assert.ok(appPrivacy.includes('<key>NSPrivacyTracking</key>')&&appPrivacy.includes('<false/>'),'App-Tracking muss deaktiviert sein.');
assert.ok(!appPrivacy.includes('NSPrivacyTrackingDomains'),'Bei Tracking=false dürfen keine Tracking-Domains vorgetäuscht werden.');
for(const dataType of ['NSPrivacyCollectedDataTypePreciseLocation','NSPrivacyCollectedDataTypeDeviceID','NSPrivacyCollectedDataTypeOtherUserContent','NSPrivacyCollectedDataTypeProductInteraction','NSPrivacyCollectedDataTypePerformanceData'])assert.ok(appPrivacy.includes(dataType),`App-Datentyp fehlt: ${dataType}`);
for(const purpose of ['NSPrivacyCollectedDataTypePurposeAppFunctionality','NSPrivacyCollectedDataTypePurposeAnalytics'])assert.ok(appPrivacy.includes(purpose),`App-Datenzweck fehlt: ${purpose}`);
assert.ok(appPrivacy.includes('NSPrivacyAccessedAPICategoryFileTimestamp')&&appPrivacy.includes('<string>C617.1</string>'),'Capacitor-Filesystem-Required-Reason fehlt.');
assert.ok(!appPrivacy.includes('NSPrivacyAccessedAPICategoryUserDefaults'),'MID verwendet keinen nativen Preferences/UserDefaults-Adapter.');

assert.ok(widgetPrivacy.includes('<key>NSPrivacyTracking</key>')&&widgetPrivacy.includes('<false/>'),'Widget-Tracking muss deaktiviert sein.');
for(const dataType of ['NSPrivacyCollectedDataTypePreciseLocation','NSPrivacyCollectedDataTypeOtherUserContent'])assert.ok(widgetPrivacy.includes(dataType),`Widget-Datentyp fehlt: ${dataType}`);
for(const forbidden of ['NSPrivacyCollectedDataTypeDeviceID','NSPrivacyCollectedDataTypeProductInteraction','NSPrivacyCollectedDataTypePerformanceData','NSPrivacyAccessedAPICategoryFileTimestamp','NSPrivacyTrackingDomains'])assert.ok(!widgetPrivacy.includes(forbidden),`Widget-Manifest ist zu weit gefasst: ${forbidden}`);

for(const token of ['PrivacyInfo.xcprivacy in Resources','7A7300010000000000000001 /* PrivacyInfo.xcprivacy */','7A7300010000000000000002 /* PrivacyInfo.xcprivacy */'])assert.ok(project.includes(token),`Xcode-Privacy-Resource fehlt: ${token}`);
const privacyResourceCount=(project.match(/PrivacyInfo\.xcprivacy in Resources/g)||[]).length;assert.equal(privacyResourceCount,4,'App und Widget benötigen je BuildFile plus Resource-Phase-Verweis.');

assert.ok(filePlatform.includes("import('@capacitor/filesystem')")&&filePlatform.includes('Filesystem.writeFile('),'Filesystem-Nutzung als Required-Reason-Ursache fehlt.');
assert.ok(deviceSync.includes('function newDeviceId()')&&deviceSync.includes("workerPost('device-sync-push',{syncKey:config.syncKey,deviceId:config.deviceId"),'Optionale gerätebezogene Sync-ID ist nicht fachlich belegt.');
assert.ok(deviceSync.includes('encryptSnapshot(')&&deviceSync.includes('encryptPayload('),'Synchronisierter Nutzerinhalt muss vor Worker-Übertragung clientseitig verschlüsselt bleiben.');
assert.ok(analytics.includes("https://static.cloudflareinsights.com/beacon.min.js")&&analytics.includes("performance.getEntriesByName"),'Cloudflare-RUM-/Performance-Pfad fehlt.');
for(const token of ['URLQueryItem(name: "lat"','URLQueryItem(name: "lon"','URLQueryItem(name: "name"'])assert.ok(widgetProvider.includes(token),`Widget-Off-device-Konfiguration fehlt: ${token}`);

for(const forbidden of ['<key>UIBackgroundModes</key>','aps-environment','NSUserTrackingUsageDescription'])assert.ok(!plist.includes(forbidden),`Privacy-Meilenstein darf keine neue Apple-Capability/Berechtigung aktivieren: ${forbidden}`);
assert.ok(plist.includes('NSLocationWhenInUseUsageDescription')&&plist.includes('NSMotionUsageDescription'),'Bestehende sichtbare Berechtigungstexte müssen erhalten bleiben.');

for(const token of ['NSPrivacyAccessedAPICategoryFileTimestamp','C617.1','NSPrivacyTracking` ist `false`','keinen ATT-Prompt','macOS-/Xcode-Qualitätssicherung'])assert.ok(contract.includes(token),`Privacy-Vertrag unvollständig: ${token}`);
assert.ok(roadmap.includes('Datenschutz- und Berechtigungsmanifest – abgeschlossen in v0.9.73.0'),'Roadmap markiert Privacy nicht als abgeschlossen.');
assert.ok(roadmap.includes('macOS-/Xcode-Qualitätssicherung – **nächstes Gate**'),'Roadmap markiert das echte nächste Gate nicht.');
assert.ok(status.completed?.includes('apple-privacy-permission-manifest-preparation-0.9.73.0'),'Status markiert Privacy nicht als abgeschlossen.');
assert.equal(status.nextMilestone,expectedIosNextMilestone(pkg.version));
assert.equal(status.nextMilestone,'macos-xcode-simulator-quality-assurance');
assert.ok(implementation.includes('PrivacyInfo.xcprivacy')&&implementation.includes('C617.1')&&implementation.includes('macos-xcode-simulator-quality-assurance'));
assert.ok(sourceTruth.includes('MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md'),'Source of Truth referenziert den neuen Privacy-Vertrag nicht.');
await access(new URL('../ios/App/App/PrivacyInfo.xcprivacy',import.meta.url));
await access(new URL('../ios/App/MIDWidgets/PrivacyInfo.xcprivacy',import.meta.url));
console.log(`MID v${pkg.version}: Apple Privacy-Manifeste für App und Widget sind fachlich begrenzt, trackingfrei und im jeweiligen Xcode-Target verdrahtet.`);
