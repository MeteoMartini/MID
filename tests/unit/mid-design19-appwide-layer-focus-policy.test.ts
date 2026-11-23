import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {appLayerFocusEligible,appLayerFocusEligibleElement,type AppLayerFocusFacts}
 from '../../src/appLayerFocusEligibility';

const good=():AppLayerFocusFacts=>({
 tabIndex:0,nativeDisabled:false,hiddenTree:false,inertTree:false,
 hasVisibleBox:true,display:'block',visibility:'visible',
});
const eligible=(changes:Partial<AppLayerFocusFacts>={},allowProgrammatic=false)=>
 appLayerFocusEligible({...good(),...changes},allowProgrammatic);

describe('MID Design19 – focus eligibility policy for shared app dialogs',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it('keeps visible enabled sequential controls accessible',()=>{
  expect(eligible()).toBe(true);
  expect(eligible({tabIndex:3})).toBe(true);
 });
 it('excludes negative tabindex from natural Tab traversal, including -2',()=>{
  expect(eligible({tabIndex:-1})).toBe(false);
  expect(eligible({tabIndex:-2})).toBe(false);
 });
 it('permits an explicitly marked, rendered programmatic autofocus heading',()=>{
  expect(eligible({tabIndex:-1},true)).toBe(true);
  expect(eligible({tabIndex:-1,visibility:'hidden'},true)).toBe(false);
  expect(eligible({tabIndex:-1,inertTree:true},true)).toBe(false);
 });
 it('excludes native-disabled controls and disabled fieldset descendants',()=>{
  expect(eligible({nativeDisabled:true})).toBe(false);
  // The browser adapter uses :disabled, covering fieldset semantics.
  const code=readFileSync('src/appLayerFocusEligibility.ts','utf8');
  expect(code).toContain("element.matches(':disabled')");
 });
 it('excludes aria-hidden and inert ancestors rather than own attrs only',()=>{
  expect(eligible({hiddenTree:true})).toBe(false);
  expect(eligible({inertTree:true})).toBe(false);
  const code=readFileSync('src/appLayerFocusEligibility.ts','utf8');
  expect(code).toContain("element.closest('[aria-hidden=\"true\"],[hidden]')");
  expect(code).toContain("element.closest('[inert]')");
 });
 it('does not mistake clientRects count for visible geometry',()=>{
  expect(eligible({hasVisibleBox:false})).toBe(false);
  const code=readFileSync('src/appLayerFocusEligibility.ts','utf8');
  expect(code).toContain('rect.width>0&&rect.height>0');
 });
 it('rejects display-none, visibility-hidden and collapsed cases',()=>{
  expect(eligible({display:'none'})).toBe(false);
  expect(eligible({visibility:'hidden'})).toBe(false);
  expect(eligible({visibility:'collapse'})).toBe(false);
 });
 it('rejects bad tabIndex input and incomplete CSS visibility evidence',()=>{
  expect(eligible({tabIndex:NaN})).toBe(false);
  expect(eligible({tabIndex:Infinity})).toBe(false);
  expect(eligible({visibility:''})).toBe(false);
 });
 it('uses DOM facts to decide, without moving focus or mutating the element',()=>{
  vi.stubGlobal('window',{getComputedStyle:()=>({display:'block',visibility:'visible'})});
  const element={
   tabIndex:0,
   matches:(query:string)=>query===':disabled'?false:false,
   closest:(query:string)=>query==='[inert]'?null:null,
   getClientRects:()=>[{width:44,height:44}],
  } as unknown as HTMLElement;
  expect(appLayerFocusEligibleElement(element)).toBe(true);
  expect(element.tabIndex).toBe(0);
 });
 it('browser adapter catches a hidden ancestor and physically collapsed focus target',()=>{
  vi.stubGlobal('window',{getComputedStyle:()=>({display:'block',visibility:'visible'})});
  const el={
   tabIndex:0,matches:()=>false,
   closest:(query:string)=>query==='[aria-hidden="true"],[hidden]'?{}:null,
   getClientRects:()=>[{width:44,height:44}],
  } as unknown as HTMLElement;
  expect(appLayerFocusEligibleElement(el)).toBe(false);
  const collapsed={...el,closest:()=>null,getClientRects:()=>[{width:0,height:18}]} as unknown as HTMLElement;
  expect(appLayerFocusEligibleElement(collapsed)).toBe(false);
 });
 it('is a bounded, non-polling helper with no runtime listeners or browser deployment',()=>{
  const code=readFileSync('src/appLayerFocusEligibility.ts','utf8');
  expect(code).not.toMatch(/addEventListener|MutationObserver|ResizeObserver|setInterval|requestAnimationFrame|fetch\(/);
 });
});
