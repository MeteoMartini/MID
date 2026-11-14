import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,readdir,stat,rename,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {publishAtomicPng} from '../tools/widget-export/atomic-png.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,baselineRaw,canonical,active,renderer,downloader,sync,runtimeTest]=await Promise.all([
 read('package.json'),
 read('MID_BASELINE.json'),
 read('ci/github/workflows/widget-export.yml'),
 read('.github/workflows/widget-export.yml'),
 read('tools/widget-export/render-widget-matrix.mjs'),
 read('tools/widget-export/Download-MID-Widgets.ps1'),
 read('scripts/sync-github-workflows.mjs'),
 read('scripts/test-github-actions-runtime.mjs')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-widget-export-automation-0985178.mjs';

assert.equal(active,canonical,'Aktiver und kanonischer Widget-Workflow müssen bytegleich sein.');
for(const token of [
 "cron: '17 0,6,12,18 * * *'",
 'workflow_dispatch:',
 'permissions:\n  contents: read',
 'ref: mid-stable',
 'https://www.midwx.app/version.json',
 'render-widget-matrix.mjs',
 'mid-widget-export-latest.zip',
 'widget-latest',
 'MID Release Bot Token für Widget-Publikation erzeugen',
 'permission-contents: write',
 'MID_RELEASE_APP_CLIENT_ID',
 '--clobber'
])assert.ok(canonical.includes(token),`Widget-Workflow fehlt: ${token}`);
assert.ok(!canonical.includes('workflow_run:'),'Widget-Workflow darf nicht mehr automatisch nach Releases laufen.');
assert.ok(!canonical.includes('push:\n    branches:\n      - mid-stable'),'Widget-Workflow darf nicht mehr automatisch bei mid-stable-Push laufen.');
assert.equal((canonical.match(/cron:/g)||[]).length,1,'Widget-Workflow darf genau einen automatischen Zeitplan besitzen.');
for(const sha of [
 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
 'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
 'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9',
 'actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333',
 'actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510'
])assert.ok(canonical.includes(sha),`Workflow-Action ist nicht freigegeben/gepinnt: ${sha}`);

assert.match(renderer,/widgetUrlExportVariants\('https:\/\/www\.midwx\.app\/'\)/,'Renderer nutzt nicht den zentralen Widget-URL-Vertrag.');
assert.match(renderer,/variants\.length!==12/,'Renderer erzwingt nicht exakt zwölf Varianten.');
for(const name of ['malatya-kurve-7d-light.png','kuerecik-kompakt-5d-dark.png','amari-kurve-7d-dark.png'])assert.ok(renderer.includes(name),`Renderer-Vertrag kennt ${name} nicht.`);
for(const token of ['createHash','sha256','PNG-IHDR','manifest.json','SHA256SUMS.txt','MID_STABLE_SHA','MID_PUBLIC_VERSION'])assert.ok(renderer.includes(token),`Renderer-Validierung fehlt: ${token}`);
for(const token of [
 'const captureAttempts=3',
 'const captureTimeoutSeconds=180',
 'for(let attempt=1;attempt<=captureAttempts;attempt++)',
 'Widget-Rendering endgültig fehlgeschlagen'
])assert.ok(renderer.includes(token),`Renderer-Retryvertrag fehlt: ${token}`);
assert.ok(!renderer.includes('await rm(target,{force:true})'),'Ein alter erfolgreicher Screenshot darf vor einem Retry nicht entfernt werden.');
assert.ok(!renderer.includes('await rm(`\  await rm(target,{force:true});
  await rm(`${target}.part.png`,{force:true});.part.png`,{force:true})'),'Alte Partdateien dürfen kein gemeinsamer Stagingpfad sein.');
const captureSource=await read('tools/widget-export/capture-widget.mjs');
const atomicSource=await read('tools/widget-export/atomic-png.mjs');
assert.ok(captureSource.includes('publishAtomicPng(output,bytes)'),'Capture verwendet atomaren Screenshot-Publish.');
assert.ok(!captureSource.includes('await rm(output,{force:true})'),'Capture darf den letzten erfolgreichen Screenshot nicht löschen.');
assert.ok(atomicSource.includes('await mkdtemp(')&&atomicSource.includes('await renameFile(staged,output)'),'Pro Versuch ist private Stagingdatei + Rename vorgeschrieben.');
assert.ok(canonical.includes('timeout-minutes: 45'),'Widget-Workflow lässt den begrenzten Retryspielraum nicht zu.');

assert.ok(downloader.includes('releases/download/widget-latest/mid-widget-export-latest.zip'),'Windows-Downloader nutzt nicht den festen rollierenden Download.');
for(const token of ['Get-FileHash','Expand-Archive','Manifest.count -ne 12','ConvertFrom-Json','USERPROFILE'])assert.ok(downloader.includes(token),`Windows-Downloader fehlt: ${token}`);

assert.ok(sync.includes("['workflows/widget-export.yml','workflows/widget-export.yml']"),'Widget-Workflow ist nicht Teil der kanonischen Workflow-Synchronisierung.');
assert.ok(runtimeTest.includes("'widget-export.yml'"),'Allgemeine Actions-Runtime-Prüfung umfasst den Widget-Workflow nicht.');
assert.equal(pkg.scripts?.['test:widget-export-automation'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['ci/github/workflows/widget-export.yml','tools/widget-export/render-widget-matrix.mjs','tools/widget-export/Download-MID-Widgets.ps1','tools/widget-export/README.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

// Negative and concurrency tests use isolated filesystem fixtures, not a browser.
const atomicFixture=await mkdtemp(path.join(os.tmpdir(),'mid-atomic-png-test-'));
try{
 const target=path.join(atomicFixture,'widget.png');
 await writeFile(target,'verified-previous-image');
 await assert.rejects(publishAtomicPng(target,Buffer.from('new-image'),async()=>{throw Error('test atomic rename failed')}),/test atomic rename failed/);
 assert.equal(await readFile(target,'utf8'),'verified-previous-image','A failed replacement must not remove or truncate the last good image');
 assert.deepEqual(await readdir(atomicFixture),['widget.png'],'Private staging must be removed even when rename fails');
 let privateStageMode;
 const newer=Buffer.from('complete-new-image');
 const info=await publishAtomicPng(target,newer,async(from,to)=>{privateStageMode=(await stat(from)).mode&0o777;await rename(from,to)});
 assert.equal(info.size,newer.length);
 assert.equal(privateStageMode,0o600,'Staging image must be private');
 assert.deepEqual(await readFile(target),newer);
 const values=Array.from({length:24},(_,index)=>Buffer.from('png-content-'+index+'-'.repeat(2000)));
 await Promise.all(values.map(data=>publishAtomicPng(target,data)));
 const published=await readFile(target);
 assert.ok(values.some(value=>value.equals(published)),'Concurrent outputs must be one complete image, never truncated/interleaved');
 assert.deepEqual(await readdir(atomicFixture),['widget.png'],'Concurrent attempts must clean all staging directories');
 if(process.platform!=='win32'){
  const victim=path.join(atomicFixture,'victim.png'),link=path.join(atomicFixture,'link.png');
  await writeFile(victim,'original-victim');
  await symlink(victim,link);
  await publishAtomicPng(link,Buffer.from('new-safe-content'));
  assert.equal(await readFile(victim,'utf8'),'original-victim','Replacement must not follow a symlink to overwrite its victim');
  assert.equal(await readFile(link,'utf8'),'new-safe-content');
 }
}finally{await rm(atomicFixture,{recursive:true,force:true})}
console.log(`MID v${pkg.version}: serverseitiger Widget-Export, rollierendes geprüftes ZIP und adminfreier Windows-Downloader sind vertraglich abgesichert.`);
