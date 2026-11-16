import {describe,it,expect} from 'vitest';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const builder=resolve('tools/ci/mid-740-build-source-zip.py');
const intake=resolve('tools/ci/mid-740-verify-local-artifact.py');
const verifier=resolve('tools/ci/verify-source-release-zip.py');
const run=(cwd:string,cmd:string,args:string[])=>{
 const p=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:25000});
 if(p.error)throw p.error;
 return p;
};
describe('MID #740: downloaded package local identity/ZIP verification pilot',()=>{
 it('checks a real exact Git-tree source ZIP and rejects all untrusted local variants',()=>{
  const root=mkdtempSync(join(tmpdir(),'mid-740-verify-'));
  try{
   const repo=join(root,'repo'),out=join(root,'artifact');mkdirSync(repo);
   writeFileSync(join(repo,'source.txt'),'trusted bytes\n');
   for(const args of [['init','--object-format=sha1','-q'],['add','.'],
     ['-c','user.name=MID QA','-c','user.email=qa@example.invalid',
      '-c','commit.gpgsign=false','commit','-qm','original']])
    expect(run(repo,'git',args).status).toBe(0);
   const sha=run(repo,'git',['rev-parse','HEAD']).stdout.trim();
   const built=run(repo,'python3',[builder,'--repository',repo,'--source-sha',sha,'--destination',out]);
   expect(built.status,built.stderr).toBe(0);
   const args=['--artifact-dir',out,'--repository',repo,'--verifier',verifier,'--source-sha',sha];
   const good=run(repo,'python3',[intake,...args]);
   expect(good.status,good.stderr).toBe(0);
   expect(JSON.parse(good.stdout)).toMatchObject({verifiedLocalGitTree:true,
    artifactEnvelopeDigestVerified:false,authenticatedGitHubProducer:false,
    nativeMergeReviewVerified:false,installerAuthorized:false,releaseAuthorized:false});
   expect(run(repo,'python3',[intake,...args.slice(0,-1),'0'.repeat(40)]).status).not.toBe(0);
   writeFileSync(join(out,'extra.txt'),'unexpected');
   expect(run(repo,'python3',[intake,...args]).status).not.toBe(0);
   rmSync(join(out,'extra.txt'));
   const manifest=join(out,'MID-source-zip-evidence.json'),raw=readFileSync(manifest,'utf8');
   writeFileSync(manifest,raw.replace('"productionApproved": false','"productionApproved": true'));
   expect(run(repo,'python3',[intake,...args]).status).not.toBe(0);
   writeFileSync(manifest,raw.replace('"zipBytes":','"zipBytes": 1, "zipBytes":'));
   expect(run(repo,'python3',[intake,...args]).status).not.toBe(0);
   writeFileSync(manifest,raw);
   writeFileSync(join(out,'MID-professional-replacement.zip'),'corrupted');
   expect(run(repo,'python3',[intake,...args]).status).not.toBe(0);
   expect(existsSync(out)).toBe(true);
  }finally{rmSync(root,{recursive:true,force:true})}
 },30000);
 it('rejects symlink substitution inside an artifact directory',()=>{
  const root=mkdtempSync(join(tmpdir(),'mid-740-artifact-link-'));
  try{
   mkdirSync(join(root,'artifact'));
   writeFileSync(join(root,'external.zip'),'secret');
   symlinkSync(join(root,'external.zip'),join(root,'artifact','MID-professional-replacement.zip'));
   writeFileSync(join(root,'artifact','MID-source-zip-evidence.json'),'{}');
   const result=run(root,'python3',[intake,'--artifact-dir',join(root,'artifact'),
     '--source-sha','a'.repeat(40),'--repository',root,'--verifier',verifier]);
   expect(result.status).not.toBe(0);
  }finally{rmSync(root,{recursive:true,force:true})}
 });
});
