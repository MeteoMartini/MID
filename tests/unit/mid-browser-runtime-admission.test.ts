import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {verifyMidBrowserEngines,midBrowserNeedsHostDependencies} from '../../tools/ci/browser-runtime-admission.mjs';

const make=(broken?:'chromium'|'webkit'|'dom')=>{
 const calls:string[]=[];
 const engine=(name:'chromium'|'webkit')=>({
  launch:vi.fn(async(options:any)=>{
   calls.push('launch:'+name);
   expect(options).toMatchObject({headless:true,timeout:15000});
   if(broken===name)throw Error('Host system is missing dependencies to run browsers');
   return{
    newPage:async()=>({
     goto:async()=>{calls.push('navigate:'+name)},
     locator:()=>({textContent:async()=>broken==='dom'?'wrong':'MID browser ready'})
    }),
    close:async()=>{calls.push('close:'+name)}
   };
  })
 });
 return {playwright:{chromium:engine('chromium'),webkit:engine('webkit')},calls};
};
describe('MID pinned Chromium + WebKit smoke-before-apt',()=>{
 it('admits only real launch and DOM for both engines',async()=>{
  const {playwright,calls}=make();
  expect(await verifyMidBrowserEngines(playwright)).toBe(true);
  expect(calls).toEqual([
   'launch:chromium','navigate:chromium','close:chromium',
   'launch:webkit','navigate:webkit','close:webkit'
  ]);
 });
 it('denies missing WebKit even when Chromium works',async()=>{
  const {playwright,calls}=make('webkit');
  await expect(verifyMidBrowserEngines(playwright)).rejects.toThrow('missing dependencies');
  expect(calls).toContain('close:chromium');
  expect(calls).toContain('launch:webkit');
 });
 it('denies wrong DOM, missing engine and missing API',async()=>{
  await expect(verifyMidBrowserEngines(make('dom').playwright)).rejects.toThrow('DOM_SMOKE_FAILED');
  await expect(verifyMidBrowserEngines({chromium:make().playwright.chromium})).rejects.toThrow('ENGINE_UNAVAILABLE');
  await expect(verifyMidBrowserEngines(null)).rejects.toThrow('API_UNAVAILABLE');
 });
 it.each([
  ['Host system is missing dependencies to run browsers',true],
  ['error while loading shared libraries: libwebkit2gtk.so: cannot open shared object file',true],
  ['libicuuc.so.74: cannot open shared object file',true],
  ['BrowserType.launch: Timeout 15000ms exceeded',false],
  ['Executable does not exist at /tmp/chromium',false],
  ['Temporary failure resolving archive.ubuntu.com',false],
  ['AssertionError: DOM regression',false],
 ])('classifies missing native dependencies but not other errors: %s',(message,expected)=>{
  expect(midBrowserNeedsHostDependencies(Error(message))).toBe(expected);
 });
 it('retains pinned versions and mandatory browser test contract',()=>{
  const code=readFileSync('scripts/prepare-browser-runtimes.mjs','utf8');
  expect(code).toContain('playwright@1.56.1');
  expect(code).toContain("'install','chromium','webkit'");
  expect(code).toContain("'install-deps','chromium','webkit'");
  expect(code).toContain('await verifyMidBrowserEngines(playwright)');
  expect(code).toContain('if(!midBrowserNeedsHostDependencies(error))throw error');
  expect(code.indexOf("'install','chromium','webkit'")).toBeLessThan(code.indexOf("'install-deps','chromium','webkit'"));
 });
});
