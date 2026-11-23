import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {verifyCssArtifacts} from './verify-design-css-artifacts-0985515.mjs';
import {compareCssNetZero} from './compare-design-css-netzero-0985515.mjs';

function fixture(files={'assets/index-a.css':'body{color:red}'},htmlCss=['assets/index-a.css']){
 const root=mkdtempSync(join(tmpdir(),'mid-css-artifacts-'));
 const assets=[];
 for(const [name,css] of Object.entries(files)){
  const file=join(root,name);mkdirSync(join(file,'..'),{recursive:true});writeFileSync(file,css);
  const data=readFileSync(file);
  assets.push({file:name,extension:'.css',bytes:data.length,
   gzipBytes:gzipSync(data,{level:9}).length,
   brotliBytes:brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length,
   sha256:createHash('sha256').update(data).digest('hex')});
 }
 writeFileSync(join(root,'index.html'),'<html><head>'+htmlCss.map(name=>`<link rel="stylesheet" href="./${name}">`).join('')+'</head><body></body></html>');
 const initialCssAssets=assets.filter(a=>htmlCss.includes(a.file));
 const sum=(arr,k)=>arr.reduce((n,a)=>n+a[k],0);
 const report={schema:2,ok:true,assets,initialCssAssets:initialCssAssets.map(a=>({file:a.file,bytes:a.bytes,gzipBytes:a.gzipBytes,brotliBytes:a.brotliBytes})),
  totals:{initialCssBytes:sum(initialCssAssets,'bytes'),initialCssGzipBytes:sum(initialCssAssets,'gzipBytes'),initialCssBrotliBytes:sum(initialCssAssets,'brotliBytes'),
   initialCssFileCount:initialCssAssets.length,cssGzipBytes:sum(assets,'gzipBytes')}};
 return {root,report,close:()=>rmSync(root,{recursive:true,force:true})};
}
function useFixture(fn,args){const f=fixture(...(args||[]));try{return fn(f)}finally{f.close()}}

test('real hashed CSS, gzip9/Brotli6 and HTML references pass',()=>useFixture(f=>{
 const r=verifyCssArtifacts(f.report,f.root);
 assert.deepEqual([r.cssFiles,r.initialCssFiles,r.sha256Verified,r.htmlCssReferencesVerified],[1,1,true,true]);
}));
test('a copied, mismatched CSS file fails even if JSON matches',()=>useFixture(f=>{
 writeFileSync(join(f.root,'assets/index-a.css'),'body{color:blue}');
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/CSS artifact mismatch/);
}));
test('a tampered SHA-256 fails closed',()=>useFixture(f=>{
 f.report.assets[0].sha256='0'.repeat(64);
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/CSS artifact mismatch/);
}));
test('a tampered compressed-size field fails closed',()=>useFixture(f=>{
 f.report.assets[0].brotliBytes+=1;f.report.initialCssAssets[0].brotliBytes+=1;f.report.totals.initialCssBrotliBytes+=1;
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/CSS artifact mismatch/);
}));
test('unreported lazy CSS in dist fails closed',()=>useFixture(f=>{
 writeFileSync(join(f.root,'assets/lazy.css'),'p{display:flex}');
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/CSS file inventory drift/);
}));
test('missing CSS assets in dist fail closed',()=>useFixture(f=>{
 rmSync(join(f.root,'assets/index-a.css'));
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/CSS file inventory drift/);
}));
test('swapping HTML startup reference with lazy stylesheet fails',()=>useFixture(f=>{
 writeFileSync(join(f.root,'index.html'),'<link rel="stylesheet" href="./assets/lazy.css">');
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/Initial CSS reference drift|Initiales CSS-Asset fehlt/);
},[{'assets/index-a.css':'a{color:red}','assets/lazy.css':'p{color:blue}'}]));
test('duplicate stylesheet references are counted once',()=>useFixture(f=>{
 writeFileSync(join(f.root,'index.html'),'<link rel="stylesheet" href="./assets/index-a.css"><link rel="stylesheet" href="./assets/index-a.css">');
 assert.equal(verifyCssArtifacts(f.report,f.root).initialCssFiles,1);
}));
test('reports may not escape dist directory via asset path',()=>useFixture(f=>{
 f.report.assets[0].file='../outside.css';f.report.initialCssAssets[0].file='../outside.css';
 assert.throws(()=>verifyCssArtifacts(f.report,f.root),/Unsafe CSS asset path|CSS file inventory drift/);
}));
test('verifying two real unchanged fixtures permits net zero',()=>{
 const a=fixture(),b=fixture();
 try{
  verifyCssArtifacts(a.report,a.root);verifyCssArtifacts(b.report,b.root);
  assert.equal(compareCssNetZero(a.report,b.report).status,'PASS_CSS_NET_ZERO_ARTIFACTS');
 }finally{a.close();b.close()}
});
test('real CSS growth fails the comparator even with genuine reports',()=>{
 const a=fixture(),b=fixture({'assets/index-a.css':'body{color:red}main{display:grid}'});
 try{
  verifyCssArtifacts(a.report,a.root);verifyCssArtifacts(b.report,b.root);
  assert.equal(compareCssNetZero(a.report,b.report).status,'FAIL_CSS_GROWTH');
 }finally{a.close();b.close()}
});
