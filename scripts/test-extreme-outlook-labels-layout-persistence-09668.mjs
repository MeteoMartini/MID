import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const[panel,overlay,styles,dashboard,settings,app,pkgRaw,baselineRaw,changelog,implementation,worker]=await Promise.all([
 read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/styles-src/25-extreme-outlook.css'),read('src/dashboardModules.ts'),read('src/DashboardModuleSettings.tsx'),read('src/App.tsx'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.8.md'),read('worker-src/25-dach-extreme-outlook.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-labels-layout-persistence-09668.mjs';
assert.ok(pkg.version.startsWith('0.9.66.')&&Number(pkg.version.split('.')[3])>=8);assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-labels-layout'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));
for(const file of[test,'MID_IMPLEMENTATION_0.9.66.8.md'])assert.ok(baseline.requiredFiles.includes(file));

for(const token of ['nolabels/{z}/{x}/{y}.png','only_labels/{z}/{x}/{y}.png','zIndex={20}','Länder-, Regions- und Städtenamen','startDate===endDate','${endDate}, ${endTime}','Nullgradgrenze'])assert.ok(panel.includes(token),`Outlook-Vertrag fehlt: ${token}`);
assert.ok(!panel.includes("['Gefrierhöhe'")&&!worker.includes('Gefrierhöhe'),'Veraltete Bezeichnung Gefrierhöhe ist im DACH-Ausblick noch aktiv.');
for(const token of ["type:'MultiPolygon'","type:'fill'","type:'line'",'fill-pattern','registerMapLayerOrder','8+index/100'])assert.ok(overlay.includes(token),`Nativer Kartenlayer fehlt: ${token}`);
assert.ok(!overlay.includes('CanvasOverlay'),'Gefahrenflächen dürfen nicht mehr als DOM-Canvas über sämtlichen Kartenbeschriftungen liegen.');
for(const token of ['.extreme-map .maplibregl-popup-content','background:#fff','font-size:11px','.extreme-validity b{font-size:13px','.extreme-period-tabs small{max-width:190px'])assert.ok(styles.includes(token),`Lesbarkeitsregel fehlt: ${token}`);

for(const token of ['DashboardModuleSettingsUpdater','onChange(current=>moveDashboardModule','onChange(current=>({...current'])assert.ok(settings.includes(token),`Funktionale Sektionsänderung fehlt: ${token}`);
for(const token of ['updateDashboardModuleSettings=useCallback','writeDashboardModuleSettings(typeof update', 'setDashboardModuleSettings={updateDashboardModuleSettings}'])assert.ok(app.includes(token),`Synchrone App-Persistenz fehlt: ${token}`);
const store=new Map(),localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)},window={dispatchEvent(){}},CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}},compiled=ts.transpileModule(dashboard,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,moduleUrl=`data:text/javascript;base64,${Buffer.from(`const localStorage=globalThis.__midLocalStorage;const window=globalThis.__midWindow;const CustomEvent=globalThis.__midCustomEvent;${compiled}`).toString('base64')}`;
globalThis.__midLocalStorage=localStorage;globalThis.__midWindow=window;globalThis.__midCustomEvent=CustomEvent;
const dashboardModule=await import(moduleUrl),defaults=dashboardModule.defaultDashboardModuleSettings(),moved=dashboardModule.moveDashboardModule(defaults,'forecast','current'),written=dashboardModule.writeDashboardModuleSettings(moved),restored=dashboardModule.readDashboardModuleSettings();
assert.equal(written.order[0],'forecast');assert.deepEqual(restored.order,written.order);assert.equal(JSON.parse(store.get(dashboardModule.DASHBOARD_MODULE_SETTINGS_KEY)).order[0],'forecast','Reihenfolge muss im selben Aufruf dauerhaft geschrieben sein.');
assert.ok(changelog.includes('## 0.9.66.8'));for(const token of ['Beschriftungs-Rasterlayer','Nullgradgrenze','synchron','neu gestartete App'])assert.ok(implementation.includes(token));
console.log('MID 0.9.66.8: Kartenbeschriftungen über nativen Gefahrenpolygonen, eindeutiges Enddatum, lesbare Textflächen und sofort persistierte Sektionsreihenfolge geprüft.');
