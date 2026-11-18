import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mid-c56-anchor-'));
try{
 const result=await build({entryPoints:['src/useBottomNavigationAnchor.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'effect',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useLayoutEffect=fn=>{globalThis.cleanup=fn()};'}))}}]});
 const path=join(dir,'anchor.mjs');await writeFile(path,result.outputFiles[0].text);
 const {useBottomNavigationAnchor}=await import(pathToFileURL(path));
 const events=()=>({listeners:new Map(),addEventListener(k,fn){this.listeners.set(k,fn)},removeEventListener(k){this.listeners.delete(k)}});
 const viewport=Object.assign(events(),{height:844,offsetTop:0,scale:1}),mobile=Object.assign(events(),{matches:true});
 let frame=null,cssReads=0,propertyWrites=0;
 const attrs=new Map(),props=new Map();
 const serialize=()=>[...props.entries()].map(([key,p])=>`${key}:${p.value}${p.priority?' !'+p.priority:''};`).join('');
 const node={
  dataset:{},
  getAttribute:k=>k==='style'?(props.size?serialize():attrs.has('style')?attrs.get('style'):null):attrs.get(k)??null,
  removeAttribute(k){if(k==='style'){props.clear();propertyWrites++;attrs.delete('style')}else attrs.delete(k)},
  style:{
   getPropertyValue(k){return props.get(k)?.value??''},
   getPropertyPriority(k){return props.get(k)?.priority??''},
   setProperty(k,v,priority=''){props.set(k,{value:String(v),priority:String(priority)});attrs.set('style',serialize());propertyWrites++},
   removeProperty(k){const previous=props.get(k)?.value??'';props.delete(k);attrs.set('style',serialize());propertyWrites++;return previous}
  }
 };
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:5}});
 globalThis.window=Object.assign(events(),{
  innerWidth:390,innerHeight:844,scrollY:0,visualViewport:viewport,matchMedia:()=>mobile,
  requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame:()=>{frame=null}
 });
 globalThis.getComputedStyle=element=>{cssReads++;return {bottom:element.style.getPropertyValue('bottom')||'12px'}};
 const flush=()=>{const f=frame;frame=null;f?.()};
 const dispatch=(emitter,name)=>{const fn=emitter.listeners.get(name);assert.ok(fn,'event listener missing: '+name);fn();flush()};

 useBottomNavigationAnchor({current:node},true);flush();
 assert.equal(node.getAttribute('style'),null,'Normal viewport keeps canonical fixed CSS');
 assert.ok(!window.listeners.has('scroll'),'Compositor scroll never requires document repositioning');
 assert.equal(propertyWrites,0,'Normal viewport must not write inline styles');
 for(let i=0;i<12;i++)dispatch(viewport,'scroll');
 assert.equal(propertyWrites,0,'Idle visual viewport scrolling must not mutate inline styles');

 window.scrollY=1800;dispatch(viewport,'scroll');
 assert.equal(node.getAttribute('style'),null,'Deep scroll must not introduce absolute/top overrides');
 viewport.height=400;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('bottom'),'456px','Keyboard inset preserves base 12px CSS gap');
 assert.equal(node.style.getPropertyPriority('bottom'),'important','Keyboard override remains important');
 assert.equal(node.dataset.viewportAnchor,'visual','Viewport anchor set');
 const writesWhileKeyboard=propertyWrites,readsWhileKeyboard=cssReads;
 for(let i=0;i<20;i++)dispatch(viewport,'scroll');
 assert.equal(propertyWrites,writesWhileKeyboard,'Unchanged keyboard geometry must not re-write inline style');
 assert.equal(cssReads,readsWhileKeyboard,'Unchanged geometry must not re-run expensive computed-style read');
 viewport.height=390;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('bottom'),'466px','True inset change must update bottom exactly');
 viewport.height=844;dispatch(viewport,'resize');
 assert.equal(node.getAttribute('style'),null,'Keyboard close restores CSS gap without empty style attribute');
 assert.equal(node.dataset.viewportAnchor,undefined);
 viewport.height=422;viewport.scale=2;dispatch(viewport,'resize');
 assert.equal(node.getAttribute('style'),null,'Pinch zoom is not a keyboard inset');
 viewport.scale=1;mobile.matches=false;dispatch(mobile,'change');
 assert.equal(node.getAttribute('style'),null,'Desktop breakpoint retains canonical fixed CSS');
 mobile.matches=true;dispatch(mobile,'change');
 viewport.height=400;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('bottom'),'456px');
 viewport.height=844;dispatch(viewport,'resize');
 viewport.height=400;dispatch(viewport,'resize');globalThis.cleanup();flush();
 assert.equal(node.getAttribute('style'),null,'Unmount restores only owned inline bottom');
 assert.equal(viewport.listeners.size,0);assert.equal(window.listeners.size,0);assert.equal(mobile.listeners.size,0);

 // Externally maintained inline styles MUST survive every viewport event and
 // hook cleanup; previously restore() reset the entire original style attribute.
 node.style.setProperty('color','red');
 viewport.height=844;mobile.matches=true;viewport.scale=1;
 useBottomNavigationAnchor({current:node},true);flush();
 viewport.height=400;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('color'),'red');
 node.style.setProperty('color','blue');
 const changedWrites=propertyWrites;
 for(let i=0;i<15;i++)dispatch(viewport,'scroll');
 assert.equal(propertyWrites,changedWrites,'No keyboard-event churn after another owner changes color');
 viewport.height=390;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('color'),'blue','New unrelated inline value must survive re-anchoring');
 viewport.height=844;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('color'),'blue','Keyboard close must not overwrite newer inline state');
 assert.equal(node.style.getPropertyValue('bottom'),'');
 globalThis.cleanup();flush();
 assert.equal(node.style.getPropertyValue('color'),'blue','Cleanup must preserve other owners');
 assert.equal(viewport.listeners.size,0);assert.equal(window.listeners.size,0);assert.equal(mobile.listeners.size,0);

 // A preexisting inline bottom (with its priority) must be restored exactly.
 node.style.setProperty('bottom','22px','important');
 useBottomNavigationAnchor({current:node},true);flush();
 viewport.height=400;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('bottom'),'466px','Inset added to original inline bottom, not to prior override');
 viewport.height=844;dispatch(viewport,'resize');
 assert.equal(node.style.getPropertyValue('bottom'),'22px');
 assert.equal(node.style.getPropertyPriority('bottom'),'important');
 globalThis.cleanup();flush();
 assert.equal(node.style.getPropertyValue('color'),'blue');
 assert.equal(node.style.getPropertyValue('bottom'),'22px');
 assert.equal(viewport.listeners.size,0);assert.equal(window.listeners.size,0);assert.equal(mobile.listeners.size,0);
 console.log('PASS C56 anchor: original fixed CSS, deep scroll, viewport writes coalesced, keyboard open/close, pinch zoom, breakpoint, other inline owners, initial bottom and cleanup.');
}finally{await rm(dir,{recursive:true,force:true})}
