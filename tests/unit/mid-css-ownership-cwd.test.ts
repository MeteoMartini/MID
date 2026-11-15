import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

describe('MID mandatory CSS ownership manifest – cwd independence',()=>{
 it('scans all canonical CSS sources even when launched outside the repository and outside CI',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
  const script=join(root,'scripts/test-css-ownership-0985484.mjs');
  const foreignCwd=mkdtempSync(join(tmpdir(),'mid-css-own-cwd-'));
  try{
   const proc=spawnSync(process.execPath,[script],{
    cwd:foreignCwd,env:{...process.env,CI:'false'},
    encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024
   });
   if(proc.error)throw proc.error;
   expect(proc.status,proc.stderr||proc.stdout).toBe(0);
   expect(proc.stdout).toContain('PASS real canonical CSS read-only scan on current repository');
   expect(proc.stdout).toMatch(/"sourceCount":68/);
   expect(proc.stdout).toContain('PASS CSS ownership collision');
  }finally{rmSync(foreignCwd,{recursive:true,force:true})}
 });
});
