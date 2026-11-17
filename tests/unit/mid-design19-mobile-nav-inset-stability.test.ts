import {execFileSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

describe('MID Design19 – appweite iOS Bottom-Nav ohne redundante Style-Mutationen',()=>{
 it('runs real source through the unchanged C56 geometry contract plus strict new regression cases',()=>{
  const output=execFileSync(process.execPath,['scripts/test-bottom-navigation-anchor-c56.mjs'],{
   cwd:process.cwd(),encoding:'utf8',timeout:45000,env:process.env
  });
  expect(output).toContain('PASS C56 anchor:');
  expect(output).toContain('other inline owners');
  expect(output).toContain('initial bottom and cleanup');
 });
});
