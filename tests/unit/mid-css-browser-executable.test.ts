import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {midCssQaBrowserExecutable,MID_CSS_QA_SYSTEM_CHROMIUM_CANDIDATES} from '../../scripts/lib/cssQaBrowserExecutable.mjs';

describe('MID CSS browser QA: use real system Chrome, NEVER skip pixel checks',()=>{
 it('resolves only existing executables and fails closed for invalid explicit paths',()=>{
  expect(midCssQaBrowserExecutable({env:{},probe:()=>false})).toBeNull();
  expect(midCssQaBrowserExecutable({env:{},probe:path=>path==='/usr/bin/chromium'})).toBe('/usr/bin/chromium');
  expect(midCssQaBrowserExecutable({env:{},probe:path=>path==='/usr/bin/google-chrome'})).toBe('/usr/bin/google-chrome');
  expect(midCssQaBrowserExecutable({env:{MID_BROWSER_EXECUTABLE:'/tmp/reviewed-browser'},probe:path=>path==='/tmp/reviewed-browser'})).toBe('/tmp/reviewed-browser');
  expect(()=>midCssQaBrowserExecutable({env:{MID_BROWSER_EXECUTABLE:'/tmp/not-executable'},probe:()=>false})).toThrow(/not executable/);
  expect(MID_CSS_QA_SYSTEM_CHROMIUM_CANDIDATES).toContain('/usr/bin/chromium');
 });
 it('retains all real browser pixel, CSS coverage and parity assertions in the unchanged QA journey',()=>{
  const text=readFileSync('scripts/verify-module-css-browser-0985170.mjs','utf8');
  expect(text).toContain("const cssQaBrowserExecutable=midCssQaBrowserExecutable()");
  expect(text).toContain("if(process.env.GITHUB_ACTIONS==='true'&&!cssQaBrowserExecutable)execFileSync");
  expect(text).toContain("const browser=await chromium.launch({executablePath:cssQaBrowserExecutable||undefined");
  for(const must of ['startCssRuleUsageTracking','collectCssRuleUsage','assert.deepEqual(await snapshot(current.page),await snapshot(reference.page)','assert.deepEqual(current.errors,[]','await browser.close()'])expect(text).toContain(must);
  expect(text).not.toContain('process.exit(0)');
 });
});
