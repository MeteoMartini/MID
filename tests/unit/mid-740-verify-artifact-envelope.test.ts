import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const builder=resolve('tools/ci/mid-740-build-source-zip.py');
const envelope=resolve('tools/ci/mid-740-verify-artifact-envelope.py');
const local=resolve('tools/ci/mid-740-verify-local-artifact.py');
const sourceVerifier=resolve('tools/ci/verify-source-release-zip.py');
function run(cwd:string,bin:string,args:string[]){
 const r=spawnSync(bin,args,{cwd,encoding:'utf8',timeout:30000});
 if(r.error)throw r.error;return r;
}
const buildEnvelope=String.raw`import sys,stat,warnings
from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
artifact=Path(sys.argv[1]);output=Path(sys.argv[2]);variant=sys.argv[3]
with ZipFile(output,'w',compression=ZIP_DEFLATED) as z:
 for name in ('MID-professional-replacement.zip','MID-source-zip-evidence.json'):
  if variant=='missing' and name.endswith('.json'):continue
  actual='../MID-professional-replacement.zip' if variant=='traversal' and name.endswith('.zip') else name
  data=(artifact/name).read_bytes()
  if variant=='inner-tamper' and name.endswith('.zip'):data=b'not-the-original-zip'
  if variant=='manifest-tamper' and name.endswith('.json'):data=b'{"productionApproved":true}'
  info=ZipInfo(actual);info.compress_type=ZIP_DEFLATED;info.create_system=3
  info.external_attr=((stat.S_IFLNK|0o777) if variant=='symlink' and name.endswith('.json') else (stat.S_IFREG|0o600))<<16
  z.writestr(info,data)
 if variant=='extra':z.writestr('extra.txt',b'bad')
 if variant=='duplicate':
  with warnings.catch_warnings():
   warnings.simplefilter('ignore',UserWarning)
   z.writestr('MID-source-zip-evidence.json',b'{}')
`;
describe('MID #740: verify envelope digest, safe unzip and Git tree',()=>{
 it('accepts clean bytes and refuses tampered, duplicate, traversal and symlink ZIPs',()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-envelope-'));
  try{
   const repo=join(root,'repo'),artifact=join(root,'artifact');
   mkdirSync(repo);writeFileSync(join(repo,'source.txt'),'Trusted SHA-bound content\n');
   for(const args of [['init','--object-format=sha1','-q'],['add','.'],
    ['-c','user.name=MID QA','-c','user.email=qa@example.invalid',
     '-c','commit.gpgsign=false','commit','-qm','fixture']])
    expect(run(repo,'git',args).status).toBe(0);
   const sha=run(repo,'git',['rev-parse','HEAD']).stdout.trim();
   const built=run(repo,'python3',[builder,'--repository',repo,'--source-sha',sha,'--destination',artifact]);
   expect(built.status,built.stderr).toBe(0);
   for(const variant of ['clean','missing','traversal','extra','duplicate',
    'symlink','inner-tamper','manifest-tamper']){
    const packed=join(root,'outer-'+variant+'.zip'),out=join(root,'out-'+variant);
    const make=run(repo,'python3',['-c',buildEnvelope,artifact,packed,variant]);
    expect(make.status,make.stderr).toBe(0);
    const digest=createHash('sha256').update(readFileSync(packed)).digest('hex');
    const args=['--envelope',packed,'--expected-envelope-sha256',digest,
     '--source-sha',sha,'--destination',out,'--repository',repo,
     '--local-verifier',local,'--source-verifier',sourceVerifier];
    const checked=run(repo,'python3',[envelope,...args]);
    if(variant==='clean'){
     expect(checked.status,checked.stderr).toBe(0);
     expect(JSON.parse(checked.stdout)).toMatchObject({
      sourceMergeSha:sha,envelopeSha256:digest,envelopeBytesVerified:true,
      sourceGitTreeVerified:true,authenticatedGitHubProducer:false,
      installerAuthorized:false,releaseAuthorized:false});
     expect(existsSync(join(out,'MID-professional-replacement.zip'))).toBe(true);
     expect(run(repo,'python3',[envelope,...args]).status).not.toBe(0);
     expect(run(repo,'python3',[envelope,...args.map((x,i)=>i===3?'f'.repeat(64):x)]).status).not.toBe(0);
    }else{
     expect(checked.status,variant+' '+checked.stderr).not.toBe(0);
     expect(existsSync(out)).toBe(false);
    }
   }
  }finally{rmSync(root,{recursive:true,force:true});}
 },65000);
});
it('compares a legacy upload with independent Git and installer evidence',()=>{
 const root=mkdtempSync(join(tmpdir(),'mid740-legacy-envelope-'));
 try{
  const git=(...args:string[])=>{
   const result=run(root,'git',args);
   expect(result.status,result.stderr).toBe(0);
   return result.stdout.trim();
  };
  git('init','--object-format=sha1','-q');
  git('config','user.name','MID QA');
  git('config','user.email','qa@example.invalid');
  git('commit','--allow-empty','-qm','source');
  const source=git('rev-parse','HEAD');
  const filename='MID-professional-replacement.zip';
  const zip=Buffer.from('installer input fixture');
  writeFileSync(join(root,filename),zip);
  git('add',filename);
  git('commit','-qm','exact package');
  const pkg=git('rev-parse','HEAD');
  const expected={packageCommitSha:pkg,sourceMergeSha:source,workflowSha:source,
   producerRunId:12,producerRunAttempt:1,sourceGateRunId:11,sourceGateRunAttempt:1};
  const expectedFile=join(root,'expected.json');
  const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const installerDigest=digest(zip);
  const receipt={...expected,schema:'mid.740.legacy-producer-shadow.v1',
   zipSha256:installerDigest,installerAuthorized:false,releaseAuthorized:false};
  writeFileSync(expectedFile,JSON.stringify(expected));
  for(const variant of ['clean','bytes','wrong-run','duplicate-key','wrong-installer','wrong-envelope','wrong-parent']){
   const packed=join(root,variant+'.zip');
   let body=JSON.stringify(variant==='wrong-run'?{...receipt,producerRunId:13}:receipt);
   if(variant==='duplicate-key')body=body.replace('{','{"producerRunId":12,');
   const bytes=variant==='bytes'?'tampered':zip.toString();
   const archive=run(root,'python3',['-c',`from zipfile import ZipFile
import sys
with ZipFile(sys.argv[1], "w") as archive:
 archive.writestr("provenance.json", sys.argv[2])
 archive.writestr("MID-professional-replacement.zip", sys.argv[3])`,packed,body,bytes]);
   expect(archive.status,archive.stderr).toBe(0);
   if(variant==='wrong-parent')writeFileSync(expectedFile,JSON.stringify({...expected,sourceMergeSha:pkg}));
   const checked=run(root,'python3',[envelope,'--envelope',packed,
    '--expected-envelope-sha256',variant==='wrong-envelope'?'f'.repeat(64):digest(readFileSync(packed)),
    '--expected-legacy-receipt',expectedFile,
    '--installer-zip-sha256',variant==='wrong-installer'?'e'.repeat(64):installerDigest,'--repository',root]);
   if(variant==='clean'){
    expect(checked.status,checked.stderr).toBe(0);
    expect(JSON.parse(checked.stdout)).toMatchObject({packageCommitSha:pkg,innerZipSha256:installerDigest,
     packageAndInstallerDigestMatch:true,authenticatedGitHubProducer:false,
     installerAuthorized:false,releaseAuthorized:false});
   }else expect(checked.status,variant).not.toBe(0);
  }
 }finally{rmSync(root,{recursive:true,force:true})}
});
