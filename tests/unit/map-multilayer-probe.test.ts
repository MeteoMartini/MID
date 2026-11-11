import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {MapProbeGroup,type MapProbeSnapshot,type MapProbeSource} from '../../src/mapProbeGroup';

const watch=(group:MapProbeGroup,label:string,overrides:Partial<MapProbeSource>={})=>{
 const id=Symbol(label);
 const spec:MapProbeSource={
  label,unit:label==='Niederschlag'?'mm':'°C',source:'DWD ICON-D2 · gleicher geprüfter Lauf',
  unavailableNote:'Originalwert fehlt',
  sample:()=>label==='Niederschlag'?0:-1.8,
  format:value=>value===null?'–':new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(value as number),
  ...overrides,
 };
 let snapshot:MapProbeSnapshot={owner:false,point:null};
 group.add({id,read:()=>spec,notify:next=>{snapshot=next}});
 return{id,get snapshot(){return snapshot;}};
};

describe('MID map popover: one map event, several separately labelled original-field samples',()=>{
 it('presents winter 1-hour precipitation and 2-m temperature in one popup at the identical coordinate',()=>{
  const group=new MapProbeGroup();
  const locations:Array<[number,number]>=[];
  const rain=watch(group,'Niederschlag',{sample:(lat,lon)=>{locations.push([lat,lon]);return 0;}});
  const temp=watch(group,'Temperatur',{sample:(lat,lon)=>{locations.push([lat,lon]);return -1.8;}});
  expect(group.size).toBe(2);
  expect(rain.snapshot.owner).toBe(true);
  expect(temp.snapshot.owner).toBe(false); // Only one portal/center button is visible.
  group.show(50.78,7.07);
  expect(locations).toEqual([[50.78,7.07],[50.78,7.07]]);
  const point=rain.snapshot.point!;
  expect(point.rows.map(row=>[row.label,row.value,row.unit,row.pending])).toEqual([
   ['Niederschlag',0,'mm',false],['Temperatur',-1.8,'°C',false],
  ]);
  expect(temp.snapshot.point?.revision).toBe(point.revision);
  expect(point.rows[0].format(point.rows[0].value)).toBe('0');
 });
 it('shows summer precipitation and 10-m gust as independent rows with no field replacement',()=>{
  const group=new MapProbeGroup();
  const rain=watch(group,'Niederschlag',{sample:()=>2.4});
  watch(group,'Böen',{unit:'km/h',sample:()=>58,source:'DWD ICON-D2 · Böenintervall separat aus Index'});
  group.show(52.2,11.1);
  expect(rain.snapshot.point?.rows.map(row=>row.value)).toEqual([2.4,58]);
  expect(rain.snapshot.point?.rows[1].source).toContain('Böenintervall');
 });
 it('does not convert missing, NaN, Infinity or rejected values into zero',async()=>{
  const group=new MapProbeGroup();
  const rain=watch(group,'Niederschlag',{sample:()=>null});
  watch(group,'Temperatur',{sample:()=>Number.NaN});
  watch(group,'Böen',{unit:'km/h',sample:()=>Promise.reject(new Error('unavailable'))});
  group.show(51,8);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  const rows=rain.snapshot.point!.rows;
  expect(rows.map(row=>row.value)).toEqual([null,null,null]);
  expect(rows.every(row=>row.pending===false)).toBe(true);
  expect(rows.map(row=>row.unavailableNote)).toEqual([
   'Originalwert fehlt','Originalwert fehlt','Originalwert fehlt',
  ]);
 });
 it('forbids late results from an obsolete model time or coordinate',async()=>{
  const group=new MapProbeGroup();
  let finishOld!: (v:number|null)=>void,first=true,aborted:AbortSignal|undefined;
  const rain=watch(group,'Niederschlag',{sample:(_lat,_lon,signal)=>{
   if(first){first=false;aborted=signal;return new Promise<number|null>(resolve=>{finishOld=resolve})}
   return 3;
  }});
  group.show(51,8);
  expect(rain.snapshot.point?.rows[0].pending).toBe(true);
  group.show(52,9);
  expect(aborted?.aborted).toBe(true);
  finishOld(99);
  await Promise.resolve();await Promise.resolve();
  expect(rain.snapshot.point?.latitude).toBe(52);
  expect(rain.snapshot.point?.rows[0].value).toBe(3);
  expect(rain.snapshot.point?.rows[0].pending).toBe(false);
 });
 it('aborts outstanding requests on close and refuses to recreate a vanished popup',async()=>{
  const group=new MapProbeGroup();
  let resolve!: (v:number|null)=>void,signal:AbortSignal|undefined;
  const rain=watch(group,'Niederschlag',{sample:(_lat,_lon,s)=>{
   signal=s;return new Promise<number|null>(r=>{resolve=r});
  }});
  group.show(51,8);group.close();
  expect(signal?.aborted).toBe(true);
  resolve(7);
  await Promise.resolve();await Promise.resolve();
  expect(rain.snapshot.point).toBeNull();
 });
 it('re-elects the surviving layer after a selector/context removal without duplicate owners',()=>{
  const group=new MapProbeGroup();
  const rain=watch(group,'Niederschlag');
  const temp=watch(group,'Temperatur');
  group.show(51,8);
  group.remove(rain.id);
  expect(group.size).toBe(1);
  expect(temp.snapshot.owner).toBe(true);
  expect(temp.snapshot.point).toBeNull();
  group.show(51,8);
  expect(temp.snapshot.point?.rows).toHaveLength(1);
  group.remove(temp.id);
  expect(group.size).toBe(0);
 });
 it('preserves the published exact accessibility contract used by native Chrome map regression',()=>{
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const map=readFileSync(root+'src/ModelMapProbe.tsx','utf8');
  const browser=readFileSync(root+'scripts/verify-native-model-browser-0985141.mjs','utf8');
  expect(browser).toContain("name:'Wert am Kartenmittelpunkt anzeigen',exact:true");
  expect(map).toContain('title="Wert am Kartenmittelpunkt" aria-label="Wert am Kartenmittelpunkt anzeigen" aria-haspopup="dialog"');
  expect(map).toContain('role="dialog" className="mid-model-map-probe"');
  expect(map).toContain('if(!view.owner)return null');
 });
 it('resubscribes rather than showing old displayed values after a unit, source or label change',()=>{
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const map=readFileSync(root+'src/ModelMapProbe.tsx','utf8');
  expect(map).toContain('[map,enabled,contextKey,label,unit,source,unavailableNote]');
 });
 it('does not apply an unrelated source value or duplicate the map center control',()=>{
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const map=readFileSync(root+'src/ModelMapProbe.tsx','utf8');
  const unified=readFileSync(root+'src/UnifiedWeatherMap.tsx','utf8');
  expect(map).toContain('new MapProbeGroup()');
  expect(map).toContain('if(!view.owner)return null');
  expect(map).toContain('row.label');
  expect(map).toContain('row.unit');
  expect(map).toContain('row.source');
  expect(map).toContain('group.show(event.lngLat.lat,event.lngLat.wrap().lng)');
  expect(unified).toContain('seasonalMaskedPair(parameter,field,seasonalCompanion,ref?.time)');
  expect(unified).toContain("label={isSeasonal?'Niederschlag · 1 h'");
  expect(unified).toContain("parameter==='winter-berge'?'Temperatur · 2 m':'Böen · 10 m'");
 });
});
