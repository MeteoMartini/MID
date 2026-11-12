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
  const blocks=[...workflow.matchAll(/group: mid-pages\n\s+queue: (max|single)\n\s+cancel-in-progress: (true|false)/g)];
  assert.equal(blocks.length,4,'Installer muss drei Pages-Deployversuche plus den kurzen Stable-/Pages-Abschluss-Lock koordinieren.');
  assert.ok(blocks.every(match=>match[1]==='max'),'Installer muss wartende Pages-Publikationen verlustfrei per queue:max halten.');
  assert.ok(blocks.every(match=>match[2]==='false'),'Installer darf laufende RUC-/Pages-Publikation nicht abbrechen.');
  assert.ok(workflow.includes("group: mid-install-${{ github.ref }}-${{ github.event_name == 'push' && github.actor == 'mid-release-bot-meteomartini[bot]' && 'internal-bot-push' || 'release' }}\n  # Serialize installer events without canceling an active verified ZIP.\n  # Stale queued snapshots fail against current main before deployment.\n  # GitHub forbids queue:max together with cancel-in-progress:true.\n  queue: max\n  cancel-in-progress: false"),'Installers must queue without cancellation; stale event SHA fails closed before deployment.');
}

// Prevent stale candidates from reaching any external Worker/Pages mutation.
// The prerequisite must immediately precede the action, use a fresh main
// readback and be included explicitly in the action's fail-closed `if`.
const deploySteps=installCanonical.split(/(?=^      - name: )/m);
const stepFor=name=>deploySteps.find(s=>s.startsWith(`      - name: ${name}\n`));
for(const [mutation,guard,id] of [
  ['Neue Worker-Version nur hochladen, noch nicht live schalten','Unverändertes main vor Worker-Upload verifizieren','main_fence_worker_upload'],
  ['Geprüfte Worker-Version auf 100 Prozent promoten','Unverändertes main unmittelbar vor Worker-Live-Promotion prüfen','main_fence_worker_live'],
  ['GitHub-Pages-Deployment · Versuch 1','Unverändertes main unmittelbar vor Pages-Versuch 1 prüfen','main_fence_pages'],
  ['GitHub-Pages-Deployment · Versuch 2','Unverändertes main unmittelbar vor Pages-Versuch 2 prüfen','main_fence_pages'],
  ['GitHub-Pages-Deployment · Versuch 3','Unverändertes main unmittelbar vor Pages-Versuch 3 prüfen','main_fence_pages'],
]){
 const action=stepFor(mutation),check=stepFor(guard);
 assert.ok(action&&check,`Required pre-publish SHA fence missing: ${mutation}`);
 assert.equal(deploySteps.indexOf(check)+1,deploySteps.indexOf(action),`Fresh SHA check must be immediately before ${mutation}`);
 assert.ok(check.includes(`id: ${id}`));
 assert.ok(check.includes("GH_TOKEN: ${{ github.token }}"));
 assert.ok(check.includes("RELEASE_SHA: ${{ needs.install_build.outputs.commit_sha }}"));
 assert.ok(check.includes("current_main=")&&check.includes("current_main\" != \"$RELEASE_SHA"),'Fresh protected main SHA comparison required');
 assert.ok(check.includes("echo 'valid=true' >> \"$GITHUB_OUTPUT\""),'Fail-closed SHA fence must set valid only after check');
 assert.ok(action.includes(`steps.${id}.outputs.valid == 'true'`),`External deployment missing positive SHA-fence predicate: ${mutation}`);
}

for(const workflow of [rucCanonical,rucActive]){
  assert.ok(workflow.includes("- cron: '11 * * * *'"));
  assert.ok(workflow.includes("- cron: '41 * * * *'"));
  assert.ok(workflow.includes('group: mid-pages\n      queue: max\n      cancel-in-progress: false'),'RUC muss denselben seriellen FIFO-Pages-Lock ohne Cancellation nutzen.');
}

assert.ok(packer.includes('MAX_UPLOAD_BYTES = 24_000_000'));
for(const token of ['".github"','"node_modules"','"dist"','"artifacts"','"ios/App/App/public"'])assert.ok(packer.includes(token),`Transport-Ausschluss fehlt: ${token}`);
assert.ok(packer.includes('cap copy ios'),'Packer muss dokumentieren, dass das iOS-Webbundle reproduzierbar regeneriert wird.');

assert.deepEqual(splash.images.map(image=>[image.filename,image.scale,image.appearances?.[0]?.value??'light']),[
  ['splash-light-2732x2732-1x.png','1x','light'],
  ['splash-dark-2732x2732-1x.png','1x','dark']
]);
for(const stale of ['splash-light-2732x2732-2x.png','splash-light-2732x2732-3x.png','splash-dark-2732x2732-2x.png','splash-dark-2732x2732-3x.png']){
  await assert.rejects(access(new URL(`ios/App/App/Assets.xcassets/Splash.imageset/${stale}`,root)),/ENOENT/,`${stale} darf nicht erneut als bytegleiche Kopie eingecheckt werden.`);
}
console.log('Release-Hotfix geprüft: verlustfreie FIFO-Pages-Queue, :11/:41-RUC-Catch-up, deduplizierter 2732px-Splash und <25-MB-Transportpacker.');
