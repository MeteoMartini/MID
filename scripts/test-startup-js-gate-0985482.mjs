import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=mkdtempSync(join(tmpdir(),'mid-js-startup-budget-'));
const gate=resolve('scripts/check-build-budget.mjs');
const limits=JSON.parse(readFileSync(new URL('../MID_PERFORMANCE_BASELINE.json',import.meta.url),'utf8')).limits;
assert.ok(limits.initialJsBytes>0&&limits.initialJsBytes<=2_400_000,'No startup JS raw-budget loosening');
assert.ok(limits.initialJsGzipBytes>0&&limits.initialJsGzipBytes<=750_000,'No startup JS gzip-budget loosening');
function run(js,extra='',preload=true){
 const dist=join(root,'dist');rmSync(dist,{force:true,recursive:true});
 mkdirSync(join(dist,'assets'),{recursive:true});
 writeFileSync(join(dist,'index.html'),'<link rel="stylesheet" href="./assets/index.css">'+
  (preload?'<link rel="modulepreload" href="./assets/vendor.js"><link rel="modulepreload" href="./assets/vendor.js">':'')+
  '<script type="module" src="./assets/index.js"></script>');
 writeFileSync(join(dist,'assets','index.css'),'body{color:#123456}');
 writeFileSync(join(dist,'assets','index.js'),js);
 writeFileSync(join(dist,'assets','vendor.js'),'export default 123;');
 if(extra)writeFileSync(join(dist,'assets','extra.js'),extra);
 const result=spawnSync(process.execPath,[gate,dist],{cwd:root,encoding:'utf8',timeout:30000});
 const report=JSON.parse(readFileSync(join(root,'artifacts','build-budget.json'),'utf8'));
 return {result,report};
}
try{
 let x=run('export default 1;');
 assert.equal(x.result.status,0,'Valid startup JS must pass');
 assert.equal(x.report.totals.initialJsFileCount,2,'Duplicate modulepreload must count once');
 assert.equal(x.report.initialJsAssets.length,2);
 assert.equal(x.report.totals.initialJsBytes,Buffer.byteLength('export default 1;')+Buffer.byteLength('export default 123;'));
 x=run('/*'+'.'.repeat(2_400_050)+'*/');
 assert.notEqual(x.result.status,0,'Raw startup JS growth must fail');
 assert.ok(x.report.failures.some(m=>m.startsWith('initialJsBytes:')),'Raw-budget failure must be attributable');
 const noise=Buffer.alloc(800_000);let state=0x13579bdf;
 for(let i=0;i<noise.length;i++){state^=state<<13;state^=state>>>17;state^=state<<5;noise[i]=state&255}
 x=run(noise.toString('base64'));
 assert.notEqual(x.result.status,0,'Compressed startup JS growth must fail');
 assert.ok(x.report.failures.some(m=>m.startsWith('initialJsGzipBytes:')),'Gzip-budget failure must be attributable');
 x=run('export default 1;', 'export const deferred=42;');
 assert.equal(x.result.status,0,'Unreferenced lazy JS must not count as startup');
 assert.equal(x.report.totals.initialJsFileCount,2);
 console.log('MID startup JS gate: measured assets, dedupe, deferred exclusion, raw and gzip negative limits PASS');
}finally{rmSync(root,{force:true,recursive:true})}
