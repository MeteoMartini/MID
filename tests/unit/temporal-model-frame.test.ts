import {describe,expect,it,vi} from 'vitest';
vi.mock('../../src/MapLibreCore',()=>({registerMapLayerOrder:()=>{},unregisterMapLayerOrder:()=>{},useMidMap:()=>null}));
vi.mock('maplibre-gl',()=>({}));
import {createTemporalMapFrameController,type TemporalMapFrameData} from '../../src/TemporalMapFrame';
import type {MidMap} from '../../src/MapLibreCore';

function fixture(reducedMotion=false){
 let now=0,serial=0;const jobs=new Map<number,FrameRequestCallback>(),timers=new Map<number,{fn:()=>void;at:number}>(),sources=new Map<string,any>(),layers=new Map<string,any>(),loaded=new Set<string>(),listeners=new Map<string,Set<(...args:any[])=>void>>(),images:any[]=[];
 const emit=(event:string,value?:any)=>{for(const cb of [...(listeners.get(event)??[])])cb(value)};
 const map={
  addSource(id:string,s:any){sources.set(id,{...s,updateImage:vi.fn()})},getSource:(id:string)=>sources.get(id),removeSource(id:string){sources.delete(id);loaded.delete(id)},
  addLayer(l:any){layers.set(l.id,l)},getLayer:(id:string)=>layers.get(id),removeLayer:(id:string)=>layers.delete(id),setPaintProperty(id:string,p:string,v:number){layers.get(id).paint[p]=v},
  on(event:string,cb:(...args:any[])=>void){if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event)!.add(cb)},off(event:string,cb:(...args:any[])=>void){listeners.get(event)?.delete(cb)},
  isSourceLoaded:(id:string)=>loaded.has(id),triggerRepaint:()=>{}
 };
 const controller=createTemporalMapFrameController(map as unknown as MidMap,'test',{
  makeImage:()=>{const image:any={};images.push(image);return image},now:()=>now,raf:fn=>{jobs.set(++serial,fn);return serial},cancelRaf:id=>{jobs.delete(id)},timeout:(fn,ms)=>{timers.set(++serial,{fn,at:now+ms});return serial},clearTimeout:id=>{timers.delete(id)},reducedMotion:()=>reducedMotion
 });
 const tick=(ms:number)=>{now+=ms;const tasks=[...jobs.values()];jobs.clear();tasks.forEach(fn=>fn(now));for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}};
 const frame=(key:string,withContours=true):TemporalMapFrameData=>({key,raster:{url:key,bounds:[[48,7],[49,8]],resampling:'nearest',zIndex:300},groups:withContours?['isobars','isoheights'].map((id,index)=>({id,zIndex:680+index,data:{type:'FeatureCollection',features:[{type:'Feature',properties:{level:1016},geometry:{type:'LineString',coordinates:[[7,48],[8,49]]}}]},layers:[{id:'line',type:'line',paint:{'line-opacity':1}},{id:'label',type:'symbol',layout:{'text-field':['get','level']},paint:{'text-opacity':1}}]})):[]});
 const display=vi.fn(),error=vi.fn();
 const stage=(key:string,contours=true)=>{controller.stage(frame(key,contours),()=>display(key),error);images.at(-1).onload()};
 const mark=(ids=[...sources.keys()])=>{ids.forEach(id=>loaded.add(id));emit('render')};
 const alpha=(generation:number,type:string)=>[...layers.values()].filter(l=>l.id.includes('-frame-'+generation+'-')&&l.type===type).map(l=>l.paint[type==='raster'?'raster-opacity':type==='line'?'line-opacity':'text-opacity']);
 return {controller,images,sources,layers,loaded,listeners,jobs,timers,emit,tick,stage,mark,alpha,display,error,frame};
}
describe('atomic model weather frame presentation',()=>{
 it('retains all old layers until raster AND both vector sources render, then fades lines, labels and raster together',()=>{
  const f=fixture();f.stage('a');f.mark();f.tick(350);expect(f.display).toHaveBeenLastCalledWith('a');expect(f.layers.size).toBe(5);
  f.stage('b');const next=[...f.sources.keys()].filter(k=>k.includes('frame-2'));
  f.mark(next.slice(0,2));f.tick(500);expect(f.alpha(1,'line')).toEqual([1,1]);expect(f.alpha(1,'raster')).toEqual([1]);expect(f.display).toHaveBeenCalledTimes(1);
  f.mark(next);f.tick(175);expect(f.alpha(1,'line')).toEqual([.5,.5]);expect(f.alpha(2,'line')).toEqual([.5,.5]);expect(f.alpha(2,'symbol')).toEqual([.5,.5]);expect(f.alpha(2,'raster')).toEqual([.5]);
  f.tick(175);expect(f.display).toHaveBeenLastCalledWith('b');expect(f.sources.size).toBe(3);expect(f.layers.size).toBe(5);
 });
 it('supersedes a half-faded term without emptying the last complete frame or admitting the cancelled term',()=>{
  const f=fixture();f.stage('a');f.mark();f.tick(350);f.stage('b');f.mark();f.tick(100);f.stage('c');expect(f.alpha(1,'raster')).toEqual([1]);expect(f.sources.size).toBe(6);f.mark();f.tick(350);expect(f.display.mock.calls).toEqual([['a'],['c']]);expect(f.sources.size).toBe(3);
 });
 it('retains the old coherent frame on source error and timeout; null is pending, not empty',()=>{
  const f=fixture();f.stage('a');f.mark();f.tick(350);f.controller.stage(null,()=>f.display('missing'),f.error);expect(f.layers.size).toBe(5);f.stage('b');const id=[...f.sources.keys()].find(k=>k.includes('frame-2'))!;f.emit('error',{sourceId:id});expect(f.error).toHaveBeenCalledTimes(1);expect(f.alpha(1,'line')).toEqual([1,1]);f.stage('c');f.tick(20001);expect(f.error).toHaveBeenCalledTimes(2);expect(f.sources.size).toBe(3);
 });
 it('admits a genuine missing contour only with the new raster, not with old-term contours',()=>{
  const f=fixture();f.stage('a');f.mark();f.tick(350);f.stage('b',false);expect(f.alpha(1,'line')).toEqual([1,1]);f.mark();f.tick(175);expect(f.alpha(1,'line')).toEqual([.5,.5]);f.tick(175);expect(f.layers.size).toBe(1);expect(f.display).toHaveBeenLastCalledWith('b');
 });
 it('honors reduced motion, opacity and complete cleanup',()=>{
  const f=fixture(true);f.controller.setOpacity(.7);f.stage('a');f.mark();f.tick(1);expect(f.alpha(1,'raster')).toEqual([.7]);expect(f.alpha(1,'line')).toEqual([.7,.7]);f.controller.dispose();expect(f.sources.size).toBe(0);expect(f.layers.size).toBe(0);expect(f.jobs.size).toBe(0);expect(f.timers.size).toBe(0);expect([...f.listeners.values()].every(s=>s.size===0)).toBe(true);
 });
 it('does not restart identical immutable requests during image loading or fade; latest acknowledgement wins',()=>{
  const f=fixture();f.stage('a');f.mark();f.tick(350);
  const first=vi.fn(),latest=vi.fn();f.controller.stage(f.frame('b'),first,f.error);
  const image=f.images.at(-1);f.controller.stage(f.frame('b'),latest,f.error);expect(f.images.length).toBe(2);
  image.onload();f.mark();f.tick(175);expect(f.alpha(1,'raster')).toEqual([.5]);
  f.controller.stage(f.frame('b'),latest,f.error);expect(f.images.length).toBe(2);
  f.tick(175);expect(first).not.toHaveBeenCalled();expect(latest).toHaveBeenCalledTimes(1);expect(f.sources.size).toBe(3);
 });
 it('preserves independent original raster and contour opacity for native maps',()=>{
  const f=fixture(true),frame=f.frame('native');
  frame.raster!.opacity=.85;frame.groups[0].layers[0].paint!['line-opacity']=.8;
  f.controller.stage(frame,()=>f.display('native'),f.error);f.images.at(-1).onload();f.mark();f.tick(1);
  expect(f.alpha(1,'raster')).toEqual([.85]);expect(f.alpha(1,'line')).toEqual([.8,1]);
 });

});
