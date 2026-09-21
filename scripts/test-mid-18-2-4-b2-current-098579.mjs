import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,css,main,pkgRaw,baselineRaw]=await Promise.all([
  read('src/App.tsx'),
  read('src/midC18B2CurrentAtmosphere.css'),
  read('src/main.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-4-b2-current-098579.mjs';

assert.ok(!app.includes('bottom-bar-display-settings'),'Obsoleter Bottom-Bar-Einstellungspunkt darf nicht mehr sichtbar sein.');
assert.ok(!app.includes('Dauerhaft verfügbar'),'Obsoleter Bottom-Bar-Einstellungstext darf nicht mehr vorhanden sein.');
assert.ok(!app.includes('setBottomBarBehavior'),'Bottom-Bar darf keinen veränderbaren Einstellsetter mehr besitzen.');
assert.ok(app.includes("type BottomBarBehavior='fixed'"),'Bottom-Bar bleibt als fester Laufzeitvertrag geschützt.');
assert.ok(app.includes("localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)"),'Alter Bottom-Bar-Einstellungsschlüssel muss bereinigt werden.');

const quickStart=app.indexOf('function FavoriteQuickStrip('),quickEnd=app.indexOf('\nfunction HeightInput(',quickStart);
assert.ok(quickStart>=0&&quickEnd>quickStart,'FavoriteQuickStrip muss vorhanden sein.');
const quick=app.slice(quickStart,quickEnd);
for(const forbidden of ['favorite-quick-grip','pointerDrag','dragOverId','moveTo(','setFavorites','am Griff ziehen']){
  assert.ok(!quick.includes(forbidden),`Favoriten-Schnellleiste darf keine Sortierlogik enthalten: ${forbidden}`);
}
assert.ok(quick.includes('Reihenfolge unter Favoriten verwalten ändern'),'Schnellleiste muss auf den Favoritenmanager als Sortierort verweisen.');
assert.ok(app.includes('Reihenfolge hier per Ziehen oder Pfeiltasten ändern. Die Schnellleiste dient nur zur Ortsauswahl.'),'Favoritenmanager muss die exklusive Sortierstelle erklären.');

for(const token of [
  '.header-favorites .favorite-bubbles>button',
  'grid-template-columns:auto minmax(0,max-content) auto',
  'min-height:34px',
  '.favorite-quick-grip{display:none',
  '.hero.current-compact .current-weather-overview',
  '"icon statement thread facts"',
  '.current-weather-facts>.humidity',
  'font-size:16px',
  '#current-weather-metrics:not([hidden])',
  'grid-template-columns:repeat(3,minmax(0,1fr))',
  '@media(max-width:700px)',
  '"icon statement"',
  '"facts facts"',
  '"thread thread"'
]) assert.ok(css.includes(token),`B.2/C Designvertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18B2CurrentAtmosphere.css';"),'B.2/C Designschicht muss im Produktionsentry geladen werden.');
assert.ok(/^0\.9\.85\.(?:79|[89]\d|\d{3,})$/.test(pkg.version),'Paketversion muss B.2/C v0.9.85.79 oder einen neueren 0.9.85-Wartungsstand verwenden.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline- und Paketversion müssen übereinstimmen.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
for(const path of [testPath,'src/midC18B2CurrentAtmosphere.css','MID_B2_CURRENT_0.9.85.79.md']){
  assert.ok((baseline.requiredFiles||[]).includes(path),`${path} fehlt in requiredFiles`);
}
console.log('MID v0.9.85.79: B.2 und Aktuelles-Wetter-Atmosphärenhierarchie geschützt.');
