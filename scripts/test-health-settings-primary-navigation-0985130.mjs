import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,settingsCss,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18WorkPackageI.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-health-settings-primary-navigation-0985130.mjs';
assert.equal(pkg.version,'0.9.85.130');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),self+' fehlt in '+key);

// Gesundheitswetter muss im Navigation-Split sichtbar und Pollen lokal schaltbar bleiben.
for(const token of [
 'settings-option-list settings-health-weather',
 '<span>Gesundheitswetter</span>',
 'pollen-forecast-setting',
 'checked={pollenDisplaySettings.showPollenForecast}',
 'setPollenDisplaySettings(current=>({...current,showPollenForecast:event.target.checked}))',
 "localStorage.setItem(POLLEN_DISPLAY_SETTINGS_KEY,JSON.stringify(pollenDisplaySettings))"
])assert.ok(app.includes(token),'Gesundheitswetter-/Pollenvertrag fehlt: '+token);
assert.ok(settingsCss.includes('.settings-split-navigation>.settings-primary-options,.settings-split-navigation>.dashboard-module-settings{display:block!important}'),'Navigation muss Gesundheits-/Inhaltsoptionen und Modulreihenfolge gemeinsam zeigen.');
assert.ok(settingsCss.includes('.settings-option-list:not(.settings-content-modules):not(.settings-health-weather)'),'Nur generische Optionliste darf im Navigation-Split verborgen werden.');
assert.ok(!settingsCss.includes('.settings-split-navigation>.settings-section,.settings-split-navigation>.time-display-settings'),'Navigation darf nicht mehr sämtliche Settings-Sections pauschal ausblenden.');

// Primärnavigation: explizit und unabhängig vom Untermodul persistieren.
for(const token of [
 "type PrimaryNavigationArea='current'|'today'|'forecast'|'composite'|'more'",
 "const LAST_PRIMARY_NAVIGATION_AREA_KEY='mid:last-primary-navigation-area:v1'",
 'function primaryNavigationAreaForSection(id:DashboardModuleId):PrimaryNavigationArea',
 "if(id==='short-term')return'today'",
 "if(id==='forecast'||id==='ensemble'||id==='long-range')return'forecast'",
 "if(id==='composite'||id==='weather-maps')return'composite'",
 "persistLastPrimaryNavigationArea(primaryNavigationAreaForSection(id))",
 "persistLastPrimaryNavigationArea('more')",
 "readLastPrimaryNavigationArea()==='more'"
])assert.ok(app.includes(token),'Persistenz der Primärnavigation fehlt: '+token);
assert.ok(app.includes("!/^#mid-section-[a-z-]+$/.test(location.hash)&&readLastPrimaryNavigationArea()==='more'"),'Mehr darf nur ohne expliziten Section-Deep-Link automatisch wieder öffnen.');
assert.ok(!app.includes("if(/^#mid-section-[a-z-]+$/.test(location.hash))history.replaceState(null,'',`${location.pathname}${location.search}`)"),'Explizite #mid-section-Deep-Links dürfen beim Start nicht mehr gelöscht werden.');
assert.ok(app.includes("hashId&&DASHBOARD_MODULE_DEFINITIONS.some(item=>item.id===hashId)?hashId:stored==='place'?undefined:stored"),'Expliziter Section-Deep-Link muss vor dem gespeicherten Bereich Vorrang behalten.');
assert.ok(app.includes("closeDrawer=()=>{if(activeId&&activeId!=='place')persistLastPrimaryNavigationArea(primaryNavigationAreaForSection(activeId as DashboardModuleId));else persistLastPrimaryNavigationArea('current');onDrawerOpen(false)}"),'Manuelles Schließen von Mehr muss zum darunter aktiven Bereich zurückpersistieren.');

console.log('MID v0.9.85.130: Gesundheitswetter-Sichtbarkeit, Pollen-Schalter und Primärnavigation inkl. Mehr geschützt.');
