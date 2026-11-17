import {useLayoutEffect,type RefObject} from 'react';

/** Keep the body portal compositor-fixed while iOS scrolls. Only compensate
 * for a reduced, unzoomed visual viewport (e.g. an open software keyboard). */
export function useBottomNavigationAnchor(ref:RefObject<HTMLDivElement|null>,enabled:boolean){
 useLayoutEffect(()=>{
  if(!enabled||typeof window==='undefined'||!(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)))return;
  const node=ref.current;if(!node)return;
  const initialStyleAttribute=node.getAttribute('style');
  const initialBottom=node.style.getPropertyValue('bottom');
  const initialBottomPriority=node.style.getPropertyPriority('bottom');
  const viewport=window.visualViewport,mobile=window.matchMedia('(max-width:850px)');
  let frame=0,disposed=false,overrideActive=false,lastGeometryKey:string|null=null;

  // Restore only the property owned by this hook. Restoring the entire original
  // style attribute would silently erase unrelated React/DOM inline changes.
  const restore=()=>{
   if(!overrideActive)return;
   if(initialBottom)node.style.setProperty('bottom',initialBottom,initialBottomPriority);
   else node.style.removeProperty('bottom');
   if(initialStyleAttribute===null&&!(node.getAttribute('style')??'').trim())node.removeAttribute('style');
   delete node.dataset.viewportAnchor;
   overrideActive=false;
  };
  const update=()=>{
   frame=0;if(disposed)return;
   const compact=mobile.matches;
   const inset=compact&&viewport&&Math.abs(viewport.scale-1)<.01
    ?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
   // Safari can emit many scroll/resize events for identical visual geometry.
   // Keep the DOM untouched until the inset or layout dimensions really change.
   const geometryKey=`${compact}:${window.innerWidth}:${window.innerHeight}:${inset}`;
   if(geometryKey===lastGeometryKey)return;
   lastGeometryKey=geometryKey;
   restore();
   if(!compact||inset<=1)return;
   // Only measure the canonical CSS gap after the previous override is gone.
   const gap=parseFloat(getComputedStyle(node).bottom)||0;
   node.style.setProperty('bottom',`${gap+inset}px`,'important');
   node.dataset.viewportAnchor='visual';
   overrideActive=true;
  };
  const schedule=()=>{if(!frame&&!disposed)frame=window.requestAnimationFrame(update)};
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  viewport?.addEventListener('scroll',schedule,{passive:true});
  viewport?.addEventListener('resize',schedule,{passive:true});
  mobile.addEventListener('change',schedule);
  schedule();
  return()=>{
   disposed=true;
   if(frame)window.cancelAnimationFrame(frame);
   window.removeEventListener('resize',schedule);
   window.removeEventListener('pageshow',schedule);
   viewport?.removeEventListener('scroll',schedule);
   viewport?.removeEventListener('resize',schedule);
   mobile.removeEventListener('change',schedule);
   restore();
  };
 },[enabled,ref]);
}
