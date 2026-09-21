import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,sourceStyles,builtStyles,b2Styles,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('src/midC18B2CurrentAtmosphere.css'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-fourteen-day-pill-favorite-tap-097866.mjs';

for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const favoriteMarker='/* MID v0.9.78.66 · 14d-Kurzaussagen einzeilig + robuste Favoriten-Taps auf iOS */';
 const favoriteStart=styles.lastIndexOf(favoriteMarker);assert.ok(favoriteStart>=0,`${name}: v66-Favoriten-Override fehlt.`);const favoriteBlock=styles.slice(favoriteStart);
 for(const token of ['.header-favorites .favorite-bubbles>button .favorite-quick-grip{','position:static','transform:none','min-height:24px'])assert.ok(favoriteBlock.includes(token),`${name}: Favoritengriff bleibt als absolute Touch-Überlagerung aktiv: ${token}`);
 const layoutMarker='/* MID v0.9.78.79 · 14-Tage-Karten: größere Konfidenzpille ohne abgeschnittene Nachbarinhalte. */';
 const layoutStart=styles.lastIndexOf(layoutMarker);assert.ok(layoutStart>=0,`${name}: v79-Nichtabschneide-Override fehlt.`);const layoutBlock=styles.slice(layoutStart);
 for(const token of ['.cockpit-fourteen-regime,','.cockpit-fourteen-regime>span{','overflow:visible!important','text-overflow:clip!important','white-space:normal!important','overflow-wrap:anywhere!important'])assert.ok(layoutBlock.includes(token),`${name}: 14d-Kurzaussage bleibt nicht vollständig lesbar: ${token}`);
}

const quick=app.slice(app.indexOf('function FavoriteQuickStrip'),app.indexOf('function HeightInput'));
for(const token of ['quickTapStart','quickTapMove','quickTapEnd','quickTapCancel','onPointerUp={event=>quickTapEnd(event,item)}','Reihenfolge unter Favoriten verwalten ändern'])assert.ok(quick.includes(token),`Favoriten-Tap-Vertrag fehlt: ${token}`);
for(const token of ['pointerDrag','favorite-quick-grip','dragOverId','moveTo('])assert.ok(!quick.includes(token),`Favoriten-Schnellleiste darf keine Sortier-/Drag-Logik mehr enthalten: ${token}`);
assert.ok(b2Styles.includes('.favorite-quick-grip{display:none!important}'),'Finale B.2-Schicht muss historische Griffregeln sicher übersteuern.');

const versionParts=String(pkg.version).split('.').map(part=>Number.parseInt(part,10));
const versionAtLeast=(actual,minimum)=>minimum.every((part,index)=>{const value=actual[index]??0;if(value===part)return true;for(let i=0;i<index;i++){const prior=actual[i]??0;if(prior!==minimum[i])return prior>minimum[i]}return value>part});
assert.ok(versionAtLeast(versionParts,[0,9,78,66]),`Paketversion ${pkg.version} darf den v0.9.78.66-Vertrag nicht unterschreiten.`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.regressionTests?.includes(test),'Neue Regression fehlt im Baseline-Katalog.');
console.log(`${pkg.version}: 14d-Kurzaussage bleibt vollständig lesbar; Favoriten-Tap bleibt auf iOS robust; Reorder ist ausschließlich im Favoritenmanager erlaubt.`);
