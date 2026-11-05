import {useLayoutEffect,type RefObject} from 'react';

/** Keep the body portal compositor-fixed while iOS scrolls. Only compensate
 * for a reduced, unzoomed visual viewport (e.g. an open software keyboard). */
export function useBottomNavigationAnchor(ref:RefObject<HTMLDivElement|null>,enabled:boolean){
 useLayoutEffect(()=>{
  if(!enabled||typeof window==='undefined'||!(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)))return;
  const node=ref.current;if(!node)return;
  const original=node.getAttribute('style'),viewport=window.visualViewport,mobile=window.matchMedia('(max-width:850px)');
  let frame=0,disposed=false;
  const restore=()=>{if(original===null)node.removeAttribute('style');else node.setAttribute('style',original);delete node.dataset.viewportAnchor};
  const update=()=>{
   frame=0;if(disposed)return;restore();if(!mobile.matches)return;
   // A document-coordinate top lags compositor scrolling and can strand the bar
   // in the page. Never replace fixed positioning with an absolute scrollY top.
   const gap=parseFloat(getComputedStyle(node).bottom)||0;
   const inset=viewport&&Math.abs(viewport.scale-1)<.01?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
   if(inset>1){node.style.setProperty('bottom',`${gap+inset}px`,'important');node.dataset.viewportAnchor='visual'}
  };
  const schedule=()=>{if(!frame&&!disposed)frame=window.requestAnimationFrame(update)};
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);viewport?.addEventListener('scroll',schedule,{passive:true});viewport?.addEventListener('resize',schedule,{passive:true});mobile.addEventListener('change',schedule);schedule();
  return()=>{disposed=true;if(frame)window.cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);viewport?.removeEventListener('scroll',schedule);viewport?.removeEventListener('resize',schedule);mobile.removeEventListener('change',schedule);restore()};
 },[enabled,ref]);
}
