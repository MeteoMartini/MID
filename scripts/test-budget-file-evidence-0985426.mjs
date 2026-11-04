import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash,randomBytes} from 'node:crypto';
const dir=mkdtempSync(join(tmpdir(),'mid-budget-evidence-'));
try{
 mkdirSync(join(dir,'dist/assets'),{recursive:true});
 const files={'index.html':'<link rel="stylesheet" href="./assets/index-test.css">','assets/index-test.css':'body{color:red}','icon.png':Buffer.from([137,80,78,71,1,2,3]),'CHANGELOG.md':'Existing Markdown is other, not silently reclassified.'};
 for(const [name,data] of Object.entries(files))writeFileSync(join(dir,'dist',name),data);
 const run=()=>spawnSync(process.execPath,[resolve('scripts/check-build-budget.mjs'),join(dir,'dist')],{cwd:dir,encoding:'utf8',timeout:10000});
 assert.equal(run().status,0);
 let report=JSON.parse(readFileSync(join(dir,'artifacts/build-budget.json')));
 for(const row of report.assets){const data=Buffer.from(files[row.file]);assert.equal(row.sha256,createHash('sha256').update(data).digest('hex'));assert.equal(row.bytes,data.length);assert.equal(row.gzipBytes,gzipSync(data,{level:9}).length);}
 assert.equal(report.assets.find(row=>row.file==='CHANGELOG.md').category,'other');
 assert.equal(report.assets.find(row=>row.file==='icon.png').category,'static-media');
 assert.equal(report.totals.totalGzipBytes,report.assets.reduce((sum,row)=>sum+row.gzipBytes,0));
 assert.equal(report.totals.initialCssFileCount,1);
 writeFileSync(join(dir,'dist/oversize.bin'),randomBytes(9_000_000));
 assert.equal(run().status,1,'Existing limit must still fail');
 report=JSON.parse(readFileSync(join(dir,'artifacts/build-budget.json')));
 assert.equal(report.ok,false);assert.ok(report.failures.some(row=>row.startsWith('totalGzipBytes:')));
 assert.ok(report.assets.find(row=>row.file==='oversize.bin')?.sha256,'Failure report must retain complete evidence');
 console.log('PASS file-exact sizes/categories/SHA256, unchanged gzip totals and limits, evidence survives budget failure');
}finally{rmSync(dir,{recursive:true,force:true})}
