import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const temp=mkdtempSync(join(tmpdir(),'mid148-map-contract-'));
try{
 await build({stdin:{contents:"export * from './src/modelMapColorScale';export * from './src/modelMapUnits';export * from './src/nativeModelFields';export * from './src/nativeModelMapExport';export * from './src/precipitationTotals';export * from './src/precipitationTotalsExport';export {wind} from './src/weather';export {ecmwfTemperatureColor} from './src/temperatureTone';export {default as WmsWindUnitGuide} from './src/WmsWindUnitGuide';export {renderToStaticMarkup} from 'react-dom/server';export {createElement} from 'react';",loader:'tsx',resolveDir:process.cwd()},bundle:true,jsx:'automatic',banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},platform:'node',format:'esm',outfile:join(temp,'contract.mjs'),loader:{'.css':'empty'},logLevel:'silent'});
 const m=await import(pathToFileURL(join(temp,'contract.mjs')));
 const raw={schema:'mid.icon-d2.field.v1',run:'2026-10-03T00:00:00Z',time:'2026-10-03T06:00:00Z',kind:'wind',unit:'km/h',scale:.1,lats:[47,51.1,55.2],lons:[5.5,10.55,15.6],values:[185,200,210,240,370,380,410,460,500],isobars:[]};
 const snapshot=JSON.stringify(raw),place=[{name:'Testort <&>',latitude:51.1,longitude:10.55}];
 for(const kind of ['wind','gust'])for(const unit of ['kn','kmh','ms','mph']){
  const data={...raw,kind},suffix=m.modelMapUnit(kind,data.unit,unit),text=m.modelMapValue(kind,37,data.unit,unit);
  assert.equal(`${text} ${suffix}`,m.wind(37/1.852,unit),'Use canonical MID formatter, not a second conversion');
  for(const mode of ['field','absolute']){
   const scale=m.nativeMapScale(data,mode,unit),svg=m.nativeFieldSvg(data,'Windkarte','data:image/png;base64,AA==',place,1,unit,scale);
   assert.ok(svg.includes(`${text} ${suffix}`),'Export favorites must match the map value');
   assert.ok(svg.includes(suffix)&&svg.includes('linearGradient'));
   const factor=m.modelMapDisplayFactor(kind,unit);for(const [tick] of m.mapScaleTicks(scale))assert.ok(Math.abs(tick*factor-Math.round(tick*factor))<1e-8,'All selected-unit wind ticks are round integers');
   if(mode==='field')assert.ok(scale.minimum<=18.5&&scale.maximum>=50,'Rounded ranges cover the full field');
   else for(const [value] of m.NATIVE_LEGENDS[kind])assert.equal(m.mapColorAt(scale,value),m.mapColorAt(m.createMapColorScale(m.NATIVE_LEGENDS[kind],[],'absolute'),value),'Absolute physical color anchors survive display-unit rounding');
   assert.ok(svg.includes('Testort &lt;&amp;&gt;'),'Escape provider/user content');
   assert.ok(svg.includes(mode==='field'?'Wertebereich · relative Farbskala':'Feste Skala'));
   for(const [value] of m.mapScaleTicks(scale))assert.ok(svg.includes(m.modelMapValue(kind,value,data.unit,unit)));
   if(unit!=='kmh')assert.ok(!svg.includes('km/h'),'No raw-unit label in selected-unit export');
  }
  const guide=m.renderToStaticMarkup(m.createElement(m.WmsWindUnitGuide,{unit}));
  for(const speed of [5,10,50])assert.ok(guide.includes(m.wind(speed,unit)));
 }
 assert.equal(JSON.stringify(raw),snapshot,'Presentation must never mutate immutable field values/units');
 assert.equal(m.modelMapValue('wind',37,'m/s','kn'),'–','Unsupported raw wind unit is not silently misconverted');
 assert.equal(m.modelMapValue('wind',null,'km/h','kn'),'–');
 const ref={hour:6,time:raw.time},index={run:raw.run,products:{wind:{unit:'km/h'}}};
 assert.equal(m.validateNativeField(raw,index,ref,'wind'),raw);
 assert.throws(()=>m.validateNativeField({...raw,unit:'m/s'},{...index,products:{wind:{unit:'m/s'}}},ref,'wind'),/Modelleinheit/,'Matching but unsupported provider/index units must fail closed');
 for(const kind of Object.keys(m.NATIVE_LEGENDS)){
  const unit={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'}[kind];
  const values={temperature:[150,151,160,170,180,190,200,210,220],pressure:[10000,10010,10020,10030,10040,10050,10060,10070,10080],cloud:[10,20,30,40,50,60,70,80,90],thetae:[3000,3010,3020,3030,3040,3050,3060,3070,3080],sigwx:[0,450,510,610,660,710,800,950,990],precipitation:[0,0,1,2,3,4,6,8,10]}[kind]??raw.values;
  const data={...raw,kind,unit,values},scale=m.nativeMapScale(data,'field');
  if(kind==='sigwx'){assert.equal(scale.categorical,true);assert.equal(scale.mode,'absolute');assert.equal(m.mapColorAt(scale,61),m.mapColorAt(scale,69));continue}
  assert.equal(scale.mode,'field');
  const minimum=Math.min(...values)*.1,maximum=Math.max(...values)*.1;
  assert.ok(scale.minimum<=Math.max(minimum,scale.transparentBelow??-Infinity)&&scale.maximum>=maximum,'All finite extrema stay represented; no quantile clipping');
  const colors=new Set(Array.from({length:101},(_,i)=>m.mapColorAt(scale,scale.minimum+(scale.maximum-scale.minimum)*i/100)));
  assert.ok(colors.size>=80,`${kind}: smooth variation rather than large constant-color bands`);
  for(let i=1;i<scale.stops.length;i++){
   const threshold=scale.stops[i][0],epsilon=(scale.maximum-scale.minimum)*1e-7;
   const channels=c=>c.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));
   if(scale.transparentBelow!==undefined&&threshold<=scale.transparentBelow)continue;
   const a=channels(m.mapColorAt(scale,threshold-epsilon)),b=channels(m.mapColorAt(scale,threshold));
   assert.ok(a.every((v,j)=>Math.abs(v-b[j])<=1),`${kind}: no jump at palette anchor`);
  }
 }
 const fixed=m.nativeMapScale({...raw,kind:'temperature',unit:'°C'},'absolute');
 for(const value of [-30,-20,-10,0,5,10,15,20,25,30,35,40]){
  const canonical=m.ecmwfTemperatureColor(value).match(/\d+/g).map(Number),hex='#'+canonical.map(v=>v.toString(16).padStart(2,'0')).join('');
  assert.equal(m.mapColorAt(fixed,value),hex,'Fixed temperature scale remains canonical ECMWF-inspired MID scale');
 }
 const totals={kind:'observed',scale:.1,lats:raw.lats,lons:raw.lons,run:raw.run},frame={hours:1,validFrom:'2026-10-02T23:00:00Z',validTo:raw.run,values:[-1,0,1,2,3,5,7,9,12],maximum:1.2};
 const scale=m.totalsMapScale(totals,frame,'field');assert.ok(scale.minimum<=.1&&scale.maximum>=1.2,'Rounded bounds still cover all verified values');
 assert.equal(m.mapColorAt(scale,0),'transparent');assert.equal(m.mapColorAt(scale,NaN),'transparent');
 assert.equal(m.totalsAt(totals,frame,47,5.5),null);
 const wet=m.totalsMapScale(totals,{...frame,values:[1000,1001,1002,1003,1004,1005,1006,1007,1010]},'field');
 assert.equal(wet.minimum,100,'A wholly wet field scales to its actual minimum, not an unrelated dry threshold');
 assert.equal(wet.maximum,101);
 assert.ok(m.totalsSvg(totals,frame,'data:image/png;base64,AA==',place,[],scale).includes('Wertebereich · relative Farbskala'));
 // Execute the actual canvas rasterizer: missing, dry and valid pixels must
 // retain different semantics, and the native center pixel must match its legend.
 const originalDocument=globalThis.document;let pixels;
 globalThis.document={createElement:()=>({getContext:()=>({createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),putImageData:image=>{pixels=image.data}}),toDataURL:()=> 'data:image/png;base64,QA'})};
 try{
  const observedFrame={...frame,values:[-1,0,1,2,3,5,7,9,12]};
  m.totalsRaster(totals,observedFrame,scale);
  assert.deepEqual([...pixels.slice(24,28)],[103,117,131,215],'Missing observed cell remains gray, not dry');
  assert.deepEqual([...pixels.slice(28,32)],[0,0,0,0],'Verified zero cell remains transparent');
  assert.equal(pixels[35],215,'Valid wet cell is rendered');
  const nativeScale=m.nativeMapScale(raw,'field');m.nativeRaster(raw,nativeScale);
  const expected=m.mapColorAt(nativeScale,37).slice(1).match(/../g).map(v=>parseInt(v,16));
  assert.deepEqual([...pixels.slice(16,20)],[...expected,215],'Actual raster uses the same numeric scale as legends/exports');
 }finally{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument}
 for(const values of [[],[0,0],[-1,-1]]){const result=m.createMapColorScale(m.TOTALS_COLORS,values,'field',{nonnegative:true,transparentBelow:.1});assert.equal(result.mode,'absolute');assert.ok(result.stops.every(([v])=>Number.isFinite(v)))}
 for(const [a,b] of [[.1,.2],[.2,.3],[14.1,14.2],[-6.7,12.3],[990.1,1006.7],[100,101]]){const input=m.createMapColorScale([[a,'#001122'],[b,'#aabbcc']],[a,b],'field');const rounded=m.roundMapScale(input,1,a>=0&&b<1?.1:1);assert.ok(rounded.minimum<=a&&rounded.maximum>=b,'Outward bounds never clip extrema');assert.ok(m.mapScaleTicks(rounded).every(([v])=>v>=rounded.minimum&&v<=rounded.maximum));}
 const constant=m.nativeMapScale({...raw,values:Array(9).fill(200)},'field');assert.equal(constant.mode,'absolute','Uniform fields do not invent spatial contrast');
 const source=path=>readFileSync(path,'utf8');
 assert.match(source('src/App.tsx'),/<MemoLazyMapWorkspacePanel[^>]*unit=\{unit\}/);
 assert.match(source('src/MapWorkspacePanel.tsx'),/<MemoLazyUnifiedWeatherMap[^>]*\.\.\.props/);
 assert.ok(source('src/UnifiedWeatherMap.tsx').includes("unit=props.unit??'kn'"));
 assert.ok(source('src/NativeModelMap.tsx').includes("playing?'absolute':colorMode"),'Animation retains value/color comparability');
 console.log('MID148: all four wind units, native point/legend/export parity, continuous full-range colors, canonical fixed temperature scale, categorical weather codes, missing/dry semantics, uniform fields and settings wiring verified.');
}finally{rmSync(temp,{recursive:true,force:true})}
