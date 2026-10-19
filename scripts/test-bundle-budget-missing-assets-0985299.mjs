import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=resolve('scripts/test-bundle-budget-098594.mjs');
const base=mkdtempSync(join(tmpdir(),'mid-bundle-gate-'));
function run(files){
 rmSync(join(base,'dist'),{recursive:true,force:true});
 if(files!==null){
  const dir=join(base,'dist','assets');mkdirSync(dir,{recursive:true});
  for(const [name,bytes] of Object.entries(files))writeFileSync(join(dir,name),'x'.repeat(bytes));
 }
 return spawnSync(process.execPath,[script],{cwd:base,encoding:'utf8',timeout:15000});
}
try{
 // The historic pre-build mode remains intentional; in CI the production
 // build is already mandatory in addition to this focused regression.
 let test=run(null);
 assert.equal(test.status,0,'Pre-build source-only invocation remains available');
 assert.match(test.stdout,/dist\/assets fehlt/);
 for(const files of [{},{'index-a.js':100},{'index-a.css':100}]){
  test=run(files);
  assert.notEqual(test.status,0,'An incomplete built dist/assets must fail closed');
 }
 test=run({'index-a.js':100,'index-a.css':100});
 assert.equal(test.status,0,'Both mandatory assets within budget pass');
 test=run({'index-a.js':100,'index-a.css':1760001});
 assert.notEqual(test.status,0,'CSS budget must still be enforced');
 assert.match(test.stderr,/Main-CSS/);
 test=run({'index-a.js':1500001,'index-a.css':100});
 assert.notEqual(test.status,0,'JS budget must still be enforced');
 assert.match(test.stderr,/Main-JS/);
 console.log('Bundle-Budget: source-only skip remains explicit; incomplete built bundles fail closed; JS/CSS size limits unchanged.');
}finally{rmSync(base,{recursive:true,force:true});}
