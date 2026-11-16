import {describe,it,expect} from 'vitest';
import {validateFullAppFixture,validateFullAppSample,assembleFullAppEvidence,compareFullAppLabEvidence}
 from '../../scripts/lib/design16FullAppProbePolicy.mjs';

const sourceA='a'.repeat(40),sourceB='b'.repeat(40),hashA='1'.repeat(64),hashB='2'.repeat(64);
const fixture=()=>({location:{name:'Demo (synthetic)',latitude:51.1,longitude:7.2,timezone:'Europe/Berlin'},
 theme:'light' as const,priorMapIntent:false});
const sample=(mode:'cold'|'warm')=>({cacheMode:mode,mapReady:true,realPointerEvent:true,
 fcpMs:520,firstMapPointerToVisibleMs:870,postGcHeapBeforeBytes:8_000_000,
 postGcHeapAfterBytes:13_000_000,initialJsRequests:5,initialCssRequests:1,
 totalJsRequests:19,totalCssRequests:2,initialJsEncodedBytes:500_000,
 initialCssEncodedBytes:220_000,totalJsEncodedBytes:1_000_000,totalCssEncodedBytes:223_000,
 externalRequestsObserved:12,runtimeExceptionsObserved:0});
function observation(sha:string,hash:string){return assembleFullAppEvidence({
 identity:{schema:'mid.web-build-identity.v1',sourceGitSha:sha,assetsSha256:hash,version:'0.9.85.486'},
 browserVersion:'Chrome/144.0.7559.96',fixtureSha256:validateFullAppFixture(fixture()).fixtureSha256,
 samples:[sample('cold'),sample('warm')]});}

describe('MID Design 1.6 – real-page lab evidence can never authorize release',()=>{
 it('validates explicit bounded UI fixture and never exports raw location into evidence',()=>{
  const input=fixture();const valid=validateFullAppFixture(input);
  expect(valid.fixtureSha256).toMatch(/^[a-f0-9]{64}$/);
  const report=observation(sourceA,hashA);
  expect(JSON.stringify(report)).not.toContain('Demo (synthetic)');
  expect(report.status).toBe('UNCONTROLLED_PROVIDER_LAB_OBSERVATION');
  expect(report.releaseAuthorized).toBe(false);
  expect(report.fullAppAbProven).toBe(false);
  expect(report.memoryLeakVerdict).toBe(false);
 });
 it('rejects missing location, unsafe timezone, invalid theme or implicit stored intent',()=>{
  expect(()=>validateFullAppFixture({...fixture(),location:{...fixture().location,latitude:NaN}})).toThrow(/coordinates/);
  expect(()=>validateFullAppFixture({...fixture(),location:{...fixture().location,timezone:'?'}})).toThrow(/timezone/);
  expect(()=>validateFullAppFixture({...fixture(),theme:'unknown'})).toThrow(/theme/);
  expect(()=>validateFullAppFixture({...fixture(),priorMapIntent:undefined})).toThrow(/explicit boolean/);
  expect(()=>validateFullAppFixture({...fixture(),apiToken:'must-not-leak'})).toThrow(/unexpected fixture/);
 });
 it('requires an actual Chromium pointer, visible map, FCP, complete network and GC samples',()=>{
  expect(()=>validateFullAppSample({...sample('cold'),mapReady:false})).toThrow(/map or actual/);
  expect(()=>validateFullAppSample({...sample('cold'),realPointerEvent:false})).toThrow(/map or actual/);
  expect(()=>validateFullAppSample({...sample('cold'),fcpMs:null})).toThrow(/missing/);
  expect(()=>validateFullAppSample({...sample('cold'),firstMapPointerToVisibleMs:NaN})).toThrow(/missing/);
  expect(()=>validateFullAppSample({...sample('cold'),initialCssRequests:0})).toThrow(/missing actual application/);
  expect(()=>validateFullAppSample({...sample('cold'),totalJsEncodedBytes:20})).toThrow(/totals smaller/);
 });
 it('requires exactly cold, then warm, a valid build identity and Chrome version',()=>{
  const base={identity:{sourceGitSha:sourceA,assetsSha256:hashA,version:'0.9.85.486'},
   browserVersion:'Chrome/144.0.7559.96',fixtureSha256:hashA};
  expect(()=>assembleFullAppEvidence({...base,samples:[sample('warm'),sample('cold')]})).toThrow(/cold\/warm/);
  expect(()=>assembleFullAppEvidence({...base,identity:{...base.identity,sourceGitSha:'short'},
   samples:[sample('cold'),sample('warm')]})).toThrow(/build identity/);
  expect(()=>assembleFullAppEvidence({...base,browserVersion:'unverified',
   samples:[sample('cold'),sample('warm')]})).toThrow(/browser version/);
 });
 it('compares verified fixture/browser scenarios descriptively but never infers a gain',()=>{
  const stable=observation(sourceA,hashA),candidate=observation(sourceB,hashB);
  candidate.samples[0].firstMapPointerToVisibleMs=400;
  const result=compareFullAppLabEvidence({stable,candidate});
  expect(result.differences.cold.firstMapPointerToVisibleMs.delta).toBe(-470);
  expect(result.releaseAuthorized).toBe(false);
  expect(result.performanceGainProven).toBe(false);
  expect(result.leakFixedProven).toBe(false);
  expect(result.status).toBe('ENVIRONMENT_AND_PROVIDER_PARITY_UNVERIFIED');
 });
 it('rejects noncomparable browser, fixture, release version or sample modes',()=>{
  const stable=observation(sourceA,hashA),candidate=observation(sourceB,hashB);
  candidate.browserVersion='Chrome/145.0';
  expect(()=>compareFullAppLabEvidence({stable,candidate})).toThrow(/versions/);
  candidate.browserVersion=stable.browserVersion;candidate.fixtureSha256='f'.repeat(64);
  expect(()=>compareFullAppLabEvidence({stable,candidate})).toThrow(/fixture/);
  candidate.fixtureSha256=stable.fixtureSha256;
  candidate.samples[1].cacheMode='cold';
  expect(()=>compareFullAppLabEvidence({stable,candidate})).toThrow(/cold\/warm/);
 });
});
