import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [safety,center,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/storageSafety.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,'0.9.53.12');
assert.equal(baseline.releaseVersion,'0.9.53.12');
assert.match(safety,/export function readDurableStorageValue\(key:string\)/);
assert.match(safety,/isDurableStorageKey\(key\)&&fallback\.has\(key\)\?fallback\.get\(key\)\?\?null:native\?\.get\(key\)/);
assert.match(safety,/export function writeDurableStorageValue\(key:string,value:string\)/);
assert.match(safety,/fallback\.set\(key,record\.value\);if\(local!==record\.value\|\|record\.nativeCommitted===false\)/);
assert.match(safety,/fallback\.set\(key,text\);queueRecord\(key,\{value:text,updatedAt:Date\.now\(\),nativeCommitted:committed\}\)/);
assert.match(center,/readDurableStorageValue\(EVENT_CENTER_STORAGE_KEY\)/);
assert.match(center,/writeDurableStorageValue\(EVENT_CENTER_STORAGE_KEY,JSON\.stringify\(sorted\)\)/);
assert.match(center,/readDurableStorageValue\(EVENT_CENTER_REFRESH_REQUEST_KEY\)/);
assert.match(center,/writeDurableStorageValue\(EVENT_CENTER_REFRESH_DONE_KEY,String\(requestedAt\)\)/);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-durable-storage-fallback-095312.mjs'));
console.log('MID v0.9.53.12: Event-Persistenz nutzt den quota-sicheren Durable-Store; ein alter nativer localStorage-Wert kann einen frisch gespiegelten Eventstand nicht mehr verdecken.');
