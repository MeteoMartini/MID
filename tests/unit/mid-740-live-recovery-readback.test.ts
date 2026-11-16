import {describe,it,expect} from 'vitest';
import {inspectMid740LiveRecovery as inspect} from '../../tools/ci/mid-740-live-recovery-readback.mjs';
import {REQUIRED_ASSETS} from '../../tools/ci/mid-740-immutable-recovery-qa.mjs';
const SHA='a'.repeat(40),VER='0.9.85.487',TAG='v'+VER,ID=42;
const PREFIX='repos/MeteoMartini/MID/',API='https://api.github.com/repos/MeteoMartini/MID';
const SITE='https://github.com/MeteoMartini/MID';
function fixture(){
 const independentDigests=Object.fromEntries(REQUIRED_ASSETS.map((n,i)=>[n,'sha256:'+String(i+1).repeat(64)]));
 const assets=REQUIRED_ASSETS.map((name,i)=>({
  id:100+i,name,state:'uploaded',size:10000+i,digest:independentDigests[name],
  url:API+'/releases/assets/'+(100+i),
  browser_download_url:SITE+'/releases/download/'+TAG+'/'+name
 }));
 const release={id:ID,tag_name:TAG,url:API+'/releases/'+ID,
  html_url:SITE+'/releases/tag/'+TAG,immutable:true,draft:false,prerelease:false,
  created_at:'2026-11-16T11:00:00Z',published_at:'2026-11-16T11:02:00Z',
  assets:structuredClone(assets)};
 const responses:Record<string,any>={
  '':{id:1305110795,full_name:'MeteoMartini/MID'},
  'git/ref/heads/main':{ref:'refs/heads/main',object:{type:'commit',sha:SHA}},
  'git/ref/heads/mid-stable':{ref:'refs/heads/mid-stable',object:{type:'commit',sha:SHA}},
  ['releases/tags/'+TAG]:release,
  ['git/ref/tags/'+TAG]:{ref:'refs/tags/'+TAG,object:{type:'commit',sha:SHA}},
  ['releases/'+ID+'/assets?per_page=100&page=1']:structuredClone(assets)
 };
 for(const a of assets)responses['releases/assets/'+a.id]=structuredClone(a);
 const get=async(path:string)=>{
  if(path!==PREFIX.slice(0,-1)&&!path.startsWith(PREFIX))throw Error('WRONG_PATH');
  const name=path===PREFIX.slice(0,-1)?'':path.slice(PREFIX.length);
  if(!(name in responses))throw Error('MISSING');
  return structuredClone(responses[name]);
 };
 return {responses,get,args:{version:VER,expectedSourceSha:SHA,independentDigests}};
}
const attempt=async(mutate:(x:ReturnType<typeof fixture>)=>void)=>{
 const x=fixture();mutate(x);return inspect(x.args,x.get);
};
describe('MID 740 live immutable release readback: adversarial QA only',()=>{
 it('can qualify exact synthetic metadata but never release, restore or attest',async()=>{
  const x=await attempt(()=>{});
  expect(x.status).toBe('METADATA_COHERENT_QA_ONLY');
  expect(x.metadataVerified).toBe(true);expect(x.assets).toHaveLength(3);
  for(const k of ['bytesVerified','attestationVerified','sourceBotVerified','reviewEnforced','recoveryAuthorized','releaseAuthorized'])
   expect(x[k]).toBe(false);
 });
 it('supports independently dereferenced annotated tags',async()=>{
  expect((await attempt(x=>{
   x.responses['git/ref/tags/'+TAG].object={type:'tag',sha:'c'.repeat(40)};
   x.responses['git/tags/'+'c'.repeat(40)]={sha:'c'.repeat(40),tag:TAG,object:{type:'commit',sha:SHA}};
  })).status).toBe('METADATA_COHERENT_QA_ONLY');
  expect((await attempt(x=>{
   x.responses['git/ref/tags/'+TAG].object={type:'tag',sha:'c'.repeat(40)};
   x.responses['git/tags/'+'c'.repeat(40)]={sha:'c'.repeat(40),tag:TAG,object:{type:'commit',sha:'b'.repeat(40)}};
  })).status).toBe('BLOCKED');
 });
 it.each([
  ['repo ID',x=>{x.responses[''].id=1}],
  ['main SHA',x=>{x.responses['git/ref/heads/main'].object.sha='b'.repeat(40)}],
  ['stable SHA',x=>{x.responses['git/ref/heads/mid-stable'].object.sha='b'.repeat(40)}],
  ['tag SHA',x=>{x.responses['git/ref/tags/'+TAG].object.sha='b'.repeat(40)}],
  ['missing release',x=>{delete x.responses['releases/tags/'+TAG]}],
  ['missing tag',x=>{delete x.responses['git/ref/tags/'+TAG]}],
  ['mutable release',x=>{x.responses['releases/tags/'+TAG].immutable=false}],
  ['draft',x=>{x.responses['releases/tags/'+TAG].draft=true}],
  ['fake release URL',x=>{x.responses['releases/tags/'+TAG].url='https://evil.invalid'}],
  ['missing asset list',x=>{x.responses['releases/'+ID+'/assets?per_page=100&page=1'].pop()}],
  ['missing asset detail',x=>{delete x.responses['releases/assets/100']}],
  ['changed asset digest',x=>{x.responses['releases/assets/100'].digest='sha256:'+'f'.repeat(64)}],
  ['fake asset URL',x=>{x.responses['releases/assets/100'].browser_download_url='https://evil.invalid'}],
  ['duplicate asset',x=>{x.responses['releases/tags/'+TAG].assets[1].id=100}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s blocks',async(_,f)=>{
  expect((await attempt(f)).status).toBe('BLOCKED');
 });
 it('requires separately verified independent binary SHA256 evidence',async()=>{
  const x=await attempt(v=>{v.args.independentDigests={} as any});
  expect(x.reason).toBe('INDEPENDENT_DIGEST_EVIDENCE_REQUIRED');
  const y=await attempt(v=>{v.args.independentDigests[REQUIRED_ASSETS[0]]='sha256:'+'e'.repeat(64)});
  expect(y.status).toBe('BLOCKED');
 });
 it('blocks a main branch change during GitHub readback',async()=>{
  const x=fixture();let reads=0;
  const get=async(path:string)=>{
   const v=await x.get(path);
   if(path===PREFIX+'git/ref/heads/main'&&++reads===2)v.object.sha='f'.repeat(40);
   return v;
  };
  expect((await inspect(x.args,get)).reason).toBe('FINAL_READBACK_RACE');
 });
 it('blocks a release digest change after complete asset inventory',async()=>{
  const x=fixture();let reads=0;
  const get=async(path:string)=>{
   const v=await x.get(path);
   if(path===PREFIX+'releases/tags/'+TAG&&++reads===2)v.assets[0].digest='sha256:'+'e'.repeat(64);
   return v;
  };
  expect((await inspect(x.args,get)).reason).toBe('FINAL_READBACK_RACE');
 });
});