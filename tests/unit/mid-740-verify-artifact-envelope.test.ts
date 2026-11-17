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


it('keeps old producer envelopes compatible but fail-closes new original premerge 3-member envelopes',()=>{
 const root=mkdtempSync(join(tmpdir(),'mid740-premerge-envelope-'));
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
  const zip=Buffer.from('original producer ZIP git blob bytes');
  writeFileSync(join(root,'MID-professional-replacement.zip'),zip);
  git('add','MID-professional-replacement.zip');
  git('commit','-qm','package');
  const pkg=git('rev-parse','HEAD');
  const digest=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
  const expected={packageCommitSha:pkg,sourceMergeSha:source,workflowSha:source,
   producerRunId:202,producerRunAttempt:1,sourceGateRunId:101,sourceGateRunAttempt:1};
  const expectedFile=join(root,'expected-producer.json');
  writeFileSync(expectedFile,JSON.stringify(expected));
  const original={
   schema:'mid.740.premerge-producer-receipt.v1',
   status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
   sourceGateRunId:101,sourceGateAttempt:1,sourceHeadSha:'a'.repeat(40),
   sourceBaseSha:source,prNumber:303,
   producerRunId:202,producerAttempt:1,producerWorkflowSha:source,
   upstreamGateMetadataCoherent:true,producerRunMetadataCoherent:true,
   originalArtifactVerified:false,trustedProductionReceiptAttested:false,
   installerAuthorized:false,releaseAuthorized:false
  };
  const variants=[
   'new-two-member-absent','premerge-good','premerge-required',
   'premerge-foreign-run','premerge-wrong-gate','premerge-wrong-base',
   'premerge-self-authorized','premerge-no-core',
   'premerge-forged-status','premerge-noncanonical','premerge-duplicate-key',
   'premerge-byte-tamper','premerge-wrong-manifest-digest',
   'premerge-no-manifest-flag','premerge-claim-absent',
   'premerge-extra','premerge-two-member-falsely-claims-present',
   'premerge-expect-three-but-two'
  ];
  const writer=String.raw`import sys
from zipfile import ZipFile
with ZipFile(sys.argv[1], "w") as z:
 z.writestr("MID-professional-replacement.zip",sys.argv[2].encode())
 z.writestr("provenance.json",sys.argv[3])
 if sys.argv[4] != "NO":z.writestr("premerge-gate-receipt.json",sys.argv[4])
 if sys.argv[5] == "extra":z.writestr("unexpected.bin",b"X")
`;
  for(const variant of variants){
   const hasOriginal=!variant.startsWith('new-two-member')&&
    variant!=='premerge-two-member-falsely-claims-present'&&
    variant!=='premerge-expect-three-but-two';
   let body={...original};
   if(variant==='premerge-foreign-run')body.producerRunId=203;
   if(variant==='premerge-wrong-gate')body.sourceGateRunId=102;
   if(variant==='premerge-wrong-base')body.sourceBaseSha='b'.repeat(40);
   if(variant==='premerge-self-authorized')body.installerAuthorized=true;
   if(variant==='premerge-no-core')body.upstreamGateMetadataCoherent=false;
   if(variant==='premerge-forged-status')body.status='APPROVED';
   let raw=JSON.stringify(body)+'\n';
   if(variant==='premerge-noncanonical')raw=JSON.stringify(body,null,2)+'\n';
   if(variant==='premerge-duplicate-key')
    raw=raw.replace(/^\{/,'{"producerRunId":202,');
   const trustedOriginal=join(root,'trusted-'+variant+'.json');
   // For identity mutation cases the caller's independent file agrees
   // with the mutated bytes: only internal provenance checks can reject.
   writeFileSync(trustedOriginal,
    variant==='premerge-byte-tamper'?JSON.stringify(original)+'\n':raw);
   if(variant==='premerge-byte-tamper')raw=raw.replace('premerge-producer','tampered-producer');
   const legacy={...expected,schema:'mid.740.legacy-producer-shadow.v1',
    zipSha256:digest(zip),installerAuthorized:false,releaseAuthorized:false};
   const manifest:Record<string,any>={...legacy};
   if(variant==='new-two-member-absent'||
      variant==='premerge-expect-three-but-two'){
    manifest.originalPremergeReceiptIncluded=false;
    manifest.originalPremergeReceiptSha256=null;
   }else if(variant==='premerge-two-member-falsely-claims-present'){
    manifest.originalPremergeReceiptIncluded=true;
    manifest.originalPremergeReceiptSha256=digest(raw);
   }else{
    manifest.originalPremergeReceiptIncluded=true;
    manifest.originalPremergeReceiptSha256=digest(raw);
   }
   if(variant==='premerge-wrong-manifest-digest')
    manifest.originalPremergeReceiptSha256='0'.repeat(64);
   if(variant==='premerge-no-manifest-flag')
    manifest.originalPremergeReceiptIncluded=false;
   if(variant==='premerge-claim-absent'){
    manifest.originalPremergeReceiptIncluded=false;
    manifest.originalPremergeReceiptSha256=null;
   }
   const path=join(root,variant+'.zip');
   const result=run(root,'python3',['-c',writer,path,zip.toString(),
    JSON.stringify(manifest),hasOriginal?raw:'NO',
    variant==='premerge-extra'?'extra':'none']);
   expect(result.status,variant+' '+result.stderr).toBe(0);
   const needsExpected=hasOriginal&&variant!=='premerge-required';
   const opts=['--envelope',path,
    '--expected-envelope-sha256',digest(readFileSync(path)),
    '--expected-legacy-receipt',expectedFile,
    '--installer-zip-sha256',digest(zip),'--repository',root,
    ...(needsExpected||variant==='premerge-expect-three-but-two'?
     ['--expected-premerge-receipt',trustedOriginal]:[])
   ];
   const inspected=run(root,'python3',[envelope,'--inspect-original-premerge',
    '--envelope',path,'--expected-envelope-sha256',digest(readFileSync(path))]);
   if(variant==='premerge-good'||variant==='premerge-required'){
    expect(inspected.status,variant+' '+inspected.stderr).toBe(0);
    const info=JSON.parse(inspected.stdout);
    expect(info).toMatchObject({
     schema:'mid.740.original-legacy-shadow-inspection.v1',
     status:'ORIGINAL_BYTES_READ_QA_ONLY',
     originalPremergeReceiptSha256:digest(raw),
     originalPremergeReceiptText:raw,
     authenticatedGitHubProducer:false,
     nativeReviewVerified:false,installerAuthorized:false,
     releaseAuthorized:false});
    expect(info.originalPremergeReceipt).toEqual(original);
   }else expect(inspected.status,variant+' original inspection should block').not.toBe(0);
   const checked=run(root,'python3',[envelope,...opts]);
   if(variant==='new-two-member-absent'){
    expect(checked.status,checked.stderr).toBe(0);
    expect(JSON.parse(checked.stdout)).toMatchObject({
     originalPremergeReceiptBytesVerified:false,
     originalPremergeReceiptSha256:null,
     authenticatedGitHubProducer:false,
     installerAuthorized:false,releaseAuthorized:false});
   }else if(variant==='premerge-good'){
    expect(checked.status,checked.stderr).toBe(0);
    expect(JSON.parse(checked.stdout)).toMatchObject({
     originalPremergeReceiptBytesVerified:true,
     originalPremergeReceiptSha256:digest(raw),
     authenticatedGitHubProducer:false,
     nativeReviewVerified:false,
     installerAuthorized:false,releaseAuthorized:false});
   }else{
    expect(checked.status,variant+' unexpectedly accepted').not.toBe(0);
   }
  }
 }finally{rmSync(root,{recursive:true,force:true})}
},65000);
