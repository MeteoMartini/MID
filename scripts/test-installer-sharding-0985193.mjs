import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {mapBrowserWidths,MAP_BROWSER_WIDTHS} from './map-browser-shards.mjs';
const root=process.cwd(),source=await readFile('ci/github/workflows/install-mid.yml','utf8');
for(const file of ['.github/workflows/install-mid.yml','workflow-patches/install-mid.yml'])assert.equal(await readFile(file,'utf8'),source);
for(const token of ['prepare_release:','verify_core:','verify_heavy:','needs: [prepare_release, verify_core, verify_heavy]','fail-fast: false','MID_REGRESSION_SHARD: core','npm run verify','snapshot_sha','MID_SNAPSHOT_SHA','${{ github.sha }}','${{ github.run_id }}-${{ github.run_attempt }}','persist-credentials: false'])assert.ok(source.includes(token),'Installer gate missing: '+token);
const heavy=source.split('  verify_heavy:')[1].split('  install_build:')[0];assert.equal((heavy.match(/shard: heavy-unified-map/g)||[]).length,3);for(const key of ['heavy-native-map','heavy-mountain-visual',"map_group: '1/3'","map_group: '2/3'","map_group: '3/3'"])assert.ok(heavy.includes(key));assert.ok(!heavy.includes('secrets.')&&!heavy.includes('permission-contents: write'));
for(const key of ['prepare_release','verify_core','verify_heavy']){const block=source.split('  '+key+':')[1].split(/^  \w+:/m)[0];assert.ok(!block.includes('secrets.')&&!block.includes('permission-contents: write'),'No write credentials before aggregate gate');}
const collector=source.split('  install_build:')[1].split('  deploy_worker:')[0];assert.ok(collector.includes('needs.verify_core.outputs.snapshot_sha'));assert.ok(!collector.includes('continue-on-error'));
assert.equal((source.match(/artifact-ids: \$\{\{ needs\.(?:prepare_release|verify_core)\.outputs\.snapshot_id \}\}/g)||[]).length,3,'Retries must download the immutable producer artifact, not the new attempt name');
assert.equal((source.match(/digest-mismatch: error/g)||[]).length,3);assert.equal((source.match(/Missing producer artifact ID/g)||[]).length,3);
const widths=['1/3','2/3','3/3'].flatMap(mapBrowserWidths);assert.equal(new Set(widths).size,6);assert.deepEqual([...widths].sort((a,b)=>a-b),[...MAP_BROWSER_WIDTHS].sort((a,b)=>a-b));assert.equal(widths.length*2*2,24);assert.deepEqual(mapBrowserWidths(),[...MAP_BROWSER_WIDTHS]);for(const bad of ['0/3','4/3','1/2','abc','1/3 '])assert.throws(()=>mapBrowserWidths(bad));
const temp=await mkdtemp(path.join(tmpdir(),'mid-snapshot-test-')),checkout=path.join(temp,'checkout'),snapshot=path.join(temp,'snapshot'),output=path.join(temp,'output'),tool=path.join(root,'tools/ci/release-snapshot.mjs'),event='a'.repeat(40);
try{await mkdir(checkout);await mkdir(path.join(checkout,'.git'));await writeFile(path.join(checkout,'.git','keep'),'git');await writeFile(path.join(checkout,'source.txt'),'validated release');
 const run=(op,env={})=>execFileSync(process.execPath,[tool,op,snapshot],{cwd:checkout,env:{...process.env,GITHUB_SHA:event,GITHUB_OUTPUT:output,...env},encoding:'utf8'});
 run('pack');const digest=(await readFile(output,'utf8')).match(/snapshot_sha=([a-f0-9]{64})/)[1];await writeFile(path.join(checkout,'source.txt'),'old');await writeFile(path.join(checkout,'stale.txt'),'stale');run('restore',{MID_SNAPSHOT_SHA:digest});assert.equal(await readFile(path.join(checkout,'source.txt'),'utf8'),'validated release');assert.equal(await readFile(path.join(checkout,'.git','keep'),'utf8'),'git');await assert.rejects(readFile(path.join(checkout,'stale.txt')));
 assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:'b'.repeat(64)}));assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:digest,GITHUB_SHA:'c'.repeat(40)}));await writeFile(path.join(snapshot,'release.tar.gz'),'tampered');assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:digest}));assert.equal(await readFile(path.join(checkout,'source.txt'),'utf8'),'validated release');
}finally{await rm(temp,{recursive:true,force:true})}
console.log('Installer: exact event/manifest/archive/files binding, fail-closed parallel gate and lossless 24-case map partition verified.');
