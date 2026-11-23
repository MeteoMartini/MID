import {describe,it,expect} from 'vitest';
import {assessMidCatalogEvidence,renderMidCatalogBody,verifyMidCatalogReadback,verifyMidExistingCatalogLatest,verifyMidTagReservation} from '../../tools/release/publish-verified-release-catalog.mjs';
const sha='a'.repeat(40),packageSha='b'.repeat(40),mergeSha='c'.repeat(40),
 version='0.9.85.497',runId=44121560818;
const green=name=>({name,status:'completed',conclusion:'success'});
const names=[
 'Release-ZIP prüfen und immutable Snapshot vorbereiten',
 'Release-Core, Build, Audit und iOS prüfen',
 'Vollständig geprüften Release sammeln und committen',
 'Geprüften MID-Worker sicher automatisch veröffentlichen',
 'GitHub-Pages-Artefakt parallel vorbereiten',
 'Erfolgreichen Pages-/Worker-Release finalisieren',
 'MID auf GitHub Pages veröffentlichen · Versuch 1',
 ...['core-1/4','core-2/4','core-3/4','core-4/4'].map(x=>'Release-Core-Regression · '+x),
 ...['heavy-mountain-visual ·','heavy-native-map ·','heavy-browser-state ·',
 'heavy-unified-map · 1/3','heavy-unified-map · 2/3',
 'heavy-unified-map · 3/3'].map(x=>'Release-Heavy · '+x)
];
const baseline=()=>({
 repo:'MeteoMartini/MID',releaseSha:sha,localSha:sha,mainSha:sha,stableSha:sha,
 versions:{package:version,baseline:version,registry:version,public:version,source:version,notes:version},
 notes:{schema:1,version,title:'Release',date:'2026-11-17',external:['User change']},
 runId,attempt:1,
 run:{id:runId,run_attempt:1,repository:{full_name:'MeteoMartini/MID'},
  path:'MeteoMartini/MID/.github/workflows/install-mid.yml@refs/heads/main',
  event:'workflow_dispatch',status:'in_progress',conclusion:null,head_sha:packageSha},
 stableCommit:{sha,parents:[{sha:packageSha}]},
 packageCommit:{sha:packageSha,parents:[{sha:mergeSha}]},
 packageCompare:{status:'ahead',ahead_by:1,behind_by:0,total_commits:1,
  base_commit:{sha:mergeSha},commits:[{sha:packageSha}],
  files:[{filename:'MID-professional-replacement.zip',status:'added'}]},
 jobs:[...names.map(green),{name:'SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren',status:'in_progress',conclusion:null}],tagRef:null,existingRelease:null
});
const evalWith=patch=>assessMidCatalogEvidence({...baseline(),...patch});
const reject=patch=>expect(evalWith(patch)).toMatchObject({
 state:'BLOCKED',createAllowed:false,recoveryAuthorized:false
});
describe('MID post-Stable GitHub Releases catalog eligibility (not recovery authority)',()=>{
 it('accepts only exact full Source/Core/Heavy/Worker/Pages/Stable receipts',()=>{
  expect(evalWith({})).toMatchObject({state:'ELIGIBLE_METADATA_ONLY',
   createAllowed:true,recoveryAuthorized:false});
 });
 it('fail-closes on SHA or repository mismatch',()=>{
  reject({mainSha:'b'.repeat(40)});reject({stableSha:'b'.repeat(40)});
  reject({localSha:'b'.repeat(40)});reject({repo:'other/repo'});
 });
 it('fails on incomplete version mirrors or missing current source notes',()=>{
  reject({versions:{...baseline().versions,registry:'0.9.85.488'}});
  reject({versions:{package:version}});
  reject({notes:{...baseline().notes,external:[]}});
  reject({notes:{...baseline().notes,version:'0.9.85.488'}});
 });
 it('refuses same-sized version mirrors with wrong field names (release contract)',()=>{
  const {notes: _missingNotes,...withoutNotes}=baseline().versions;
  reject({versions:{...withoutNotes,placeholder:version}});
  const {source: _missingSource,...withoutSource}=baseline().versions;
  reject({versions:{...withoutSource,sourceTypo:version}});
 });
 it('requires original installer id, attempt, workflow and event',()=>{
  reject({runId:5});reject({attempt:2});
  reject({run:{...baseline().run,event:'push'}});
  reject({run:{...baseline().run,path:'other.yml'}});
  reject({run:{...baseline().run,repository:{full_name:'other/repo'}}});
  reject({run:{...baseline().run,status:'completed',conclusion:'success'}});
 });
 it('refuses failed, absent or duplicated mandatory jobs and Pages',()=>{
  for(const name of names){
   reject({jobs:baseline().jobs.filter(x=>x.name!==name)});
   reject({jobs:baseline().jobs.map(x=>x.name===name?{...x,conclusion:'failure'}:x)});
  }
  reject({jobs:[...baseline().jobs,green(names[0])]});
 });
 it('atomically reserved tag must match both created and independently reread ref',()=>{
  const tag='v'+version,ref={ref:'refs/tags/'+tag,object:{type:'commit',sha}};
  expect(verifyMidTagReservation({createdTag:ref,readback:ref,tag,sha})).toBe(true);
  expect(verifyMidTagReservation({createdTag:ref,readback:{...ref,object:{type:'commit',sha:mergeSha}},tag,sha})).toBe(false);
  expect(verifyMidTagReservation({createdTag:{...ref,object:{type:'tag',sha}},readback:ref,tag,sha})).toBe(false);
  expect(verifyMidTagReservation({createdTag:ref,readback:ref,tag:'v0.9.85.488',sha})).toBe(false);
 });
 it('rejects installer/Stable commits not belonging to exact ZIP-only lineage',()=>{
  reject({run:{...baseline().run,head_sha:'d'.repeat(40)}});
  reject({stableCommit:{...baseline().stableCommit,parents:[{sha:'d'.repeat(40)}]}});
  reject({stableCommit:{...baseline().stableCommit,parents:[]}});
  reject({packageCommit:{...baseline().packageCommit,parents:[]}});
  reject({packageCommit:{...baseline().packageCommit,sha:'d'.repeat(40)}});
  reject({packageCompare:{...baseline().packageCompare,total_commits:2}});
  reject({packageCompare:{...baseline().packageCompare,status:'diverged'}});
  reject({packageCompare:{...baseline().packageCompare,commits:[{sha:'d'.repeat(40)}]}});
  reject({packageCompare:{...baseline().packageCompare,files:[]}});
  reject({packageCompare:{...baseline().packageCompare,files:[{filename:'MID-professional-replacement.zip',status:'modified'}]}});
  reject({packageCompare:{...baseline().packageCompare,files:[...baseline().packageCompare.files,{filename:'worker.js',status:'modified'}]}});
 });
 it('refuses competing annotated or foreign tags',()=>{
  reject({tagRef:{ref:'refs/tags/v'+version,object:{type:'commit',sha:'b'.repeat(40)}}});
  reject({tagRef:{ref:'refs/tags/v'+version,object:{type:'tag',sha}}});
 });
 it('accepts a skipped optional Pages preparation only with exactly one successful real deploy',()=>{
  const jobs=baseline().jobs.map(j=>j.name==='GitHub-Pages-Artefakt parallel vorbereiten'||
   j.name==='MID auf GitHub Pages veröffentlichen · Versuch 1'?{...j,conclusion:'skipped'}:j);
  jobs.push(green('MID auf GitHub Pages veröffentlichen · Versuch 2'));
  expect(evalWith({jobs})).toMatchObject({state:'ELIGIBLE_METADATA_ONLY',createAllowed:true});
  reject({jobs:jobs.map(j=>j.name.includes('MID auf GitHub Pages veröffentlichen')?{...j,conclusion:'skipped'}:j)});
  reject({jobs:jobs.map(j=>j.name==='GitHub-Pages-Artefakt parallel vorbereiten'?{...j,conclusion:'failure'}:j)});
  reject({jobs:[...jobs,green('MID auf GitHub Pages veröffentlichen · Versuch 3')]});
 });
 it('rejects missing or finished self-job and any unrelated failed installer job',()=>{
  const jobs=baseline().jobs,name='SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren';
  reject({jobs:jobs.filter(j=>j.name!==name)});
  reject({jobs:jobs.map(j=>j.name===name?{...j,status:'completed',conclusion:'success'}:j)});
  reject({jobs:[...jobs,{name,conclusion:null,status:'in_progress'}]});
  reject({jobs:[...jobs,{name:'Unrelated failed gate',status:'completed',conclusion:'failure'}]});
 });
 it('permits only superseded failed Pages attempts before a later real successful deploy',()=>{
  const jobs=baseline().jobs.map(j=>j.name==='MID auf GitHub Pages veröffentlichen · Versuch 1'
    ?{...j,conclusion:'failure'}:j);
  jobs.push(green('MID auf GitHub Pages veröffentlichen · Versuch 2'));
  expect(evalWith({jobs})).toMatchObject({state:'ELIGIBLE_METADATA_ONLY',createAllowed:true});
  reject({jobs:[...jobs,{name:'MID auf GitHub Pages veröffentlichen · Versuch 3',
    status:'completed',conclusion:'failure'}]});
  reject({jobs:[...jobs,{name:'MID auf GitHub Pages veröffentlichen · Versuch 3',
    status:'completed',conclusion:'cancelled'}]});
  reject({jobs:jobs.map(j=>j.name==='MID auf GitHub Pages veröffentlichen · Versuch 2'
    ?{...j,conclusion:'skipped'}:j)});
  reject({jobs:[...jobs,{name:'Unrelated mandatory job',status:'completed',conclusion:'failure'}]});
 });
 it('refuses ambiguous multi-success or failing Pages attempts',()=>{
  reject({jobs:[...baseline().jobs,green('MID auf GitHub Pages veröffentlichen · Versuch 2')]});
  reject({jobs:[...baseline().jobs,{name:'MID auf GitHub Pages veröffentlichen · Versuch 2',status:'completed',conclusion:'failure'}]});
 });
 it('blocks a pre-existing tag without independently matching release',()=>{
  reject({tagRef:{ref:'refs/tags/v'+version,object:{type:'commit',sha}}});
 });
 it('idempotence requires exact verified metadata rather than embedded SHA tokens',()=>{
  const tagRef={ref:'refs/tags/v'+version,object:{type:'commit',sha}};
  const tag='v'+version;
  const body=renderMidCatalogBody({tag,notes:baseline().notes,sha,runId});
  const release={id:1,tag_name:tag,name:'MID '+tag,draft:false,prerelease:false,assets:[],body};
  expect(evalWith({tagRef,existingRelease:release})).toMatchObject({
   state:'EXISTS',createAllowed:false,recoveryAuthorized:false});
  reject({existingRelease:release});
  reject({tagRef,existingRelease:{...release,draft:true}});
  reject({tagRef,existingRelease:{...release,body:'wrong SHA '+sha+' '+tag}});
  reject({tagRef,existingRelease:{...release,body:body.replace('actions/runs/'+runId,'actions/runs/999')}});
  reject({tagRef,existingRelease:{...release,assets:[{name:'unverified.zip'}]}});
  reject({tagRef,existingRelease:{...release,name:'Another publisher'}});
  reject({tagRef,existingRelease:{...release,tag_name:'v0.9.85.488'}});
 });
 it('existing idempotent catalog must really be GitHub latest, not just match its tag',()=>{
  const tag='v'+version,body=renderMidCatalogBody({tag,notes:baseline().notes,sha,runId});
  const tagRef={ref:'refs/tags/'+tag,object:{type:'commit',sha}},
    existingRelease={id:15,tag_name:tag,name:'MID '+tag,
      draft:false,prerelease:false,assets:[],body};
  const evidence={tagRef,existingRelease,latestRelease:{id:15,tag_name:tag},tag,sha,body};
  expect(verifyMidExistingCatalogLatest(evidence)).toBe(true);
  expect(verifyMidExistingCatalogLatest({...evidence,latestRelease:{id:14,tag_name:tag}})).toBe(false);
  expect(verifyMidExistingCatalogLatest({...evidence,latestRelease:{id:15,tag_name:'v0.9.85.119'}})).toBe(false);
  expect(verifyMidExistingCatalogLatest({...evidence,tagRef:{...tagRef,object:{type:'commit',sha:'b'.repeat(40)}}})).toBe(false);
 });
 it('readback requires real latest-release identity, exact tag, SHA and metadata',()=>{
  const tag='v'+version,body=renderMidCatalogBody({tag,notes:baseline().notes,sha,runId});
  const created={id:15},postTag={ref:'refs/tags/'+tag,object:{type:'commit',sha}},
        postRelease={id:15,tag_name:tag,name:'MID '+tag,draft:false,prerelease:false,assets:[],body},
        latestRelease={id:15,tag_name:tag};
  const original={created,postTag,postRelease,latestRelease,tag,sha,body};
  expect(verifyMidCatalogReadback(original)).toBe(true);
  expect(verifyMidCatalogReadback({...original,latestRelease:{id:14,tag_name:tag}})).toBe(false);
  expect(verifyMidCatalogReadback({...original,postTag:{...postTag,object:{type:'tag',sha}}})).toBe(false);
  expect(verifyMidCatalogReadback({...original,postRelease:{...postRelease,body:'stale '+sha}})).toBe(false);
  expect(verifyMidCatalogReadback({...original,postRelease:{...postRelease,assets:[{name:'recovery.zip'}]}})).toBe(false);
 });
});
