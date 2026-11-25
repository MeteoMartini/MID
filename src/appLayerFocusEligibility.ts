/**
 * Shared eligibility predicate for the MID dialog / full-screen focus stack.
 * No listeners or layout polling: callers evaluate this only when a layer
 * opens or receives a Tab key, never on scroll, resize or animation frames.
 */
export type AppLayerFocusFacts={
 tabIndex:number;
 nativeDisabled:boolean;
 hiddenTree:boolean;
 inertTree:boolean;
 hasVisibleBox:boolean;
 display:string;
 visibility:string;
};

/** The natural Tab sequence excludes tabindex<0. An explicitly declared
 * autofocus target may use tabindex=-1, but still must be visibly rendered. */
export function appLayerFocusEligible(facts:AppLayerFocusFacts,allowProgrammatic=false):boolean{
 if(!Number.isSafeInteger(facts.tabIndex))return false;
 if(!allowProgrammatic&&facts.tabIndex<0)return false;
 if(facts.nativeDisabled||facts.hiddenTree||facts.inertTree||!facts.hasVisibleBox)return false;
 return facts.display!=='none'&&facts.visibility==='visible';
}

/** Browser adapter: inspect an actual HTMLElement in its present CSS/DOM state.
 * Disabled fieldset descendants are caught by :disabled. Hidden/inert ancestors
 * are checked, rather than only the element's own ARIA attributes. */
export function appLayerFocusEligibleElement(element:HTMLElement,allowProgrammatic=false):boolean{
 const computed=window.getComputedStyle(element);
 return appLayerFocusEligible({
  tabIndex:element.tabIndex,
  nativeDisabled:element.matches(':disabled'),
  hiddenTree:element.closest('[aria-hidden="true"],[hidden]')!==null,
  inertTree:element.closest('[inert]')!==null,
  hasVisibleBox:Array.from(element.getClientRects()).some(rect=>rect.width>0&&rect.height>0),
  display:computed.display,
  visibility:computed.visibility
 },allowProgrammatic);
}

const selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),summary,[contenteditable]';
function sequentialIndex(element:HTMLElement){
 if(!element.hasAttribute('tabindex')&&element.isContentEditable&&!element.parentElement?.isContentEditable)return 0;
 return element.tabIndex;
}
function eligibleTab(element:HTMLElement){
 if(sequentialIndex(element)<0)return false;
 // A closed details subtree can have nonempty client rectangles but is not operable.
 for(let details=element.closest('details:not([open])');details;details=details.parentElement?.closest('details:not([open])')??null){
  const summary=Array.from(details.children).find(child=>child.tagName==='SUMMARY');
  if(!summary?.contains(element))return false;
 }
 return appLayerFocusEligibleElement(element,true);
}
function sameRadioGroup(a:HTMLElement,b:HTMLElement){return a instanceof HTMLInputElement&&b instanceof HTMLInputElement&&a.type==='radio'&&b.type==='radio'&&a.name!==''&&a.name===b.name&&a.form===b.form&&a.getRootNode()===b.getRootNode()}
export function tabCandidates(layer:HTMLElement,reverse=false){
 const ordered=Array.from(layer.querySelectorAll<HTMLElement>(selector)).filter(eligibleTab).map((element,index)=>({element,index})).sort((a,b)=>{const pa=sequentialIndex(a.element)>0?sequentialIndex(a.element):Infinity,pb=sequentialIndex(b.element)>0?sequentialIndex(b.element):Infinity;return (pa===pb?0:pa-pb)||a.index-b.index}).map(x=>x.element);
 const groups=new Map<HTMLFormElement|null,Map<string,HTMLInputElement[]>>();
 for(const el of ordered){if(!(el instanceof HTMLInputElement)||el.type!=='radio'||el.name==='')continue;let names=groups.get(el.form);if(!names){names=new Map();groups.set(el.form,names)}const group=names.get(el.name);if(group)group.push(el);else names.set(el.name,[el])}
 const excluded=new Set<HTMLElement>();
 for(const names of groups.values())for(const group of names.values()){const selected=group.find(el=>el.checked)??(reverse?group[group.length-1]:group[0]);for(const el of group)if(el!==selected)excluded.add(el)}
 return ordered.filter(el=>!excluded.has(el));
}
export function moveTab(layer:HTMLElement,reverse=false){
 const items=tabCandidates(layer,reverse),active=layer.ownerDocument.activeElement;
 const fallback=()=>{if(!layer.hasAttribute('tabindex'))layer.setAttribute('tabindex','-1');layer.focus()};
 if(!items.length){fallback();return}
 let index=items.findIndex(el=>el===active||active instanceof HTMLElement&&sameRadioGroup(el,active));
 if(index<0&&active instanceof HTMLElement&&layer.contains(active)){
  // For a programmatically focused heading, retain the local DOM starting point.
  const directed=reverse?[...items].reverse():items;
  const next=directed.find(el=>Boolean(active.compareDocumentPosition(el)&(reverse?Node.DOCUMENT_POSITION_PRECEDING:Node.DOCUMENT_POSITION_FOLLOWING)));
  if(next)index=(items.indexOf(next)+(reverse?1:-1)+items.length)%items.length;
 }
 for(let step=1;step<=items.length;step++){
  const next=index<0?(reverse?items.length-step:step-1):(index+(reverse?-step:step)+items.length)%items.length;
  const candidate=items[next];
  if(!candidate.isConnected||!layer.contains(candidate)||!eligibleTab(candidate))continue;
  candidate.focus();if(layer.ownerDocument.activeElement===candidate)return;
 }
 fallback();
}
