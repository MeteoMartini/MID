import {describe,expect,it} from 'vitest';
import {nativeSeasonalSvg} from '../../src/nativeSeasonalCompositeExport';
import {nativeMapScale,type NativeField} from '../../src/nativeModelFields';
const run='2026-11-09T06:00:00Z',time='2026-11-09T07:00:00Z';
const mk=(kind:NativeField['kind'],values:number[]):NativeField=>({
 schema:'mid.icon-d2.field.v1',run,time,kind,unit:kind==='temperature'?'°C':kind==='gust'?'km/h':'mm/1 h',
 scale:1,lats:[50,50.1],lons:[7,7.1],values,isobars:[],
});
const precip=mk('precipitation',[0,1,2,3]),temperature=mk('temperature',[-2,2,-1,3]);
const raster='data:image/png;base64,AAAA';
const place=[{name:'Testort & Tal',latitude:50,longitude:7}];
describe('native paired DWD seasonal export',()=>{
 it('exports both variables with the run/term, zero-preserving favorite and explicit provenance',()=>{
  const src=nativeSeasonalSvg('winter-berge',precip,temperature,raster,place,'kn',nativeMapScale(precip,'absolute'));
  expect(src).toContain('Winter &amp; Berge');
  expect(src).toContain('Testort &amp; Tal');
  expect(src).toContain('2 m: -2');
  expect(src).toContain('keine Aussage zur Niederschlagsphase');
  expect(src).toContain('letzte Stunde');
  expect(src).toContain('DWD Open Data');
 });
 it('denies time drift, grid drift, invalid raster and inconsistent intervals',()=>{
  expect(()=>nativeSeasonalSvg('winter-berge',precip,{...temperature,time:'2026-11-09T08:00:00Z'},raster,place)).toThrow();
  expect(()=>nativeSeasonalSvg('winter-berge',precip,{...temperature,lons:[7,7.2]},raster,place)).toThrow();
  expect(()=>nativeSeasonalSvg('winter-berge',precip,temperature,'javascript:alert(1)',place)).toThrow();
  expect(()=>nativeSeasonalSvg('sommer-gewitter',precip,mk('gust',[20,40,60,80]),raster,place,'kn',undefined,[],0)).toThrow();
 });
 it('labels gust maximum interval without claiming lightning or warnings',()=>{
  const src=nativeSeasonalSvg('sommer-gewitter',precip,mk('gust',[20,40,60,80]),raster,place,'kn',undefined,[],3);
  expect(src).toContain('3-h-Intervall');
  expect(src).toContain('keine Gewitterwarnung');
  expect(src).toContain('Böen:');
 });
});
