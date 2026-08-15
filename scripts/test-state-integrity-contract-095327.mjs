import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,sync,portable,eventCenter,uiContract,stateContract,source,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/portableUserData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_UI_ARCHITECTURE_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_SOURCE_OF_TRUTH.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Release und Baseline müssen synchron sein.');

// Ortsfavoriten: keine stillen Limits/Verdrängungen, stabile ID und Shadow-Recovery.
assert.match(app,/const FAVORITES_SHADOW_KEY='mid:favorites:shadow:v1'/,'Favoriten-Shadow fehlt.');
assert.match(app,/const FAVORITES_TOMBSTONES_KEY='mid:favorites:tombstones:v1'/,'Favoriten-Tombstones fehlen.');
assert.match(app,/function looksLikeEventFavoriteRecord\(/,'Event-/Ortsfavoriten-Domänentrennung fehlt.');
assert.match(app,/function normaliseFavoriteCollection\(values:any\[\]\):Favorite\[\]/,'Zentrale Favoritennormalisierung fehlt.');
assert.match(app,/return\[\.\.\.current,added\]/,'Neue Favoriten müssen verlustfrei angehängt werden.');
assert.doesNotMatch(app,/favorites\.length\s*>=\s*20/,'Favoriten dürfen nicht wegen eines 20er-Limits verdrängt werden.');
assert.doesNotMatch(app,/slice\(0,\s*19\)/,'Alter 20er-Verdrängungspfad ist noch vorhanden.');
assert.doesNotMatch(app,/result\.length\s*>=\s*20/,'Normalisierung darf Favoriten nicht bei 20 kappen.');
assert.match(app,/if\(primary\.rejectedEventRecords\)\{/,'Kontaminierter Ortsfavoritenstand muss bereinigt werden.');
assert.match(app,/persistFavoriteSnapshot\(cleaned\)/,'Bereinigter Favoritenstand muss dauerhaft wiederhergestellt werden.');
assert.match(app,/markFavoriteRemoved\(existing\)/,'Explizites Entfernen über Schnellfavorit muss Tombstone setzen.');
assert.match(app,/markFavoriteRemoved\(removed\)/,'Explizites Entfernen im Manager muss Tombstone setzen.');

// Geräteabgleich: Union statt Listenersatz; Eventfavoriten bleiben eigenständig.
assert.match(sync,/function mergeFavoriteSnapshots\(/,'Favoriten-Union im Geräteabgleich fehlt.');
assert.match(sync,/mergeFavoriteTombstones\(remoteTombstonesRaw,localTombstonesRaw\)/,'Tombstone-Merge fehlt.');
assert.match(sync,/for\(const rows of\[primary,secondary\]\)/,'Remote und lokale Favoriten müssen vereinigt werden.');
assert.match(sync,/function looksLikeEventFavoriteRecord\(value:unknown\)/,'Sync muss Eventdatensätze aus Ortsfavoriten zurückweisen.');
assert.match(sync,/function favoriteSnapshotInput\(/,'Sync muss vor dem App-Start einen sicheren Primär-/Shadow-Favoritenstand herstellen.');
assert.match(sync,/remoteFavorites=favoriteSnapshotInput\(values\[FAVORITES_KEY\],values\[FAVORITES_SHADOW_KEY\]\)/,'Remote-Shadow muss vor dem Snapshot-Merge berücksichtigt werden.');
assert.match(sync,/localFavorites=favoriteSnapshotInput\(localStorage\.getItem\(FAVORITES_KEY\),localStorage\.getItem\(FAVORITES_SHADOW_KEY\)\)/,'Lokaler Shadow muss vor dem Snapshot-Merge berücksichtigt werden.');
assert.match(sync,/function mergeEventCenterSnapshots\(/,'Event-Favoriten benötigen weiterhin einen eigenen Mergepfad.');
assert.match(sync,/values\[FAVORITES_SHADOW_KEY\]=mergedFavorites\.value/,'Gemergter Favoritenstand muss Shadow-Snapshot aktualisieren.');
assert.ok(!eventCenter.includes("mid:favorites"),'Event-Center darf den Ortsfavoritenspeicher nicht verwenden.');

// Hauptsektionen: ein Vertrag, default closed, kein Startup-Hash oder Geräte-Sync als Öffnungsursache.
assert.match(app,/const MODULE_OPEN_CONTRACT_KEY='mid:module-open-contract:v4'/,'Modulvertrag v4 fehlt.');
assert.match(app,/MODULES_DEFAULT_CLOSED=\['mountain','water','composite','ensemble','long-range','forecast-verification','travel-planner','event-planner','flight-meteorology','weather-maps','widget'\]/,'Hauptsektionen sind nicht einheitlich default-closed.');
assert.match(app,/if\(\/\^#mid-section-\[a-z-\]\+\$\/\.test\(location\.hash\)\)history\.replaceState/,'Dashboard-Hash muss vor der Vertragsprüfung bei jedem Bootstrap neutralisiert werden.');
for(const id of ['mountain','water','composite','ensemble','long-range','forecast-verification','travel-planner','event-planner','flight-meteorology','weather-maps','widget']){
 assert.match(app,new RegExp(`id="${id}"[\\s\\S]{0,220}defaultOpen=\\{false\\}`),`${id} folgt nicht dem gemeinsamen Default-closed-Vertrag.`);
}
assert.match(portable,/if\(\/\^mid:module:\[\^:\]\+:open\$\/\.test\(key\)\)return false/,'Hauptmodul-Offenzustände müssen gerätelokal bleiben.');

// Dauerhafte Dokumentation + Required Regression.
for(const token of ['Ortsfavoriten sind dauerhaftes Nutzereigentum','Ortsfavoriten und Event-Favoriten sind getrennte Domänen','Verlustfreier Geräteabgleich','Einheitlicher Hauptsektions-Vertrag','Langfrist-Sektion'])assert.ok(stateContract.includes(token),`State-Integritätsvertrag unvollständig: ${token}`);
assert.ok(uiContract.includes('MID_STATE_INTEGRITY_CONTRACT.md'),'UI-Vertrag referenziert den State-Integritätsvertrag nicht.');
assert.ok(source.includes('MID_STATE_INTEGRITY_CONTRACT.md'),'Source-of-Truth referenziert den State-Integritätsvertrag nicht.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-state-integrity-contract-095327.mjs'),'State-Integritätsprüfung ist nicht Required Regression.');

console.log(`MID v${pkg.version}: Favoritenintegrität, Event-Trennung, verlustfreier Sync und einheitlicher gerätelokaler Sektionsvertrag geprüft.`);
