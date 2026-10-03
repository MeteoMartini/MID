import {useLayoutEffect,type RefObject} from 'react';

/** Avoid WebKit's stale fixed-layer offset after keyboard/scroll transitions.
 * The existing body portal and CSS own appearance and safe-area spacing.
 * Only narrow iOS surfaces use a document-coordinate anchor. */
export function useBottomNavigationAnchor(ref:RefObject<HTMLDivElement|null>,enabled:boolean){
 useLayoutEffect(()=>{
  if(!enabled||typeof window==='undefined'||!(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)))return;
  const node=ref.current;if(!node)return;
  const original=node.getAttribute('style'),viewport=window.visualViewport,mobile=window.matchMedia('(max-width:850px)');
  let frame=0,disposed=false;
  const restore=()=>{if(original===null)node.removeAttribute('style');else node.setAttribute('style',original);delete node.dataset.viewportAnchor};
  const update=()=>{
   frame=0;if(disposed)return;if(!mobile.matches){restore();return}
   // Read the canonical CSS bottom gap before replacing the fixed anchor.
   if(node.dataset.viewportAnchor!=='document')node.dataset.bottomGap=String(parseFloat(getComputedStyle(node).bottom)||0);
   const gap=Number(node.dataset.bottomGap)||0,height=node.getBoundingClientRect().height;
   const visualHeight=viewport?.height||window.innerHeight;
   // Clamp stale iOS offsetTop after the keyboard closes; never trust pageTop.
   const offset=Math.max(0,Math.min(viewport?.offsetTop||0,Math.max(0,window.innerHeight-visualHeight)));
   const parent=node.offsetParent as HTMLElement|null,parentTop=parent&&getComputedStyle(parent).position!=='static'?parent.getBoundingClientRect().top+window.scrollY:0;
   const top=window.scrollY+offset+visualHeight-height-gap-parentTop;
   node.style.setProperty('position','absolute','important');node.style.setProperty('top',`${top}px`,'important');node.style.setProperty('bottom','auto','important');node.style.setProperty('transform','none','important');node.style.setProperty('transition','none','important');node.dataset.viewportAnchor='document';
  };
  const schedule=()=>{if(!frame&&!disposed)frame=window.requestAnimationFrame(update)};
  const resize=()=>{restore();schedule()};
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);observer?.observe(node);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize,{passive:true});window.addEventListener('pageshow',resize);viewport?.addEventListener('scroll',schedule,{passive:true});viewport?.addEventListener('resize',resize,{passive:true});mobile.addEventListener('change',resize);schedule();
  return()=>{disposed=true;if(frame)window.cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);window.removeEventListener('pageshow',resize);viewport?.removeEventListener('scroll',schedule);viewport?.removeEventListener('resize',resize);mobile.removeEventListener('change',resize);restore();delete node.dataset.bottomGap};
 },[enabled,ref]);
}
