import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,cockpit,modernStyles,styles,radarColors,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/ForecastCockpit.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

for(const token of [
 "const MODERN_FORECAST_HORIZON_STORAGE_KEY='mid:modernForecastHorizon:v1'",
 'function readModernForecastHorizon()',
 'useState<ModernForecastHorizon>(readModernForecastHorizon)',
 'localStorage.setItem(MODERN_FORECAST_HORIZON_STORAGE_KEY,modernForecastHorizon)',
 'forecastTarget:DashboardModuleId',
 "const forecastCandidateSource:DashboardModuleId[]=[forecastTarget,'short-term','forecast','ensemble','long-range'],forecastCandidates=forecastCandidateSource.filter",
 "workspaceMode={navigationMode==='bottom-tabs'}",
 "if(dashboardModuleSettings.enabled[module])return",
 "const fallback:ModernForecastHorizon=dashboardModuleSettings.enabled['short-term']?'90m':dashboardModuleSettings.enabled.forecast?'7d':dashboardModuleSettings.enabled.ensemble?'14d':'46d'",
 "navigationMode==='bottom-tabs'&&MODERN_FORECAST_MODULES.includes(id)?' modern-forecast-section':''",
 "forecastTarget={modernForecastHorizon==='7d'?'forecast':modernForecastHorizon==='14d'?'ensemble':modernForecastHorizon==='46d'||modernForecastHorizon==='season'?'long-range':'short-term'}"
])assert.ok(app.includes(token),`Prognose-Arbeitsraum-Vertrag fehlt: ${token}`);

for(const token of [
 'workspaceMode?:boolean',
 'workspaceMode=false',
 "className={`forecast-cockpit mode-${mode}${workspaceMode?' modern-workspace':''}`}",
 "data-workspace-mode={workspaceMode?'true':'false'}",
 "aria-label={workspaceMode?'Prognose-Arbeitsansicht':undefined}",
 '{!workspaceMode&&<><header className="cockpit-header">'
])assert.ok(cockpit.includes(token),`Cockpit-Arbeitsraum-Vertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.4 · optionales Bedienkonzept: zusammenhängende Prognose-Arbeitsansicht */',
 '.navigation-bottom-tabs .modern-forecast-section{',
 '.navigation-bottom-tabs .forecast-cockpit.modern-workspace{',
 '[data-dashboard-section="short-term"]>.short-term-forecast>.short-term-header',
 '[data-dashboard-section="forecast"]>[data-mid-view="forecast"]>.title',
 '[data-dashboard-section="ensemble"]>.module-shell.open>.module-shell-toggle',
 'min-height:44px',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Prognose-Arbeitsraum-CSS fehlt: ${token}`);
assert.ok(styles.includes('/* MID v0.9.79.4 · optionales Bedienkonzept: zusammenhängende Prognose-Arbeitsansicht */'),'Styles-Aggregat enthält Schritt 5 nicht');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('modern-workspace'),'Prognose-Arbeitsraum darf Radarfarbtabellen nicht berühren');
assert.ok(contract.includes('Schritt 5'),'Bedienvertrag dokumentiert Schritt 5 nicht');
assert.ok(contract.includes('mid:modernForecastHorizon:v1'),'Persistenz des gewählten Prognosehorizonts fehlt im Vertrag');
assert.ok(contract.includes('interne Cockpit-Horizontleiste'),'Doppel-Navigationsschutz fehlt im Vertrag');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-forecast-workspace-09794.mjs'),'Baseline-Regression für Schritt 5 fehlt');
console.log('Optionales Bedienkonzept Schritt 5: Prognose-Arbeitsraum, Horizont-Persistenz, Cockpit-Dedup, klassischer Fallback, iOS-Touchziele und Radar-Isolation geprüft.');
