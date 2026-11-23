import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compareCssNetZero,cssBuildEvidence} from './compare-design-css-netzero-0985515.mjs';

const artifact=(css=[{file:'assets/index-a.css',bytes:1000,gzipBytes:400,brotliBytes:330}],initial=['assets/index-a.css'])=>{
 const initialCssAssets=css.filter(a=>initial.includes(a.file));
 return {
  schema:2,ok:true,
  totals:{
   initialCssBytes:initialCssAssets.reduce((n,a)=>n+a.bytes,0),
   initialCssGzipBytes:initialCssAssets.reduce((n,a)=>n+a.gzipBytes,0),
   initialCssBrotliBytes:initialCssAssets.reduce((n,a)=>n+a.brotliBytes,0),
   initialCssFileCount:initialCssAssets.length,
   cssGzipBytes:css.reduce((n,a)=>n+a.gzipBytes,0),
  },
  assets:[...css.map(a=>({...a,extension:'.css'})),{file:'assets/app-a.js',extension:'.js',bytes:123,gzipBytes:55}],
  initialCssAssets,
 };
};
const stable=artifact();

test('equal stable/candidate passes',()=>{
 const result=compareCssNetZero(stable,structuredClone(stable));
 assert.equal(result.status,'PASS_CSS_NET_ZERO_ARTIFACTS');
 assert.ok(result.rows.every(x=>x.delta===0&&x.ok));
});
test('actual smaller CSS passes even if hashed filename changes',()=>{
 const candidate=artifact([{file:'assets/index-newhash.css',bytes:800,gzipBytes:350,brotliBytes:310}],['assets/index-newhash.css']);
 assert.equal(compareCssNetZero(stable,candidate).status,'PASS_CSS_NET_ZERO_ARTIFACTS');
});
test('increased startup CSS blocks integration',()=>{
 const candidate=artifact([{file:'assets/index-a.css',bytes:1001,gzipBytes:401,brotliBytes:330}]);
 const result=compareCssNetZero(stable,candidate);
 assert.equal(result.status,'FAIL_CSS_GROWTH');
 assert.ok(result.rows.some(x=>x.key==='initialCssBytes'&&!x.ok));
});
test('no false green by deferring CSS to a second file',()=>{
 const candidate=artifact([
  {file:'assets/index-a.css',bytes:800,gzipBytes:350,brotliBytes:295},
  {file:'assets/lazy.css',bytes:230,gzipBytes:70,brotliBytes:50},
 ],['assets/index-a.css']);
 const result=compareCssNetZero(stable,candidate);
 assert.equal(result.status,'FAIL_CSS_GROWTH');
 assert.ok(result.rows.some(x=>x.key==='cssFileCount'&&!x.ok));
 assert.ok(result.rows.some(x=>x.key==='cssRawBytes'&&!x.ok));
});
test('zero CSS assets fail closed',()=>{
 assert.throws(()=>cssBuildEvidence(artifact([],[])),/CSS-Asset-Inventar/);
});
test('missing Brotli fields fail closed',()=>{
 const missing=structuredClone(stable);delete missing.assets[0].brotliBytes;
 assert.throws(()=>cssBuildEvidence(missing),/ungueltig/i);
});
test('failed budget reports fail closed',()=>{
 const failed=structuredClone(stable);failed.ok=false;
 assert.throws(()=>cssBuildEvidence(failed),/Build-Evidence ungueltig/);
});
test('missing initial CSS refs fail closed',()=>{
 const bad=structuredClone(stable);bad.initialCssAssets[0].file='assets/unknown.css';
 assert.throws(()=>cssBuildEvidence(bad),/Start-CSS-Inventar/);
});
test('inconsistent totals fail closed',()=>{
 const bad=structuredClone(stable);bad.totals.initialCssGzipBytes+=1;
 assert.throws(()=>cssBuildEvidence(bad),/Inkonsequente/);
});
test('mismatched initial asset bytes fail closed',()=>{
 const bad=structuredClone(stable);bad.initialCssAssets[0].bytes-=1;bad.totals.initialCssBytes-=1;
 assert.throws(()=>cssBuildEvidence(bad),/Start-CSS-Asset-Drift/);
});
test('duplicate CSS assets fail closed',()=>{
 const bad=structuredClone(stable);bad.assets.unshift({...bad.assets[0]});
 assert.throws(()=>cssBuildEvidence(bad),/Doppeltes CSS-Asset/);
});
test('legacy schema is rejected',()=>{
 const bad=structuredClone(stable);bad.schema=1;
 assert.throws(()=>cssBuildEvidence(bad),/Build-Evidence ungueltig/);
});
