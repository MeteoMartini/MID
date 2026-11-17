import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
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
it.each(['clean','clean-restore','digest','symlink','missing','attestation','metadata-race',
 'tree-mismatch','restore-failure','installer-signed','installer-unsigned','installer-wrong-digest',
 'installer-snapshot-valid','installer-snapshot-partial','installer-snapshot-malformed',
 'installer-snapshot-null','installer-snapshot-number'] as const)(
 'verifies recovery asset bytes and attestation, or blocks %s',async kind=>{
  const x=fixture(),directory=mkdtempSync(join(tmpdir(),'mid740-recovery-'));
  try{
   const assets=x.responses['releases/'+ID+'/assets?per_page=100&page=1'];
   for(const a of assets){
    const bytes=Buffer.from('original verified evidence '+a.name);
    a.size=bytes.length;
    a.digest='sha256:'+createHash('sha256').update(bytes).digest('hex');
    x.args.independentDigests[a.name]=a.digest;
    x.responses['releases/assets/'+a.id]=structuredClone(a);
    writeFileSync(join(directory,a.name),bytes);
   }
   x.responses['releases/tags/'+TAG].assets=structuredClone(assets);
   const installerEvidence=kind.startsWith('installer-');
   if(installerEvidence){
    const manifest=assets.find(a=>a.name==='MID-release-manifest.json');
    const dist=assets.find(a=>a.name==='MID-dist-release.zip');
    const snapshotFields:Record<string,unknown>={};
    if(kind.startsWith('installer-snapshot-')){
     snapshotFields.snapshotManifestSha256='d'.repeat(64);
     snapshotFields.snapshotArchiveSha256='e'.repeat(64);
     if(kind==='installer-snapshot-partial')delete snapshotFields.snapshotArchiveSha256;
     if(kind==='installer-snapshot-malformed')snapshotFields.snapshotArchiveSha256='sha256:'+'e'.repeat(64);
     if(kind==='installer-snapshot-null')snapshotFields.snapshotManifestSha256=null;
     if(kind==='installer-snapshot-number')snapshotFields.snapshotManifestSha256=123;
    }
    const bytes=Buffer.from(JSON.stringify({...snapshotFields,schema:'mid.740.installer-dist.v1',version:VER,
     sourceSha:SHA,distTreeSha:'c'.repeat(40),
     distDigest:kind==='installer-wrong-digest'?'sha256:'+'f'.repeat(64):dist.digest}));
    manifest.size=bytes.length;
    manifest.digest='sha256:'+createHash('sha256').update(bytes).digest('hex');
    x.args.independentDigests[manifest.name]=manifest.digest;
    x.responses['releases/assets/'+manifest.id]=structuredClone(manifest);
    x.responses['releases/tags/'+TAG].assets=structuredClone(assets);
    writeFileSync(join(directory,manifest.name),bytes);
   }
   const first=join(directory,REQUIRED_ASSETS[0]);
   if(kind==='digest')writeFileSync(first,Buffer.alloc(assets[0].size));
   if(kind==='missing'||kind==='symlink')rmSync(first);
   if(kind==='symlink')symlinkSync(join(directory,REQUIRED_ASSETS[1]),first);
   const verified:string[]=[];
   const restoreDestination=join(directory,'restored');
   const tree='b'.repeat(40),distTree='c'.repeat(40);
   x.responses['git/commits/'+SHA]={sha:SHA,tree:{sha:tree}};
   x.responses['git/trees/'+tree]={sha:tree,truncated:false,tree:[
    {path:'dist',mode:'040000',type:'tree',sha:kind==='tree-mismatch'?'invalid':distTree}
   ]};
   let restoreCalls=0;
   const proof=await inspect({...x.args,assetDirectory:directory,installerEvidence,
    restoreDestination:kind==='clean'?undefined:restoreDestination},x.get,async(tag,path)=>{
    expect(tag).toBe(TAG);
    verified.push(path);
    if(kind==='metadata-race')
     x.responses['git/ref/heads/main'].object.sha='f'.repeat(40);
    return kind!=='attestation';
   },async(archive,destination,digest,expectedTree,version)=>{
    restoreCalls++;
    expect(verified).toHaveLength(3);
    expect([archive,destination,digest,expectedTree,version]).toEqual([
     join(directory,'MID-dist-release.zip'),restoreDestination,
     x.args.independentDigests['MID-dist-release.zip'].slice(7),distTree,VER
    ]);
    if(kind==='restore-failure')throw Error('zip changed after attestation');
    return {status:'DIST_RESTORED_QA_ONLY',distTreeSha:distTree,
     version:VER,files:151,recoveryAuthorized:false,releaseAuthorized:false};
   },async(bytes,sourceSha)=>{
    expect(sourceSha).toBe(SHA);
    expect(JSON.parse(bytes.toString('utf8')).schema).toBe('mid.740.installer-dist.v1');
    return kind!=='installer-unsigned';
   });
   expect(restoreCalls).toBe(['clean-restore','restore-failure','installer-signed','installer-snapshot-valid'].includes(kind)?1:0);
   if(kind==='clean'){
    expect(verified).toEqual(REQUIRED_ASSETS.map(name=>join(directory,name)));
    expect(proof).toMatchObject({status:'ATTESTED_ASSETS_VERIFIED_QA_ONLY',
     bytesVerified:true,attestationVerified:true,recoveryAuthorized:false,releaseAuthorized:false});
   }else if(kind==='clean-restore'||kind==='installer-signed'||kind==='installer-snapshot-valid'){
    expect(proof).toMatchObject({status:'ATTESTED_DIST_RESTORED_QA_ONLY',distTreeSha:distTree,
     restoredFiles:151,bytesVerified:true,attestationVerified:true,
     distTreeEvidence:installerEvidence?'installer-attestation':'stable-git-tree',
     recoveryAuthorized:false,releaseAuthorized:false});
   }else{
    expect(proof).toMatchObject({status:'BLOCKED',recoveryAuthorized:false,releaseAuthorized:false});
    if(kind.startsWith('installer-snapshot-'))expect(proof.reason).toBe('INSTALLER_SNAPSHOT_DIGESTS_INVALID');
    if(['digest','symlink','missing'].includes(kind))expect(verified).toEqual([]);
   }
  }finally{rmSync(directory,{recursive:true,force:true})}
 });
