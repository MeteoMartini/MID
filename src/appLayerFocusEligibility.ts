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
