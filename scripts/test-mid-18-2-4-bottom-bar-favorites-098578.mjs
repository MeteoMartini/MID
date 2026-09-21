import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,modern,styles,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/styles-src/30-modern.css'),
 read('src/styles.css'),
 read('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-mid-18-2-4-bottom-bar-favorites-098578.mjs';

for(const token of [
 'data-scroll-hidden="false"',
 'data-fixed="true"',
 "{id:'current',label:'Aktuell'",
 "label:'Heute'",
 "label:'Vorhersage'",
 "label:'Karten'",
 '<span>Mehr</span>',
 "localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)",
 "navigateToDashboardSection(id,true,navigationMode==='bottom-tabs'?'auto':'smooth')",
 'function FavoriteQuickStrip',
 'favorite-bubbles',
 'favorite-strip-manage'
])assert.ok(app.includes(token),`Arbeitspaket-B-Appvertrag fehlt: ${token}`);

for(const forbidden of [
 'bottomBarHidden',
 'downDistance>=96',
 'upDistance>=12',
 "setBottomBarBehavior('auto')"
])assert.ok(!app.includes(forbidden),`Scrollabhängige Bottom-Bar-Logik bleibt erreichbar: ${forbidden}`);

const marker='/* MID v0.9.85.78 · MID 18.2.4 Arbeitspaket B: Bottom-Bar + Favoriten.';
assert.ok(modern.includes(marker),'Arbeitspaket-B-CSS fehlt.');
for(const token of [
 '--mid18-mobile-nav-reserve:calc(84px + var(--mid-safe-bottom))',
 '.app.navigation-bottom-tabs>.mid-page-grid{padding-bottom:0!important}',
 'transform:none!important',
 'opacity:1!important',
 '.settings-header>.header-favorites .favorite-bubbles{',
 'overflow-x:auto!important',
 'flex-wrap:nowrap!important',
 'white-space:nowrap!important',
 'text-overflow:ellipsis',
 '.favorite-bubbles>button.active{',
 'box-shadow:inset 3px 0 0',
 '.favorite-strip-manage{'
])assert.ok(modern.includes(token),`Arbeitspaket-B-CSS-Vertrag fehlt: ${token}`);

assert.ok(styles.endsWith(modern),'styles.css muss mit dem kanonischen Modern-Modul synchron sein.');
assert.ok(contract.includes('verbindlich **fixiert**'),'Navigationsvertrag muss die dauerhaft sichtbare Bottom-Bar festhalten.');
assert.ok(contract.includes('horizontal'),'Favoritenvertrag muss den internen horizontalen Scroll beschreiben.');
assert.equal(pkg.version,'0.9.85.78');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests'])assert.ok((baseline[key]||[]).includes(self),`${self} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(self),`${self} fehlt in requiredFiles`);
assert.ok((baseline.requiredFiles||[]).includes('MID_BOTTOM_BAR_FAVORITES_0.9.85.78.md'),'Arbeitspaket-B-Dokumentation fehlt in requiredFiles');

console.log('MID v0.9.85.78: Bottom-Bar bleibt dauerhaft sichtbar; Favoriten bleiben kompakt, einzeilig und intern horizontal scrollbar.');
