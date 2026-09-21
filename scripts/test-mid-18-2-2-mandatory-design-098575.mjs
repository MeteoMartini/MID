import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-mid-18-2-2-mandatory-design-098575.mjs';

assert.ok(app.includes("const navigationMode:NavigationMode='bottom-tabs';"),'MID redesign must be the only navigation shell.');
assert.ok(app.includes('const forecastCockpitEnabled=true;'),'MID redesign forecast workspace must be mandatory.');
assert.ok(app.includes("document.documentElement.dataset.midDesign='next'"),'MID redesign dataset must be permanently active.');
assert.ok(app.includes("localStorage.removeItem('mid:designMode:v1')"),'Legacy stored design preference must be migrated away.');
for(const forbidden of ["type DesignMode='classic'|'mid-next'","readDesignMode()","writeDesignMode(","setDesignMode(","design-system-settings","Grafische Umsetzung</h3>","Bisherige Dashboard-Struktur und Navigation unverändert beibehalten"]){
 assert.ok(!app.includes(forbidden),`Legacy design switch remains reachable: ${forbidden}`);
}
for(const required of ['Skybar-Stil','24 Stundenquadrate',"skybarDisplayMode==='band'","skybarDisplayMode==='squares'"]){
 assert.ok(app.includes(required),`Independent Skybar/squares option must remain: ${required}`);
}
assert.equal(pkg.version,'0.9.85.75');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} missing in ${key}`);

console.log('MID v0.9.85.75: redesigned shell is mandatory while Skybar/24-hour squares remain independently selectable.');
