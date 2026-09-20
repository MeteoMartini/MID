import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,main,app,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18SecondaryWorkspaceFinish.css'),
 read('src/main.tsx'),
 read('src/App.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-secondary-workspaces-098567.mjs';

for(const token of [
 '--mid18-secondary-safe-clearance',
 '.warnings-responsive-shell',
 '.water-overview',
 '.modern-map-focus-shell',
 '.forecast-cockpit.modern-workspace',
 '.dashboard-section-drawer.modern-more-drawer',
 'grid-template-rows:auto auto minmax(0,1fr) auto!important',
 '.dashboard-section-nav-list.drawer.progressive>details',
 'white-space:normal!important',
 'text-overflow:clip!important',
 ':focus-visible',
 '@media(max-width:390px)'
]) assert.ok(css.includes(token),`Secondary-workspace contract missing: ${token}`);

assert.ok(main.includes("import './midC18SecondaryWorkspaceFinish.css';"),'Secondary workspace finish is not loaded.');
assert.ok(main.indexOf('midC18SecondaryWorkspaceFinish.css')>main.indexOf('midC18ForecastMapShellPolish.css'),'Secondary workspace finish must load after forecast/map polish.');
assert.ok(app.includes('modern-more-drawer'),'Modern More drawer must remain wired.');
assert.ok(app.includes("modernDrawer?' progressive':''"),'More drawer must preserve progressive grouped navigation.');
assert.ok(app.includes('warnings-responsive-shell'),'Warnings workspace must remain present.');
assert.ok(app.includes('water-overview'),'Water/tide workspace must remain present.');
assert.equal(pkg.version,baseline.releaseVersion,'Package and baseline versions must stay synchronized.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} missing from ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Secondary-workspace regression missing from requiredFiles.');

console.log('MID v0.9.85.67: warnings, water/tide, More progressive groups and mobile safe clearance protected.');
