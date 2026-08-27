import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const[panel,overlay,modelledAreas,geojsonSource,canvasSource,outlook,dashboard,storageSafety,deviceSync,worker,pkgRaw,baselineRaw,changelog,implementation]=await Promise.all([
 read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/extremeOutlookModelledAreas.ts'),read('src/extremeOutlookAreaGeoJson.ts'),read('src/extremeOutlookAreaCanvas.ts'),read('src/extremeWeatherOutlook.ts'),read('src/dashboardModules.ts'),read('src/storageSafety.ts'),read('src/deviceSync.ts'),read('worker-src/25-dach-extreme-outlook.js'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.9.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-dwd-scale-dashboard-persistence-09669.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.66.9'));assert.equal(baseline.releaseVersion,pkg.version);assert.equal(pkg.scripts?.['test:extreme-outlook-dwd-scale-persistence'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));for(const file of[test,'MID_IMPLEMENTATION_0.9.66.9.md'])assert.ok(baseline.requiredFiles.includes(file));

for(const token of ['tile.openstreetmap.org/{z}/{x}/{y}.png','id="extreme-outlook-context"','opacity={.28}','zIndex={18}','MID-Prognosestufe','Schraffiert sind ausschließlich Teilflächen'])assert.ok(panel.includes(token),`Kartendarstellung fehlt: ${token}`);
assert.ok(!panel.includes('basemaps.cartocdn.com'),'Die DACH-Karte darf keine anonym gesperrte CARTO-Basis mehr verwenden.');
for(const token of ["1:'#f4d03f'","2:'#f08a24'","3:'#d9363e'","4:'#8f174f'",'Wettergefahr','markante Wettergefahr','Unwetterpotenzial','extremes Unwetterpotenzial'])assert.ok(outlook.includes(token),`DWD-nahe Prognoseskala fehlt: ${token}`);
assert.ok(!outlook.includes("1:'#269b83'"),'Grün darf keine Gefahrstufe mehr kennzeichnen.');
for(const token of ['CanvasOverlay','drawExtremeOutlookContours','buildExtremeOutlookContourSet'])assert.ok(overlay.includes(token),`Teilflächenschraffur-/Rendervertrag fehlt: ${token}`);
assert.ok(modelledAreas.includes('maximumProbability:60'),'Teilflächenschraffur muss aus demselben Konturdatensatz entstehen.');
for(const token of ['pointInRing','normalizeOrientation','contourPolygons',"type:'MultiPolygon'"])assert.ok(geojsonSource.includes(token),`Verschachtelte Teilflächenschraffur fehlt: ${token}`);
assert.ok(canvasSource.includes('maximumProbability?:number')&&canvasSource.includes('probability>=threshold&&probability<maximumProbability'));
for(const token of ['updatedAt?:string','const migrated=','writeDashboardModuleSettings(normalized)','previous+1'])assert.ok(dashboard.includes(token),`Dashboard-Revisionierung fehlt: ${token}`);
for(const token of ['localRevision','mirrorRevision','localRevision>mirrorRevision'])assert.ok(storageSafety.includes(token),`Spiegelkonfliktschutz fehlt: ${token}`);
for(const token of ['mergeDashboardModuleSettings','preserveLocalDashboard','Neuere lokale Sektionsreihenfolge wurde geschützt'])assert.ok(deviceSync.includes(token),`Geräteabgleich schützt die Sektionsreihenfolge nicht: ${token}`);
assert.ok(worker.includes('markante Wettergefahr')&&worker.includes('extremes Unwetterpotenzial'));

const compiledCanvas=ts.transpileModule(canvasSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,canvas=await import(`data:text/javascript;base64,${Buffer.from(compiledCanvas).toString('base64')}`),grid={rows:3,cols:3,latStep:.8,lonStep:.75,bounds:{north:50.8,south:49.2,west:8,east:9.5}},values=[[45,45,45],[45,70,45],[45,45,45]],areas=values.flatMap((row,rowIndex)=>row.map((probability,colIndex)=>({row:rowIndex,col:colIndex,lat:50.8-rowIndex*.8,lon:8+colIndex*.75,probabilityLevels:[probability,0,0,0]}))),base=canvas.buildExtremeOutlookContours(areas,grid,{minimumProbability:40}),hatched=canvas.buildExtremeOutlookContours(areas,grid,{minimumProbability:40,maximumProbability:60});
assert.ok(base.some(item=>item.probability>=70),'Glatter Kern ab 60 % fehlt.');assert.ok(hatched.length&&hatched.every(item=>item.probability<60),'Schraffur muss ausschließlich den interpolierten Bereich unter 60 % abbilden.');assert.ok(hatched.some(item=>item.rings.length>=2),'Der glatte Kern muss als Loch aus der Schraffurgeometrie ausgespart bleiben.');

const store=new Map([["mid:dashboard-modules:v1",JSON.stringify({order:['forecast','current'],enabled:{forecast:true,current:true}})]]),localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)},window={dispatchEvent(){}},CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}},compiledDashboard=ts.transpileModule(dashboard,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,moduleUrl=`data:text/javascript;base64,${Buffer.from(`const localStorage=globalThis.__midLocalStorage969;const window=globalThis.__midWindow969;const CustomEvent=globalThis.__midCustomEvent969;${compiledDashboard}`).toString('base64')}`;
globalThis.__midLocalStorage969=localStorage;globalThis.__midWindow969=window;globalThis.__midCustomEvent969=CustomEvent;
const modules=await import(moduleUrl),migrated=modules.readDashboardModuleSettings();assert.ok(migrated.updatedAt&&migrated.order.includes('extreme-outlook'),'Neue Sektionen müssen einmalig in den gespeicherten Altstand migriert werden.');
const moved=modules.moveDashboardModule(migrated,'extreme-outlook','forecast'),written=modules.writeDashboardModuleSettings(moved),restored=modules.readDashboardModuleSettings();assert.equal(restored.order[0],'extreme-outlook');assert.deepEqual(restored.order,written.order);assert.equal(JSON.parse(store.get(modules.DASHBOARD_MODULE_SETTINGS_KEY)).order[0],'extreme-outlook');

assert.ok(changelog.includes('## 0.9.66.9'));for(const token of ['CARTO Voyager','Spitzenwert','IndexedDB-Spiegel','älterer Remote-Snapshot'])assert.ok(implementation.includes(token));
console.log('MID 0.9.66.9: kontrastreiche DACH-Karte, DWD-nahe Gefahrsskala, teilflächenrichtige Schraffur und konfliktfeste Sektionsreihenfolge geprüft.');
