import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const root=fileURLToPath(new URL('../../',import.meta.url));

describe('MID private IR10.8/GSP 15-minute raster admission (no release)',()=>{
 it('executes all adversarial Python source/PNG/zlib/NoData checks',()=>{
  const result=spawnSync('python3',[
   '-m','unittest','discover','-s','tools/ruc',
   '-p','test_qa_ir108_gsp_rendered_pair.py','-v'
  ],{
   cwd:root,encoding:'utf8',timeout:20_000,maxBuffer:512*1024,
   env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toContain('Ran 17 tests');
  expect(result.stderr).toMatch(/\bOK\b/);
 });
});
