import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [app,sync,state,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw);
assert.match(app,/function storedFavorites\(\):Favorite\[\][\s\S]{0,1400}applyFavoriteTombstones\(recovered,tombstones\)/,'Start-Recovery muss Tombstones anwenden.');
assert.match(app,/const setFavorites=useCallback<FavoriteSetter>[\s\S]{0,650}persistFavoriteSnapshot\(cleaned\);setFavoritesState\(cleaned\)/,'Favoritenmutation muss vor React-Statewechsel dauerhaft geschrieben werden.');
assert.doesNotMatch(app,/requestIdleCallback[\s\S]{0,500}persistFavoriteSnapshot/,'Favoritenpersistenz darf nicht auf Idle warten.');
assert.doesNotMatch(app,/writeFavoriteTombstones[\s\S]{0,500}slice\(0,/,'Tombstones dürfen nicht mengenbegrenzt abgeschnitten werden.');
assert.doesNotMatch(app,/writeFavoriteTombstones[\s\S]{0,500}365\s*\*\s*24/,'Tombstones dürfen nicht nach einem Jahr still verfallen.');
assert.match(sync,/function mergeRemoteFavoriteStateIntoLocal\(snapshot:SyncSnapshot\)/,'Pending-Sync braucht einen eigenen Favoriten-Merge.');
assert.match(sync,/localPending[\s\S]{0,500}mergeRemoteFavoriteStateIntoLocal\(snapshot\)[\s\S]{0,250}pushDeviceSync\(latestConfig\)/,'Ein lokaler Pending-Stand muss Remote-Favoriten/Tombstones vor dem Push mergen.');
assert.match(sync,/function syncPortableDeviceState\(\)[\s\S]{0,420}pullDeviceSync\(config,true\)[\s\S]{0,220}pushDeviceSync\(current\)/,'Lokale Änderungen müssen pull-merge-push statt blindem Push verwenden.');
assert.match(sync,/syncTimer=window\.setTimeout\(\(\)=>void syncPortableDeviceState\(\)/,'Bridge muss den konfliktfesten Sync-Pfad verwenden.');
assert.doesNotMatch(sync,/parseFavoriteTombstones[\s\S]{0,400}365\s*\*\s*24/,'Sync darf Tombstones nicht zeitlich verwerfen.');
for(const token of ['synchron und atomar','Start-Recovery Tombstones','Tombstones weder zeitlich'])assert.ok(state.includes(token),`State-Vertrag fehlt: ${token}`);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-favorite-authoritative-persistence-095330.mjs'),'Favoritenpersistenztest muss Required Regression sein.');
console.log('MID Favoriten: sofortige Persistenz, dauerhafte Tombstones und konfliktfester Sync geprüft.');
