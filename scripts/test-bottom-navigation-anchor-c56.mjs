import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mid-c56-anchor-'));
try{
 const result=await build({entryPoints:['src/useBottomNavigationAnchor.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'effect',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useLayoutEffect=fn=>{globalThis.cleanup=fn()};'}))}}]});
 const path=join(dir,'anchor.mjs');await writeFile(path,result.outputFiles[0].text);const {useBottomNavigationAnchor}=await import(pathToFileURL(path));
 const events=()=>({listeners:new Map(),addEventListener(k,fn){this.listeners.set(k,fn)},removeEventListener(k){this.listeners.delete(k)}});
 const viewport=Object.assign(events(),{height:844,offsetTop:0,scale:1}),mobile=Object.assign(events(),{matches:true});let frame,style=null;
 const node={dataset:{},getAttribute:()=>style,removeAttribute:()=>{style=null},setAttribute:(k,v)=>{style=v},style:{setProperty:(k,v)=>{style=(style||'')+`${k}:${v};`}}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:5}});
 globalThis.window=Object.assign(events(),{innerHeight:844,scrollY:0,visualViewport:viewport,matchMedia:()=>mobile,requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame:()=>{frame=null}});
 globalThis.getComputedStyle=()=>({bottom:'12px'});const flush=()=>{const f=frame;frame=null;f?.()};
 useBottomNavigationAnchor({current:node},true);flush();assert.equal(style,null,'Normal viewport keeps canonical fixed CSS');assert.ok(!window.listeners.has('scroll'),'Compositor scroll never requires document repositioning');
 window.scrollY=1800;viewport.listeners.get('scroll')();flush();assert.equal(style,null,'Scroll must not introduce absolute/top overrides');
 viewport.height=400;viewport.listeners.get('resize')();flush();assert.equal(style,'bottom:456px;');
 viewport.height=844;viewport.listeners.get('resize')();flush();assert.equal(style,null,'Keyboard close restores CSS gap');
 viewport.height=422;viewport.scale=2;viewport.listeners.get('resize')();flush();assert.equal(style,null,'Pinch zoom is not a keyboard inset');
 viewport.scale=1;mobile.matches=false;mobile.listeners.get('change')();flush();assert.equal(style,null,'Tablet/desktop breakpoint restores CSS');
 mobile.matches=true;viewport.listeners.get('resize')();globalThis.cleanup();flush();assert.equal(style,null);assert.equal(viewport.listeners.size,0);assert.equal(window.listeners.size,0);assert.equal(mobile.listeners.size,0);
 console.log('PASS C56 anchor: fixed CSS, deep scroll, keyboard open/close, pinch zoom, breakpoint and cleanup.');
}finally{await rm(dir,{recursive:true,force:true})}
