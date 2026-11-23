/** MID Design 1.13: QA-only wiring guard for the shared dialog focus predicate. */
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const portal=readFileSync(new URL('../../src/AppPortalPopover.tsx',import.meta.url),'utf8');
describe('MID Design 1.13 shared dialog focus wiring',()=>{
 it('uses the shared predicate for natural tab order, not a permissive rect-count test',()=>{
  expect(portal).toContain("import {appLayerFocusEligibleElement} from './appLayerFocusEligibility'");
  expect(portal).toContain(".filter(element=>appLayerFocusEligibleElement(element))");
  expect(portal).not.toContain("element.getClientRects().length>0||element===document.activeElement");
 });
 it('chooses the first *eligible* explicitly marked autofocus target',()=>{
  expect(portal).toContain(".find(element=>appLayerFocusEligibleElement(element,true))");
  expect(portal).not.toContain("const preferred=layer.querySelector<HTMLElement>('[autofocus],[data-mid-autofocus]')");
 });
 it('does not steal focus from an eligible control already inside the opened layer',()=>{
  expect(portal).toContain("layer.contains(document.activeElement)");
  expect(portal).toContain("if(alreadyFocused)return;");
 });
 it('retains Escape, bidirectional Tab containment and prior-trigger restoration',()=>{
  for(const snippet of ["event.key==='Escape'","event.shiftKey","last.focus({preventScroll:true})","first.focus({preventScroll:true})","trigger.focus({preventScroll:true})","appFocusLayerStack.push(record)"])expect(portal).toContain(snippet);
 });
});
