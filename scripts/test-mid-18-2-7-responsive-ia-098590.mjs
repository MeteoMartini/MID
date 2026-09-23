import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [app,cockpit,radar,css,main,workerSource,workerRouter,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('src/RadarPanel.tsx'),
 read('src/midC18I7ResponsiveFixes.css'),
 read('src/main.tsx'),
 read('worker-src/30-push-events.js'),
 read('worker-src/40-aviation-router.js'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const thisTest='scripts/test-mid-18-2-7-responsive-ia-098590.mjs';

assert.ok(app.includes("case'climate':return <CloudSun size={size}/>"),'Klima braucht ein konsistentes Symbol in der Navigationszuordnung.');
assert.ok(app.includes('className="place-profile-shortcuts"'),'Favoritenabhängige Berg-/Wasser-Schnellzugänge fehlen.');
assert.ok(app.includes("currentFavorite.mountain.enabled&&<button")&&app.includes("navigateToDashboardSection('mountain')"),'Bergwetter-Schnellzugang ist nicht an das aktive Favoritenprofil gebunden.');
assert.ok(app.includes("currentFavorite.water.enabled&&<button")&&app.includes("navigateToDashboardSection('water')"),'Wasserwetter-Schnellzugang ist nicht an das aktive Favoritenprofil gebunden.');
assert.ok(!app.includes('forecast-presentation-settings')&&!app.includes('forecastPresentationMode')&&!app.includes("presentationMode?:ForecastPresentationMode"),'Wirkungslose Prognose-Einstiegsoptionen dürfen nicht zurückkehren.');
assert.ok(app.includes('mode="cockpit-tabs"'),'Obligatorischer Forecast-Workspace braucht einen eindeutigen internen Darstellungsvertrag.');
assert.ok(app.includes('settings-split-')&&app.includes('settings-primary-options'),'Die vier Einstellungsbereiche müssen auf getrennte Inhalte abbilden.');
assert.ok(app.includes('brand-logo-option logo-auto')&&app.includes('preview-light')&&app.includes('preview-dark'),'Logo-Auswahl muss Auto/Light/Dark visuell unterscheidbar verdrahten.');

assert.ok(cockpit.includes('className="cockpit-fourteen-grid" data-cockpit-horizontal-scroll="true"'),'14-Tage-Übersicht muss ihren horizontalen Mobilscroll explizit anmelden.');
for(const token of [
 'grid-auto-columns:clamp(236px,78vw,300px)!important',
 'word-break:normal!important',
 '.settings-split-weather>.settings-primary-options>.layout-mode-settings-grid',
 '.settings-split-navigation>.settings-primary-options',
 '.settings-nav button',
 '.brand-logo-preview.preview-light',
 '.brand-logo-preview.preview-dark',
 '.place-profile-shortcuts',
 '.dwd-surface-analysis-card',
 '@media(max-width:390px)'
])assert.ok(css.includes(token),'MID-18.2.7-Responsivevertrag fehlt: '+token);

assert.ok(radar.includes('className="dwd-surface-analysis-card"'),'DWD-Bodenanalyse ist im Synoptik-Workspace nicht sichtbar erreichbar.');
assert.ok(radar.includes('Synoptik · DWD-Bodenanalyse'),'Eindeutige Benennung des amtlichen DWD-Zugangs fehlt.');
assert.ok(radar.includes('synopticWorker.officialAnalysis.imageUrl')&&radar.includes('Deutscher Wetterdienst · amtliche Bodenanalyse'),'DWD-Originalbild und Quellenkennzeichnung fehlen.');
assert.ok(workerSource.includes('async function discoverDwdSurfaceAnalysis()')&&workerSource.includes('Amtliche DWD-Bodenanalyse'),'Amtliche DWD-Bodenanalyse fehlt im Worker-Quellvertrag.');
assert.ok(workerRouter.includes("mode==='dwd-surface-analysis-image'"),'Proxyroute für das amtliche DWD-Originalbild fehlt.');

assert.ok(main.includes("import './midC18I7ResponsiveFixes.css';"),'Finaler MID-18.2.7-CSS-Layer wird nicht geladen.');
assert.ok(main.indexOf('midC18I7ResponsiveFixes.css')>main.indexOf('midC18WorkPackageI.css'),'MID-18.2.7-Korrekturen müssen nach Arbeitspaket I geladen werden.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes(thisTest),thisTest+' fehlt in '+key);
assert.ok((baseline.requiredFiles||[]).includes(thisTest),thisTest+' fehlt in requiredFiles');

console.log('MID v'+pkg.version+': Klima-Icon, 14-Tage-Mobile-Scroll, DWD-Bodenanalyse, Favoritenprofile, Settings-Split, Logo-Vorschau und bereinigter Forecast-Einstieg geschützt.');
