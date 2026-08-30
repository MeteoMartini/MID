import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const text=async relative=>readFile(new URL(relative,root),'utf8');
const test='scripts/test-release-upload-budget-097410.mjs';
const [pkgText,baselineText,installCanonical,rucCanonical,packer,splashCatalog]=await Promise.all([
  text('package.json'),text('MID_BASELINE.json'),text('ci/github/workflows/install-mid.yml'),
  text('ci/github/workflows/mid-ruc-preprocess.yml'),text('tools/release/create_professional_zip.py'),
  text('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json')
]);
const installActive=installCanonical,rucActive=rucCanonical;
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),splash=JSON.parse(splashCatalog);
const versionAtLeast=(value,minimum)=>{const left=String(value).split('.').map(Number),right=String(minimum).split('.').map(Number),length=Math.max(left.length,right.length);for(let index=0;index<length;index++){const delta=(left[index]||0)-(right[index]||0);if(delta)return delta>0}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.74.10'),`Release-Uploadbudget gilt ab v0.9.74.10, erhalten ${pkg.version}.`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['release:pack'],'python3 tools/release/create_professional_zip.py MID-professional-replacement.zip');
assert.equal(pkg.scripts?.['test:release-upload-budget'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);

for(const workflow of [installCanonical,installActive]){
  const blocks=[...workflow.matchAll(/group: mid-pages\n\s+cancel-in-progress: (true|false)/g)];
  assert.equal(blocks.length,3,'Installer muss genau drei Pages-Deployversuche koordinieren.');
  assert.ok(blocks.every(match=>match[1]==='false'),'Installer darf laufende RUC-/Pages-Publikation nicht abbrechen.');
  assert.ok(workflow.includes('group: mid-install-${{ github.ref }}\n  cancel-in-progress: true'),'Release-Run-Supersession muss erhalten bleiben.');
}
for(const workflow of [rucCanonical,rucActive]){
  assert.ok(workflow.includes("- cron: '11 * * * *'"));
  assert.ok(workflow.includes("- cron: '41 * * * *'"));
  assert.ok(workflow.includes('group: mid-pages\n      cancel-in-progress: false'),'RUC muss denselben seriellen Pages-Lock ohne Cancellation nutzen.');
}

assert.ok(packer.includes('MAX_UPLOAD_BYTES = 24_000_000'));
for(const token of ['".github"','"node_modules"','"dist"','"ios/App/App/public"'])assert.ok(packer.includes(token),`Transport-Ausschluss fehlt: ${token}`);
assert.ok(packer.includes('cap copy ios'),'Packer muss dokumentieren, dass das iOS-Webbundle reproduzierbar regeneriert wird.');

assert.deepEqual(splash.images.map(image=>[image.filename,image.scale,image.appearances?.[0]?.value??'light']),[
  ['splash-light-2732x2732-1x.png','1x','light'],
  ['splash-dark-2732x2732-1x.png','1x','dark']
]);
for(const stale of ['splash-light-2732x2732-2x.png','splash-light-2732x2732-3x.png','splash-dark-2732x2732-2x.png','splash-dark-2732x2732-3x.png']){
  await assert.rejects(access(new URL(`ios/App/App/Assets.xcassets/Splash.imageset/${stale}`,root)),/ENOENT/,`${stale} darf nicht erneut als bytegleiche Kopie eingecheckt werden.`);
}
console.log('Release-Hotfix geprüft: serieller Pages-Lock, :11/:41-RUC-Catch-up, deduplizierter 2732px-Splash und <25-MB-Transportpacker.');
