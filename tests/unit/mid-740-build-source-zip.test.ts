import {describe,it,expect} from 'vitest';
import {chmodSync,mkdtempSync,mkdirSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const builder=resolve('tools/ci/mid-740-build-source-zip.py');
const verifier=resolve('tools/ci/verify-source-release-zip.py');
function exec(cwd:string,cmd:string,args:string[]){
 const p=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:25000});
 if(p.error)throw p.error;
 return p;
}
describe('MID #740: immutable Git source ZIP artifact builder (no workflow dispatch)',()=>{
 it('emits byte- and executable-mode-matched ZIP from commit tree, not a mutable worktree',()=>{
  const root=mkdtempSync(join(tmpdir(),'mid-740-git-zip-'));
  try{
   const dir=join(root,'repo');
   mkdirSync(dir);
   mkdirSync(join(dir,'.github','workflows'),{recursive:true});
   mkdirSync(join(dir,'dist'));
   writeFileSync(join(dir,'alpha.txt'),'alpha\n');
   writeFileSync(join(dir,'script.sh'),'#!/bin/sh\nexit 0\n');chmodSync(join(dir,'script.sh'),0o755);
   writeFileSync(join(dir,'.github','workflows','trusted.yml'),'not in release');
   writeFileSync(join(dir,'dist','build.txt'),'excluded output');
   for(const args of [
    ['init','--object-format=sha1','-q'],['add','.'],
    ['-c','user.name=MID QA','-c','user.email=qa@example.invalid',
     '-c','commit.gpgsign=false','commit','-qm','fixture']
   ])expect(exec(dir,'git',args).status).toBe(0);
   const sha=exec(dir,'git',['rev-parse','HEAD']).stdout.trim();
   const archive=join(root,'release');
   const build=exec(dir,'python3',[builder,'--repository',dir,
    '--source-sha',sha,'--destination',archive]);
   expect(build.status,build.stderr).toBe(0);
   const manifest=JSON.parse(readFileSync(join(archive,'MID-source-zip-evidence.json'),'utf8'));
   expect(manifest).toMatchObject({sourceMergeSha:sha,gitSourceFiles:2,
    productionApproved:false,releaseAuthorized:false});
   const actual=exec(dir,'python3',[verifier,join(archive,'MID-professional-replacement.zip'),sha]);
   expect(actual.status,actual.stderr).toBe(0);
   expect(actual.stdout).toContain('Verified 2 ZIP files');
   // Post-commit worktree mutation must NOT change the immutable ZIP.
   writeFileSync(join(dir,'alpha.txt'),'tampered after commit');
   const second=exec(dir,'python3',[builder,'--repository',dir,
    '--source-sha',sha,'--destination',join(root,'second')]);
   expect(second.status,second.stderr).toBe(0);
   const unchanged=JSON.parse(readFileSync(join(root,'second','MID-source-zip-evidence.json'),'utf8'));
   expect(unchanged.zipSha256).toBe(manifest.zipSha256);
   // ZIP is a standalone QA output; it is NEVER pushed into main.
   expect(exec(dir,'git',['status','--porcelain']).stdout).toContain('alpha.txt');
   expect(exec(dir,'python3',[builder,'--repository',dir,'--source-sha',sha,
    '--destination',archive]).status).not.toBe(0);
   expect(exec(dir,'python3',[builder,'--repository',dir,'--source-sha','0'.repeat(40),
    '--destination',join(root,'wrong')]).status).not.toBe(0);
   expect(exec(dir,'python3',[builder,'--repository',dir,'--source-sha','malformed',
    '--destination',join(root,'malformed')]).status).not.toBe(0);
  }finally{rmSync(root,{recursive:true,force:true})}
 },30000);
 it('rejects Git symlinks and leaves no archive on failure',()=>{
  const root=mkdtempSync(join(tmpdir(),'mid-740-link-'));
  try{
   mkdirSync(join(root,'repo'));
   const dir=join(root,'repo');
   writeFileSync(join(dir,'original.txt'),'safe');
   const symlink=exec(dir,'ln',['-s','original.txt','link.txt']);
   expect(symlink.status,symlink.stderr).toBe(0);
   for(const args of [
    ['init','--object-format=sha1','-q'],['add','.'],
    ['-c','user.name=MID QA','-c','user.email=qa@example.invalid',
     '-c','commit.gpgsign=false','commit','-qm','fixture']
   ])expect(exec(dir,'git',args).status).toBe(0);
   const sha=exec(dir,'git',['rev-parse','HEAD']).stdout.trim();
   const target=join(root,'no-release');
   const out=exec(dir,'python3',[builder,'--repository',dir,
    '--source-sha',sha,'--destination',target]);
   expect(out.status).not.toBe(0);
   expect(exec(dir,'test',['-e',target]).status).not.toBe(0);
  }finally{rmSync(root,{recursive:true,force:true})}
 },15000);
});
