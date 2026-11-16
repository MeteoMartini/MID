import {describe,it,expect} from 'vitest';
import {assessMid740ImmutableRecovery,REQUIRED_ASSETS} from '../../tools/ci/mid-740-immutable-recovery-qa.mjs';
const sha='a'.repeat(40),version='0.9.85.484';
const independent=Object.fromEntries(REQUIRED_ASSETS.map((name,i)=>[name,'sha256:'+String(i+1).repeat(64)]));
const release={id:42,tag_name:'v'+version,draft:false,prerelease:false,immutable:true,created_at:'2026-11-16T09:00:00Z',published_at:'2026-11-16T09:02:00Z',assets:REQUIRED_ASSETS.map((name,i)=>({name,id:11+i,state:'uploaded',size:1000+i,digest:independent[name],url:'https://api.github.com/repos/MeteoMartini/MID/releases/assets/'+(i+11),browser_download_url:'https://github.com/MeteoMartini/MID/releases/download/v'+version+'/'+name}))};
const fixture=()=>({sourceSha:sha,mainSha:sha,stableSha:sha,tagSha:sha,version,independentDigests:structuredClone(independent),release:structuredClone(release)});
const mutate=(fn:(x:ReturnType<typeof fixture>)=>void)=>{const x=fixture();fn(x);return assessMid740ImmutableRecovery(x)};
describe('MID #740 immutable recovery candidate: fail-closed independent metadata',()=>{
 it('accepts complete synthetic metadata but NEVER release or recovery authorization',()=>{
  const x=assessMid740ImmutableRecovery(fixture());expect(x.status).toBe('METADATA_COHERENT');expect(x.assetMetadata).toHaveLength(3);
  for(const k of ['releaseAuthorized','recoveryAuthorized','reviewEnforced','bytesVerified','attestationVerified'] as const)expect(x[k]).toBe(false);
 });
 it('blocks changed main/stable/tag SHA even with plausible metadata',()=>{
  expect(mutate(x=>{x.mainSha='b'.repeat(40)}).reason).toBe('STABLE_MAIN_DRIFT');
  expect(mutate(x=>{x.stableSha='b'.repeat(40)}).reason).toBe('STABLE_MAIN_DRIFT');
  expect(mutate(x=>{x.tagSha='b'.repeat(40)}).reason).toBe('TAG_TARGET_DRIFT');
  expect(mutate(x=>{x.tagSha='main'}).reason).toBe('BAD_SHA_OR_VERSION');
 });
 it('rejects drafts, mutable releases, prereleases and wrong tag',()=>{
  expect(mutate(x=>{x.release.immutable=false}).status).toBe('BLOCKED');
  expect(mutate(x=>{x.release.draft=true}).status).toBe('BLOCKED');
  expect(mutate(x=>{x.release.prerelease=true}).status).toBe('BLOCKED');
  expect(mutate(x=>{x.release.tag_name='widget-latest'}).status).toBe('BLOCKED');
 });
 it('rejects incomplete or duplicated source/distribution/manifest asset inventory',()=>{
  expect(mutate(x=>{x.release.assets.pop()}).reason).toBe('INCOMPLETE_ASSET_INVENTORY');
  expect(mutate(x=>{x.release.assets[1].name=x.release.assets[0].name}).reason).toBe('DUPLICATE_ASSET');
  expect(mutate(x=>{x.release.assets[1].id=x.release.assets[0].id}).reason).toBe('DUPLICATE_ASSET');
 });
 it('rejects wrong digest, invalid size and redirected metadata URLs',()=>{
  expect(mutate(x=>{x.release.assets[0].digest='sha256:'+'0'.repeat(64)}).reason).toBe('ASSET_DIGEST_OR_SIZE_INVALID');
  expect(mutate(x=>{x.release.assets[0].size=0}).reason).toBe('ASSET_DIGEST_OR_SIZE_INVALID');
  expect(mutate(x=>{x.release.assets[0].browser_download_url='https://evil.example/a'}).reason).toBe('UNTRUSTED_ASSET_URL');
 });
 it('rejects invalid publication times and version',()=>{
  expect(mutate(x=>{x.release.published_at='2026-11-16T08:00:00Z'}).reason).toBe('INVALID_RELEASE_CHRONOLOGY');
  expect(mutate(x=>{x.version='0.9.85.x'}).reason).toBe('BAD_SHA_OR_VERSION');
 });
});
