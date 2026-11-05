import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const dir=await mkdtemp(join(process.cwd(),'.dashboard-qa-'));
const original={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
try{
 const hooks=`let cursor=0,slots=[],cleanups=[];export function begin(){cursor=0}export function cleanup(){cleanups.forEach(fn=>fn?.())}export function useRef(value){const i=cursor++;return slots[i]??(slots[i]={current:value})}export function useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next}]}export function useEffect(effect){const i=cursor++;if(!(i in slots)){slots[i]=true;cleanups.push(effect())}}export default{createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}})};`;
 const bundled=await build({stdin:{contents:`export{DashboardModuleSettingsPanel}from'./src/DashboardModuleSettings';export{defaultDashboardModuleSettings}from'./src/dashboardModules';export{begin,cleanup}from'react';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',jsx:'transform',jsxFactory:'React.createElement',inject:[],write:false,plugins:[{name:'test-hooks',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:hooks}));b.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'icons'}));b.onLoad({filter:/.*/,namespace:'icons'},()=>({contents:'export const ChevronDown="icon",ChevronUp="icon",GripVertical="icon",LayoutGrid="icon",RotateCcw="icon";'}));b.onLoad({filter:/DashboardModuleSettings\.tsx$/},async({path})=>({contents:"import React from 'react';\n"+await readFile(path,'utf8'),loader:'tsx'}))}}]});
 const file=join(dir,'panel.mjs');await writeFile(file,bundled.outputFiles[0].text);const mod=await import(pathToFileURL(file));
 let settings=mod.defaultDashboardModuleSettings(),writes=0,frames=new Map(),next=0,targetId='forecast';
 globalThis.requestAnimationFrame=fn=>{frames.set(++next,fn);return next};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.document={elementFromPoint:()=>({closest:()=>({dataset:{dashboardModuleId:targetId}})})};
 const render=()=>{mod.begin();return mod.DashboardModuleSettingsPanel({settings,advancedMode:true,onChange:update=>{settings=typeof update==='function'?update(settings):update;writes++}})};
 const nodes=(n)=>n&&typeof n==='object'?[n,...(n.props?.children??[]).flatMap(nodes)]:[];
 let tree=render(),all=nodes(tree);const row=id=>nodes(tree).find(n=>n.props?.['data-dashboard-module-id']===id);const grip=id=>nodes(row(id)).find(n=>n.props?.className==='dashboard-module-grip');
 const event=(type,pointerId=7)=>({type,pointerId,pointerType:'touch',clientX:10,clientY:10,preventDefault(){},stopPropagation(){},currentTarget:{setPointerCapture(id){assert.equal(id,pointerId)}}});
 grip('current').props.onPointerDown(event('pointerdown'));grip('current').props.onPointerMove(event('pointermove'));assert.equal(frames.size,1);assert.equal(writes,0);
 grip('current').props.onPointerCancel(event('pointercancel'));assert.equal(frames.size,0);assert.equal(writes,0,'Cancellation must not flush a pending reorder');
 tree=render();grip('current').props.onPointerDown(event('pointerdown'));grip('current').props.onPointerMove(event('pointermove'));grip('current').props.onPointerUp(event('pointerup'));assert.equal(settings.order.indexOf('current'),8);assert.equal(writes,1);
 tree=render();const down=nodes(row('current')).find(n=>n.type==='button'&&n.props['aria-label']?.includes('nach unten'));down.props.onClick();tree=render();assert.equal(settings.order.indexOf('current'),9);assert.match(nodes(tree).find(n=>n.props?.role==='status').props.children.join(''),/Position 10 von 19/);
 grip('current').props.onPointerDown(event('pointerdown'));targetId='favorites';grip('current').props.onPointerMove(event('pointermove'));grip('current').props.onLostPointerCapture(event('lostpointercapture'));assert.equal(frames.size,0);
 tree=render();grip('current').props.onPointerDown(event('pointerdown'));grip('current').props.onPointerMove(event('pointermove'));mod.cleanup();assert.equal(frames.size,0,'Unmount clears pending animation');
 const css=await readFile('src/styles-src/10-features.css','utf8');assert.match(css,/grid-template-columns:44px minmax\(0,1fr\) auto/);assert.match(css,/dashboard-module-grip\{display:grid;width:44px;height:44px/);
 console.log('PASS dashboard touch: cancel/up/lost capture/unmount, scheduled moves, arrow order + live position, matching 44px grid and grip.');
}finally{Object.assign(globalThis,original);await rm(dir,{recursive:true,force:true})}
