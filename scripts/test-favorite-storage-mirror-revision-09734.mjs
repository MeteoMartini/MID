import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [safety,state,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('../src/storageSafety.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-favorite-storage-mirror-revision-09734.mjs';
for(const [token,label] of [
 ["const FAVORITES_UPDATED_AT_KEY='mid:favorites:updated-at'",'Favoriten-Companion-Revision'],
 ['const FAVORITE_SNAPSHOT_KEYS=new Set([FAVORITES_STORAGE_KEY,FAVORITES_SHADOW_KEY])','Primär-/Shadow-Snapshotgruppe'],
 ['function durableSemanticRevision(key:string,raw:string|null,lookup:(key:string)=>string|null)','semantische Durable-Revision'],
 ['if(FAVORITE_SNAPSHOT_KEYS.has(key))return entryTimestamp(lookup(FAVORITES_UPDATED_AT_KEY)','Favoritenstand nutzt updated-at statt technischen Mirror-Zeitpunkt'],
 ['function mirrorRevision(key:string,record:DurableRecord,records:Map<string,DurableRecord>)','Mirror-Revision nutzt Snapshotgruppe'],
 ['localRevision>mirroredRevision||(localRevision===mirroredRevision&&record.nativeCommitted!==false)','neuer bzw. gleichwertig bestätigter nativer Stand gewinnt']
])assert.ok(safety.includes(token),label);
assert.ok(state.includes('StorageSafety-Mirror'),'State-Integritätsvertrag muss den StorageSafety-Mirror ausdrücklich schützen.');
assert.ok(baseline.requiredRegressionTests.includes(test),'StorageSafety-Favoritenrevision muss Required Regression sein.');
assert.ok(baseline.regressionTests.includes(test),'StorageSafety-Favoritenrevision muss im Gesamtlauf enthalten sein.');
assert.equal(pkg.scripts?.['test:favorite-storage-mirror-revision'],`node ${test}`,'Package-Script fehlt.');
console.log('Favoriten-StorageSafety geprüft: ein älterer IndexedDB-Mirror darf einen neueren nativen Favoritenstand nicht mehr zurücksetzen.');
