import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [center,favoriteState,panel,sync,styles,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventFavoriteState.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.53.13'),`Unerwartete Version ${pkg.version}; erwartet wird mindestens 0.9.53.13.`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.match(center,/favoriteUpdatedAt\?:number/,'Event-Favoriten benötigen eine eigene Revisionszeit.');
assert.match(center,/toggleEventCenterFavorite\(id:string\).*favoriteUpdatedAt:at/s,'Das Umschalten eines Event-Favoriten muss nur den Event-Datensatz mit eigener Revision aktualisieren.');
assert.match(center,/mergeEventFavoritePreference\(existing,record\)/,'Plan- und Favoritenfrische müssen unabhängig zusammengeführt werden.');
assert.match(favoriteState,/export function eventFavoriteRevision\(value:unknown\)/,'Event-Favoritenrevision muss in einem kleinen, wetterunabhängigen Persistenzmodul liegen.');
assert.match(favoriteState,/export function mergeEventFavoritePreference/,'Event-Favoriten benötigen eine eigene Merge-Funktion.');
assert.match(sync,/eventFavoriteRevision\(localItem\)/,'Geräte-Sync muss die Event-Favoritenrevision getrennt auswerten.');
assert.match(sync,/isFavorite:Boolean\(localItem\.isFavorite\),favoriteUpdatedAt:localFavoriteRevision/,'Ein neuerer lokaler Event-Favoritenstatus darf durch einen Wetter-/Remote-Snapshot nicht verloren gehen.');
assert.doesNotMatch(center,/mid:favorites/,'Event-Favoriten dürfen den normalen Ortsfavoriten-Store nicht anfassen.');
assert.match(panel,/Event-Favoriten sind vollständig unabhängig von den normalen Ortsfavoriten/,'Die UI erklärt die unabhängigen Favoritenarten.');
assert.match(panel,/debounceMs=\/\^\\d\{2,8\}\$\/\.test\(value\)\?45:80/,'Event-Ortssuche verwendet denselben kurzen PLZ-/Text-Debounce wie die appweite Suche.');
assert.match(panel,/searchController\.current\?\.abort\(\)/,'Veraltete Event-Ortssuchen müssen abgebrochen werden.');
assert.match(panel,/type="search" inputMode="search" enterKeyHint="search"/,'Event-Ortssuche verwendet mobile Suchfeldsemantik.');
assert.match(panel,/placeholder="Ort, PLZ, ICAO oder POI"/,'Event-Ortssuche deckt die appweiten Sucharten ab.');
assert.match(styles,/event-location-search-panel \.travel-search-results button\{[^}]*min-height:var\(--mid-ui-touch,40px\);touch-action:manipulation/,'Event-Suchergebnisse müssen appweite Touchgrößen verwenden.');
assert.match(styles,/@media\(max-width:520px\)[\s\S]*event-location-search-panel \.travel-search-results\{grid-template-columns:1fr/,'Mobile Event-Suchergebnisse müssen einspaltig und touchfreundlich sein.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-favorite-search-independence-095313.mjs'));
console.log('MID v0.9.53.13: Event-Favoriten bleiben von Ortsfavoriten unabhängig; Sync und responsive Live-Ortssuche sind geschützt.');
