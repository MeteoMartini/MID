import {describe,it,expect} from 'vitest';
import {verifiedModelPrecipGlyph,modelPrecipGlyphSvg,sparseModelWeatherGlyphs} from '../../src/synopModelPlot';
import {nativeCloudIsobars} from '../../src/cloudWeatherIsobars';
describe('MID 18.2.73 integrated model-weather contract',()=>{
 it('keeps absent/non-model values distinct from a real categorical code',()=>{
  for(const value of [null,undefined,NaN,false,'71',0,71.2])expect(verifiedModelPrecipGlyph(value)).toBeNull();
  expect(verifiedModelPrecipGlyph(71)?.sourceClass).toBe('model-weather-code');
 });
 it('does not collapse grain/crystal/rain or freezing precipitation plots',()=>{
  const ink=(ww:number)=>modelPrecipGlyphSvg(verifiedModelPrecipGlyph(ww)!).split('<g color=')[1];
  for(const [a,b] of [[77,61],[78,71],[56,66],[71,73],[73,75],[87,89]])expect(ink(a)).not.toBe(ink(b));
 });
 it('keeps an isolated original extreme cell during adaptive plotting',()=>{
  const n=160,weather=Array<number|null>(n*n).fill(null);weather[73*n+75]=99;
  const shown=sparseModelWeatherGlyphs({lats:Array.from({length:n},(_,i)=>i),lons:Array.from({length:n},(_,i)=>i),weather},(lat,lon)=>({x:lon*3,y:lat*3}),{width:500,height:500});
  expect(shown.some(p=>p.lat===73&&p.lon===75&&p.glyph.ww===99)).toBe(true);
 });
 it('never paints contours borrowed from another model, run or term',()=>{
  const cloud={model:'icon-d2',run:'2026-11-04T06:00Z',time:'2026-11-04T09:00Z',cloud:[],weather:[],lats:[],lons:[]};
  const field={schema:'mid.icon-d2.native-field.v2' as const,modelId:'icon-d2' as const,kind:'pressure' as const,run:cloud.run,time:cloud.time,unit:'hPa',scale:.1,lats:[],lons:[],values:[],isobars:[{level:1010,paths:[]}]};
  expect(nativeCloudIsobars(cloud,field)).not.toBeNull();
  for(const patch of [{run:'old'},{time:'other'},{modelId:'icon-d2-ruc' as const}])expect(nativeCloudIsobars(cloud,{...field,...patch})).toBeNull();
 });
});
