import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [app,sync,state,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-favorite-order-persistence-09584.mjs';
for(const [source,token,label] of [
 [app,"const FAVORITES_ORDER_KEY='mid:favorites:order:v1'",'App kennt eigene Favoritenreihenfolge'],
 [app,'function persistFavoriteOrder(values:Favorite[])','Reihenfolge wird unmittelbar persistiert'],
 [app,'persistFavoriteOrder(values);','jede Favoritenmutation synchronisiert die Reihenfolge'],
 [app,'applyFavoriteOrder(applyFavoriteTombstones(recovered,tombstones))','Start-Recovery stellt gespeicherte Reihenfolge her'],
 [sync,"const FAVORITES_ORDER_KEY='mid:favorites:order:v1'",'Gerätesync kennt Reihenfolge'],
 [sync,'function ensureLocalFavoriteOrderSnapshot()','Bestandsmigration erfolgt vor Remote-Pull'],
 [sync,'function mergeFavoriteOrderSnapshots(','Reihenfolge besitzt konfliktfesten Merge'],
 [sync,'remoteAt>localAt','nur strikt neuere Remote-Reihenfolge darf lokal überschreiben'],
 [sync,'values[FAVORITES_ORDER_KEY]=mergedFavorites.order','gemergte Reihenfolge wird in Snapshot übernommen'],
 [sync,'localStorage.setItem(FAVORITES_ORDER_KEY,merged.order)','Pending-Merge schreibt Reihenfolge lokal zurück'],
 [sync,'export async function restoreDeviceSyncState(){ensureLocalFavoriteOrderSnapshot();','Startabgleich schützt lokale Bestandsreihenfolge vor dem Pull']
]) assert.ok(source.includes(token),label);
assert.ok(state.includes('Reihenfolge'), 'State-Integritätsvertrag muss die Favoritenreihenfolge ausdrücklich schützen.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Favoritenreihenfolge muss Required Regression sein.');
assert.ok(baseline.regressionTests.includes(test),'Favoritenreihenfolge muss im Gesamtlauf enthalten sein.');
assert.equal(pkg.scripts?.['test:favorite-order-persistence'],`node ${test}`,'Package-Script für Favoritenreihenfolge fehlt.');
console.log('Favoritenreihenfolge geprüft: synchron persistiert, vor Start-Pull migriert, separat revidiert und geräteübergreifend konfliktfest gemergt.');
