import {describe,expect,it} from 'vitest';
import {nativeDisplayedExtremes,nativeRasterExtremes,nativeScalarLines,nativeAnnotationSvg,rasterExtremeLabel} from '../../src/nativeScalarAnnotations';
import type {NativeField,NativeFieldKind} from '../../src/nativeModelFields';
const units:Record<NativeFieldKind,string>={temperature:'°C',pressure:'hPa',thetae:'K',cloud:'%',wind:'km/h',gust:'km/h',precipitation:'mm/1 h',sigwx:'WMO'};
const field=(kind:NativeFieldKind,values=[0,1,2,80]):NativeField=>({schema:'mid.icon-d2.field.v1',kind,unit:units[kind],run:'2026-11-25T00:00:00Z',time:'2026-11-25T01:00:00Z',scale:1,lats:[48,49],lons:[7,8],values,isobars:[]});
describe('map annotation extrema are parameter-specific, not a changed data range',()=>{
 it.each(['wind','gust','precipitation'] as const)('%s displays only the maximum, keeping both mathematical endpoints',(kind)=>{
  const f=field(kind);expect(nativeDisplayedExtremes(f).map(p=>[p.type,p.value])).toEqual([['Max',80]]);
  expect(nativeRasterExtremes(f).map(p=>p.value)).toEqual([0,80]);
  const svg=nativeAnnotationSvg(f,'kmh',{extremes:true},x=>x,y=>y);
  expect(svg).toContain('aria-label="Maximum: 80"');expect(svg).not.toContain('aria-label="Minimum:');
  expect(nativeDisplayedExtremes(field(kind,[0,0,0,0]))).toEqual([{type:'Max',lat:48,lon:7,value:0,uniform:false}]);
 });
 it.each(['temperature','pressure','thetae','cloud'] as const)('%s displays both nonuniform endpoints and one neutral uniform label',(kind)=>{
  expect(nativeDisplayedExtremes(field(kind)).map(p=>p.type)).toEqual(['Min','Max']);
  const f=field(kind,[5,5,5,5]),points=nativeDisplayedExtremes(f);
  expect(points).toHaveLength(1);expect(rasterExtremeLabel(points[0])).toBe('Einheitlicher Wert');
  expect(nativeAnnotationSvg(f,'kn',{extremes:true},x=>x,y=>y)).toContain('aria-label="Einheitlicher Wert:');
 });
 it('never ranks weather codes, invents a value outside the viewport or converts NoData to zero',()=>{
  expect(nativeDisplayedExtremes(field('sigwx'))).toEqual([]);
  expect(nativeDisplayedExtremes(field('precipitation',[NaN,NaN,NaN,NaN]))).toEqual([]);
  expect(nativeDisplayedExtremes(field('wind'),{south:48,north:48,west:7,east:7})).toEqual([{type:'Max',lat:48,lon:7,value:0,uniform:false}]);
  expect(nativeDisplayedExtremes(field('wind'),{south:60,north:61,west:7,east:8})).toEqual([]);
 });
 it('retains original contour range and unit-specific labels without filtering the numerical field',()=>{
  const f=field('wind',[0,20,40,80]);expect(nativeScalarLines(f,'kmh').length).toBeGreaterThan(0);
  expect(nativeScalarLines(f,'kmh').every(l=>l.label.endsWith('km/h'))).toBe(true);
  expect(f.values).toEqual([0,20,40,80]);
 });
});
