import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,main,app,meteogram,water,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18SecondaryWorkspaceFinish.css'),
 read('src/main.tsx'),
 read('src/App.tsx'),
 read('src/MeteogramPanel.tsx'),
 read('src/WaterSportsPanel.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-secondary-workspace-finish-098567.mjs';

for(const token of [
 '.meteogram-scroll',
 '.warnings-responsive-shell',
 '.warning-event-track',
 '.water-matrix-scroll',
 '.water-tides',
 '.modern-more-drawer',
 '.modern-more-quick-actions',
 '.dashboard-section-nav-list.progressive',
 '@media(max-width:430px)',
 '@media(max-width:390px)',
 'overflow-x:auto!important',
 'white-space:normal!important'
]) assert.ok(css.includes(token),`Secondary-workspace contract fehlt: ${token}`);

assert.ok(main.includes("import './midC18SecondaryWorkspaceFinish.css';"),'Secondary-workspace CSS wird nicht geladen.');
assert.ok(main.indexOf('midC18SecondaryWorkspaceFinish.css')>main.indexOf('midC18ForecastMapShellPolish.css'),'Secondary-workspace finish muss die späteste MID-18.2-Schicht sein.');
assert.ok(app.includes('modern-more-drawer')&&app.includes('modern-more-quick-actions')&&app.includes("modernDrawer?' progressive':''")&&app.includes('<section key={group.id} className="modern-more-group">'),'Mehr muss die I.1-I.5-Themenstruktur behalten.');
assert.ok(app.includes('warnings-responsive-shell')&&app.includes('warning-event-tab'),'Warnungen müssen die hybride Status-/Ereignisstruktur behalten.');
assert.ok(meteogram.includes('meteogram-scroll')&&meteogram.includes('meteogram-source-disclosure'),'Meteogramm muss innere Scroll- und Quellenflächen behalten.');
assert.ok(water.includes('water-matrix-scroll')&&water.includes('water-tides')&&water.includes('water-source'),'Wasser/Tide muss Matrix, Tide und Quellenbereich behalten.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Secondary-workspace regression fehlt in requiredFiles.');

console.log('MID v0.9.85.67/I.1-I.5: Meteogramm, Warnungen, Wasser/Tide und Mehr responsive geschützt.');
