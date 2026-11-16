import {describe,it,expect} from 'vitest';
import {compareDesign16Evidence} from '../../scripts/lib/design16AbEvidence.mjs';
const old='a'.repeat(40),newSha='b'.repeat(40),oldHash='1'.repeat(64),newHash='2'.repeat(64);
function specimen(sha:string,hash:string,js=1000,css=1200){
 const buildIdentity={schema:'mid.web-build-identity.v1',sourceGitSha:sha,assetsSha256:hash,version:'0.9.85.486'};
 const method='Chromium isolated localhost module import, gzip-9, HTTP cache disabled, no Service Worker; GC before and after';
 return {buildIdentity, startup:{schema:'mid.static-startup-assets.v1',scope:'HTML-referenced startup assets; no transitive import graph, network or heap measurement',
  provenance:{version:buildIdentity.version,buildIdentity:{...buildIdentity}},
  css:{bytes:4000,gzipBytes:css},js:{bytes:5000,gzipBytes:js}},
  mapModule:{schema:'mid.prefetch.chrome-module-evidence.v1',identity:{...buildIdentity},method,
   noImport:{waitMs:2800,productionMapJsRequests:0},warmImport:{requestCount:4,gzipBodyBytes:260,cssRequestCount:1,
    cssGzipBodyBytes:30,importElapsedMs:420,postGcHeapDelta:4000000,
    files:[{gzipBodyBytes:50},{gzipBodyBytes:60},{gzipBodyBytes:70},{gzipBodyBytes:80}],cssFiles:[{gzipBodyBytes:30}]}}};
}
const args=()=>({stable:specimen(old,oldHash),candidate:specimen(newSha,newHash,900,1100),expectedStableSha:old,expectedCandidateSha:newSha});
describe('MID Design 1.6 — source-verified module-only evidence never passes for full-app A/B',()=>{
 it('describes exact numeric differences but never labels an incomplete A/B as passed',()=>{
  const result=compareDesign16Evidence(args());
  expect(result.metrics.initialJsGzip.delta).toBe(-100);
  expect(result.metrics.initialCssGzip.delta).toBe(-100);
  expect(result.metrics.moduleOnlyPostGcHeapDelta.delta).toBe(0);
  expect(result.status).toBe('DESCRIPTIVE_ONLY_FULL_APP_AB_MISSING');
  expect(result.releaseAuthorized).toBe(false);
  expect(result.performanceGainProven).toBe(false);
  expect(result.leakFixedProven).toBe(false);
 });
 it('rejects swapped candidate or truncated source SHA',()=>{
  expect(()=>compareDesign16Evidence({...args(),candidate:specimen(old,oldHash)})).toThrow(/mismatched full source SHA/);
  expect(()=>compareDesign16Evidence({...args(),expectedStableSha:'abc'})).toThrow(/40-character/);
  expect(()=>compareDesign16Evidence({...args(),expectedCandidateSha:old})).toThrow(/must be different/);
 });
 it('rejects stale startup build fingerprint and mismatched map build provenance',()=>{
  const stale=args();stale.candidate.startup.provenance.buildIdentity.assetsSha256=oldHash;
  expect(()=>compareDesign16Evidence(stale)).toThrow(/different dist/);
  const bad=args();bad.candidate.mapModule.identity.assetsSha256=oldHash;
  expect(()=>compareDesign16Evidence(bad)).toThrow(/different dist/);
 });
 it('never equates missing startup or module data with zero',()=>{
  const bad=args();bad.candidate.startup.css.gzipBytes=null;
  expect(()=>compareDesign16Evidence(bad)).toThrow(/nonnegative integer/);
  const nan=args();nan.candidate.mapModule.warmImport.postGcHeapDelta=Number.NaN;
  expect(()=>compareDesign16Evidence(nan)).toThrow(/finite measurement/);
  const empty=args();empty.candidate.startup.js.bytes=0;
  expect(()=>compareDesign16Evidence(empty)).toThrow(/empty startup assets/);
 });
 it('fails closed for incomplete compressed asset inventory and absent cold control',()=>{
  const bad=args();bad.candidate.mapModule.warmImport.files.pop();
  expect(()=>compareDesign16Evidence(bad)).toThrow(/inventory/);
  const wrongSum=args();wrongSum.candidate.mapModule.warmImport.files[0].gzipBodyBytes=100;
  expect(()=>compareDesign16Evidence(wrongSum)).toThrow(/does not sum/);
  const badControl=args();badControl.candidate.mapModule.noImport.productionMapJsRequests=1;
  expect(()=>compareDesign16Evidence(badControl)).toThrow(/control interval/);
 });
 it('rejects mismatched probe methods and unknown measurement scope',()=>{
  const mismatch=args();mismatch.candidate.mapModule.method='warm-cache probe';
  expect(()=>compareDesign16Evidence(mismatch)).toThrow(/different methods/);
  const scope=args();scope.candidate.startup.scope='calculated browser FCP';
  expect(()=>compareDesign16Evidence(scope)).toThrow(/measurement scope/);
 });
});
