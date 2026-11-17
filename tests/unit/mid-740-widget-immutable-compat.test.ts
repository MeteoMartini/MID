import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessMid740WidgetImmutableCompatibility as check} from '../../tools/ci/mid-740-widget-immutable-compat.mjs';
const SHA='a'.repeat(40);
const names=['manifest.json','mid-widget-export-latest.zip',
 'mid-widget-export-latest.zip.sha256','SHA256SUMS.txt'];
const installed=readFileSync('.github/workflows/widget-export.yml','utf8');
const canonical=readFileSync('ci/github/workflows/widget-export.yml','utf8');
const release=()=>({id:404735658,tag_name:'widget-latest',
 immutable:false,draft:false,prerelease:true,
 assets:names.map((name,i)=>({name,id:i+100,state:'uploaded',size:200+i}))});
const input=(updates:any={})=>({installedWorkflow:installed,canonicalWorkflow:canonical,
 mainSha:SHA,stableSha:SHA,release:release(),...updates});
describe('MID #740: rolling widget release vs global immutable policy',()=>{
 it('retains exact installed/canonical workflow bytes and existing rolling URL',()=>{
  expect(installed).toBe(canonical);
  expect(installed).toContain('gh release upload "$tag"');
  expect(installed).toContain('--clobber');
  expect(installed).toContain('gh release create "$tag"');
  expect(installed).toContain('gh release edit "$tag"');
 });
 it('recognizes existing mutable metadata but never authorizes a policy cutover',()=>{
  expect(check(input())).toMatchObject({
   status:'EXISTING_ROLLING_RELEASE_METADATA_QA_ONLY',
   currentRollingReleaseMetadataVerified:true,
   futureRollingReleaseRecreationSafe:false,
   rollingRecoveryVerified:false,releaseByteProvenanceVerified:false,
   globalImmutabilityCutoverAuthorized:false,
   widgetPublishingAuthorized:false,releaseAuthorized:false
  });
 });
 it('blocks missing, immutable, unpublished, foreign-tag or invalid-ID rolling releases',()=>{
  for(const altered of [null,{...release(),immutable:true},
   {...release(),draft:true},{...release(),prerelease:false},
   {...release(),tag_name:'widget-new'},{...release(),id:0}]){
   expect(check(input({release:altered}))).toMatchObject({
    status:'BLOCKED',globalImmutabilityCutoverAuthorized:false,
    widgetPublishingAuthorized:false,releaseAuthorized:false
   });
  }
 });
 it('blocks missing, renamed, duplicated, invalid and unexpected release assets',()=>{
  const base=release(),rows=[
   {...base,assets:base.assets.slice(1)},
   {...base,assets:base.assets.map((x,i)=>i===0?{...x,name:'foreign'}:x)},
   {...base,assets:base.assets.map((x,i)=>i===0?{...x,name:base.assets[1].name}:x)},
   {...base,assets:base.assets.map((x,i)=>i===0?{...x,state:'starter'}:x)},
   {...base,assets:base.assets.map((x,i)=>i===0?{...x,size:0}:x)},
   {...base,assets:[...base.assets,{name:'unexpected',id:900,size:1,state:'uploaded'}]}
  ];
  for(const v of rows)expect(check(input({release:v}))).toMatchObject({
   status:'BLOCKED',reason:'WIDGET_RELEASE_ASSET_INVENTORY_DRIFT'
  });
 });
 it('blocks main/Stable drift and rolling create/upload workflow mutation',()=>{
  const changedCreate=installed.replace('gh release create "$tag"','gh release create "new-tag"');
  const changedUpload=installed.replace('--clobber','--skip-existing');
  for(const patch of [
   {mainSha:'b'.repeat(40)},{stableSha:'z'.repeat(40)},
   {canonicalWorkflow:canonical+'# drift'},
   {installedWorkflow:changedCreate,canonicalWorkflow:changedCreate},
   {installedWorkflow:changedUpload,canonicalWorkflow:changedUpload}
  ])expect(check(input(patch))).toMatchObject({
   status:'BLOCKED',globalImmutabilityCutoverAuthorized:false
  });
 });
});
