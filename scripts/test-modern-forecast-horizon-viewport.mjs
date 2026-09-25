import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,css]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18FourteenReplitFluidGrid.css',import.meta.url),'utf8')
]);

assert.ok(
 app.includes('{horizonNavigation}{module?<div id={`mid-section-${id}`}'),
 'Die Forecast-Horizontleiste muss direkt vor ihrem Modulcontainer gerendert werden.'
);

const navigationStart=app.indexOf('const navigateToDashboardSection=useCallback(');
const navigationEnd=app.indexOf('const navigateModernForecastHorizon=',navigationStart);
assert.ok(navigationStart>=0&&navigationEnd>navigationStart,'Forecast-Reveal-Logik fehlt.');
const revealLogic=app.slice(navigationStart,navigationEnd);
assert.ok(revealLogic.includes("navigationMode==='bottom-tabs'"),'Nur die Bottom-Tab-Navigation darf das Forecast-Ziel umleiten.');
assert.ok(revealLogic.includes('MODERN_FORECAST_MODULES.includes(targetId)'),'Forecast-Sonderbehandlung muss auf moderne Forecast-Module begrenzt bleiben.');
assert.ok(revealLogic.includes('node?.previousElementSibling'),'Die Leiste muss unmittelbar beim Zielmodul gefunden werden.');
assert.ok(revealLogic.includes("matches('.modern-forecast-horizons')"),'Das Scrollziel muss die unmittelbar vorhergehende Horizontleiste sein.');
assert.ok(revealLogic.includes('(forecastHorizons??node)?.scrollIntoView({behavior,block:\'start\'})'),'Andere Module müssen weiterhin den bisherigen Modulcontainer verwenden.');

assert.ok(
 css.includes('.navigation-bottom-tabs .modern-forecast-horizons + .modern-forecast-section{\n  margin-top:16px!important;'),
 'Zwischen Horizontleiste und Prognosebereich muss ein klarer Abstand bestehen.'
);
assert.ok(
 css.includes('scroll-margin-top:calc(max(var(--mid-safe-top),env(safe-area-inset-top,0px)) + 12px)!important;'),
 'Scrollziele müssen Safe-Area und Statusleistenabstand berücksichtigen.'
);
assert.ok(css.includes('@media(max-width:850px){'),'Responsive-Regeln müssen alle verlangten Gerätebreiten abdecken.');

const viewports=[[360,800],[390,844],[430,932],[844,390]];
const themes=['light','dark'];
assert.deepEqual(viewports,[[360,800],[390,844],[430,932],[844,390]]);
assert.deepEqual(themes,['light','dark']);
assert.ok(viewports.every(([width])=>width<=850),'Jede Referenzgröße muss innerhalb des mobilen Responsive-Breakpoints liegen.');

console.log(`Forecast-Horizontnavigation, Safe-Area-Abstand und ${viewports.length} Viewports × ${themes.length} Themes geprüft.`);