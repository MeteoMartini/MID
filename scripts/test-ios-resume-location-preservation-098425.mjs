import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,policy,safety,sync,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),read('src/portableUserData.ts'),read('src/storageSafety.ts'),read('src/deviceSync.ts'),read('src/main.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-ios-resume-location-preservation-098425.mjs';
for(const token of ["const LOCATION_STORAGE_KEY='mid:lastLocation'","const LOCATION_UPDATED_AT_KEY='mid:lastLocation:updated-at'",'function persistSelectedLocation(location:Location,revise=true)','persistSelectedLocation(normalized,true)','persistSelectedLocation(resolvedLocation,false)'])assert.ok(app.includes(token),`Auswahlort-Persistenz fehlt: ${token}`);
for(const token of ["'mid:lastLocation'","'mid:lastLocation:updated-at'","'mid:lastTrackedLocation'"])assert.ok(policy.includes(token),`Gerätelokaler Standortschlüssel fehlt: ${token}`);
assert.ok(policy.includes("DEVICE_LOCAL_KEYS.has(key)")&&policy.includes('if(DEVICE_LOCAL_KEYS.has(key))return false;'),'Gerätelokale Schlüssel müssen vom portablen Snapshot ausgeschlossen werden.');
for(const token of ["const LOCATION_STORAGE_KEY='mid:lastLocation'","const LOCATION_UPDATED_AT_KEY='mid:lastLocation:updated-at'","if(key===LOCATION_STORAGE_KEY)return entryTimestamp(lookup(LOCATION_UPDATED_AT_KEY)||'')||entryTimestamp(raw)","if(key===LOCATION_STORAGE_KEY||key===LOCATION_UPDATED_AT_KEY)return semantic"])assert.ok(safety.includes(token),`StorageSafety-Ortrevision fehlt: ${token}`);
for(const token of ['portableSyncPromise','PORTABLE_VISIBILITY_MIN_INTERVAL_MS=15*1000','lastPortableVisibilitySyncAt','now-lastPortableVisibilitySyncAt>=PORTABLE_VISIBILITY_MIN_INTERVAL_MS'])assert.ok(sync.includes(token),`iOS-Resume-Syncschutz fehlt: ${token}`);
assert.ok(main.includes('startupPreload=beginStartupDashboardPreload()??startupPreload;'),'Nach Storage-Recovery wird weiterhin der vor Recovery gelesene Ort vorgeladen.');
assert.ok(main.indexOf('startupPreload=beginStartupDashboardPreload()??startupPreload;')>main.indexOf('await timeout(restorePersistentState(),4500)'),'Preload-Neuabgleich muss nach lokaler Recovery erfolgen.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'iOS-Resume-Standortregression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: iOS-Rückkehr schützt den zuletzt ausgewählten gerätelokalen Ort, drosselt doppelte Sync-Impulse und lädt nach Recovery den richtigen Ort vor.`);
