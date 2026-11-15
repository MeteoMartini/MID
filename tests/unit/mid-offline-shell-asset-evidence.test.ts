import {describe,it,expect} from 'vitest';
import {offlineShellAssetEvidence} from '../../scripts/lib/offlineShellAssetEvidence.mjs';

const assets=[
 {file:'assets/main.js',extension:'.js',bytes:100,gzipBytes:40},
 {file:'assets/shared.js',extension:'.js',bytes:200,gzipBytes:60},
 {file:'assets/deferred.js',extension:'.js',bytes:300,gzipBytes:80},
 {file:'assets/shared.css',extension:'.css',bytes:40,gzipBytes:20,brotliBytes:15},
 {file:'assets/deferred.css',extension:'.css',bytes:80,gzipBytes:25,brotliBytes:18},
 {file:'assets/unrelated.js',extension:'.js',bytes:900,gzipBytes:300},
];
const startup={
 js:{entries:[{file:'assets/main.js'},{file:'assets/shared.js'}]},
 css:{entries:[{file:'assets/shared.css'}]},
};
const link=(href:string)=>`<link rel="mid-offline" href="${href}">`;
const html='<link rel="stylesheet" href="./assets/shared.css"><script type="module" src="./assets/main.js"></script>'+
 link('./assets/shared.js')+link('./assets/deferred.js')+link('./assets/deferred.css')+
 link('./assets/shared.css')+link('./assets/deferred.js');

describe('MID offline shell: SHA-built static asset accounting',()=>{
 it('deduplicates links and keeps startup overlap separate from offline-only',()=>{
  const result=offlineShellAssetEvidence(html,assets,startup);
  expect(result.schema).toBe('mid.offline-shell-asset-evidence.v1');
  expect(result.declarations).toBe(5);
  expect(result.total).toMatchObject({fileCount:4,bytes:620,gzipBytes:185,jsFiles:2,cssFiles:2,cssBrotliBytes:33});
  expect(result.sharedWithHtmlStartup).toMatchObject({fileCount:2,bytes:240,gzipBytes:80});
  expect(result.offlineOnly).toMatchObject({fileCount:2,bytes:380,gzipBytes:105});
  expect(result.offlineOnly.entries.map((a:{file:string})=>a.file)).toEqual(['assets/deferred.css','assets/deferred.js']);
  expect(result.scope).toContain('not startup requests');
 });
 it('accepts safe local URLs with cache-busting queries',()=>{
  expect(offlineShellAssetEvidence(link('./assets/shared.js?hash=abc'),assets,startup).total.fileCount).toBe(1);
  expect(offlineShellAssetEvidence('<link href="./assets/shared.js" rel="preload MID-OFFLINE">',assets,startup).total.bytes).toBe(200);
 });
 it.each([
  './%2e%2e/assets/shared.js',
  './assets/../shared.js',
  './assets/%2e%2e/shared.js',
  './assets/%2e/shared.js',
  '../assets/shared.js',
  '/assets/shared.js',
  'https://untrusted.example/assets/shared.js',
  './assets%2fshared.js',
  './assets\\\\shared.js',
  './assets/missing.js',
  './assets/deferred.png',
  './assets/%zz.js',
 ])('fails closed for unsafe or unavailable link %s',(href)=>{
  expect(()=>offlineShellAssetEvidence(link(href),assets,startup)).toThrow();
 });
 it('fails on absent, malformed or unverifiable declarations instead of reporting 0',()=>{
  expect(()=>offlineShellAssetEvidence('<div>No offline assets</div>',assets,startup)).toThrow(/No offline-shell/);
  expect(()=>offlineShellAssetEvidence('<link rel="mid-offline">',assets,startup)).toThrow(/safe local href/);
  expect(()=>offlineShellAssetEvidence(link('./assets/deferred.js'),assets,null)).toThrow(/verified startup/);
  expect(()=>offlineShellAssetEvidence(link('./assets/deferred.css'),assets.map(x=>x.file==='assets/deferred.css'?{...x,brotliBytes:undefined}:x),startup)).toThrow(/Malformed/);
  expect(()=>offlineShellAssetEvidence(link('./assets/shared.js'),[...assets,assets[1]],startup)).toThrow(/duplicated/);
 });
});
