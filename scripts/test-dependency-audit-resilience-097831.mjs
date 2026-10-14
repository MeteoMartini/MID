import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const audit=await readFile(new URL('./audit-production-dependencies.mjs',import.meta.url),'utf8');

assert.equal(pkg.scripts?.['audit:dependencies'],'node scripts/audit-production-dependencies.mjs && node scripts/check-dependency-upgrade-policy.mjs','audit:dependencies muss den resilienten MID-Audit vor der Upgrade-Policy verwenden.');
assert.ok(audit.includes('/-/npm/v1/security/advisories/bulk'),'Der offizielle npm Bulk Advisory Endpoint fehlt.');
assert.ok(audit.includes('MID_OSV_AUDIT_URL')&&audit.includes('querybatch'),'Der unabhängige OSV-Fallback fehlt.');
assert.ok(audit.includes("severityRank")&&audit.includes("critical:4")&&audit.includes("high:3"),'HIGH/CRITICAL-Auswertung fehlt.');
assert.ok(audit.includes("process.exit(1)")&&audit.includes('HIGH/CRITICAL-Sicherheitsbefunde'),'HIGH/CRITICAL-Befunde müssen den Release weiterhin blockieren.');
assert.ok(audit.includes("npm',['ls','--omit=dev','--all','--json']"),'Lokale Konsistenzprüfung des installierten Produktionsbaums fehlt.');
assert.ok(audit.includes('OSV-Fallback wird verwendet'),'Fallback bei npm-Advisory-Ausfall fehlt.');
assert.ok(audit.includes('reinen externen Advisory-Service-Ausfalls nicht blockiert'),'Externe Advisory-Doppelstörung muss als Warnung statt als falscher App-/Lockfile-Fehler behandelt werden.');
assert.ok(!audit.includes('/security/audits/quick'),'Der auslaufende/instabile npm Quick-Audit-Endpunkt darf nicht mehr verwendet werden.');
assert.ok(!pkg.scripts?.['audit:dependencies']?.includes('npm audit'),'Der Workflow darf nicht mehr direkt vom npm-Quick-Audit abhängen.');

console.log(`MID v${pkg.version}: Dependency-Audit nutzt npm Bulk + OSV-Fallback und blockiert HIGH/CRITICAL weiterhin.`);

// Real HTTP/child-process fixtures isolate reports from parallel release audits.
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(path.join(tmpdir(),'mid-advisory-state-'));
let mode='clean',osvCalls=0;
const server=createServer((request,response)=>{
 request.resume();request.on('end',()=>{
  const osv=request.url==='/osv';if(osv)osvCalls++;
  if(mode==='outage'||(!osv&&(mode==='fallback'||mode==='malformed'||mode==='osv-blocked'))){response.writeHead(503);response.end('{}');return;}
  response.setHeader('content-type','application/json');
  if(osv&&mode==='malformed'){response.end('{}');return;}
  if(osv){const lock=JSON.parse(lockText),count=new Set(Object.entries(lock.packages).filter(([p,e])=>p&&e.dev!==true).map(([p,e])=>p.slice(p.lastIndexOf('node_modules/')+13)+'@'+e.version)).size;response.end(JSON.stringify({results:Array.from({length:count},()=>mode==='osv-blocked'?{vulns:[{id:'fixture',database_specific:{severity:'CRITICAL'}}]}:{} )}));}
  else response.end(JSON.stringify(mode==='blocked'?{react:[{id:1,severity:'high',title:'fixture'}]}:{}));
 });
});
const fixturePackage={name:'mid-advisory-fixture',version:'1.0.0',dependencies:{'mid-fixture':'1.0.0'}};
const lockText=JSON.stringify({name:fixturePackage.name,version:'1.0.0',lockfileVersion:3,packages:{'':fixturePackage,'node_modules/mid-fixture':{version:'1.0.0'}}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 await mkdir(path.join(dir,'scripts'));
 await writeFile(path.join(dir,'package.json'),JSON.stringify(fixturePackage));
 await writeFile(path.join(dir,'package-lock.json'),lockText);
 await copyFile(path.join(root,'scripts/audit-production-dependencies.mjs'),path.join(dir,'scripts/audit-production-dependencies.mjs'));
 await mkdir(path.join(dir,'node_modules/mid-fixture'),{recursive:true});
 await writeFile(path.join(dir,'node_modules/mid-fixture/package.json'),JSON.stringify({name:'mid-fixture',version:'1.0.0'}));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const [scenario,state,exitCode,source] of [['clean','checked',0,'npm-bulk'],['fallback','checked',0,'osv'],['outage','unknown',0,null],['blocked','blocked',1,'npm-bulk'],['malformed','unknown',0,null],['osv-blocked','blocked',1,'osv']]){
  mode=scenario;osvCalls=0;
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/audit-production-dependencies.mjs'],{cwd:dir,env:{...process.env,MID_NPM_AUDIT_BULK_URL:base+'/npm',MID_OSV_AUDIT_URL:base+'/osv',GITHUB_STEP_SUMMARY:path.join(dir,'summary.md')}});
   let output='';child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>output+=v);child.on('error',reject);child.on('close',code=>resolve({code,output}));
  });
  assert.equal(result.code,exitCode,result.output);
  const report=JSON.parse(await readFile(path.join(dir,'artifacts/dependency-audit.json'),'utf8'));
  assert.equal(report.state,state);assert.equal(report.source,source);
  assert.equal(report.lockfileSha256,createHash('sha256').update(lockText).digest('hex'));
  assert.ok(Number.isFinite(Date.parse(report.checkedAt)));
  assert.equal(report.recheckRequired,(scenario==='outage'||scenario==='malformed'));
  assert.equal(osvCalls,['fallback','outage','malformed','osv-blocked'].includes(scenario)?1:0);
  if((scenario==='outage'||scenario==='malformed')){
   assert.ok(!result.output.includes('keine HIGH/CRITICAL-Befunde'));
   assert.equal(report.providerErrors.length,2);assert.equal(report.releasePolicy,'deferred-external-service-outage');
   assert.match(await readFile(path.join(dir,'summary.md'),'utf8'),/unknown/);
  }
 }
 console.log('Advisory runtime: checked npm, checked OSV, unknown double outage, blocking HIGH; lockfile provenance and summary passed.');
}finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
