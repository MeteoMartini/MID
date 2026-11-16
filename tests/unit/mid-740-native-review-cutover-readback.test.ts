import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {inspectMid740NativeReviewCutover as check} from '../../tools/ci/mid-740-native-review-cutover-readback.mjs';
const R='repos/MeteoMartini/MID',SHA='a78465b655d25cafc9ecc0390080694cb7aca957';
const IDs=[20109260,21919727,23917545,23917807,23963851];
function file(path:string,source:string){
 const buf=Buffer.from(source,'utf8');
 return {path,type:'file',encoding:'base64',size:buf.length,
  content:buf.toString('base64'),
  sha:createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex')};
}
function fixture(){
 const summary=IDs.map(id=>({id,enforcement:'active',name:{
  20109260:'Basic Protection',21919727:'MID Stable Protection',
  23917545:'MID Trusted Agent Branches',
  23917807:'MID Replit Handoff Guard',23963851:'MID Production Branch Guard'
 }[id]}));
 const detail=summary.map(x=>({
  ...x,bypass_actors:[],
  conditions:{ref_name:{include:[],exclude:[]}},
  rules:[{type:'deletion'},{type:'non_fast_forward'}]
 }));
 const prod=detail.find(x=>x.id===23963851)!;
 prod.conditions.ref_name.include=['refs/heads/main','refs/heads/mid-stable'];
 prod.rules.push({type:'update'});
 prod.bypass_actors=[{actor_id:5059236,actor_type:'Integration',bypass_mode:'always'}];
 const stable=detail.find(x=>x.id===21919727)!;
 stable.conditions.ref_name.include=['refs/heads/mid-stable'];
 stable.rules.push({type:'required_status_checks',parameters:{
  required_status_checks:[{context:'MID / release-candidate-quality',integration_id:5059236}]}});
 const d:Record<string,any>={
  [R]:{id:1305110795,full_name:'MeteoMartini/MID',owner:{type:'User'}},
  [R+'/branches/main']:{name:'main',commit:{sha:SHA}},
  [R+'/branches/mid-stable']:{name:'mid-stable',commit:{sha:SHA}},
  [R+'/rulesets?per_page=100']:summary,
  [R+'/contents/.github/workflows/agent-source-release.yml?ref='+SHA]:
   file('.github/workflows/agent-source-release.yml',
    'node tools/ci/mid-review-premerge-guard.mjs\ngh api --method PUT\n'+'git push origin HEAD:main\n'),
  [R+'/contents/.github/workflows/install-mid.yml?ref='+SHA]:
   file('.github/workflows/install-mid.yml','git push origin HEAD:main\n')
 };
 detail.forEach(x=>{d[R+'/rulesets/'+x.id]=x});
 const get=async(path:string)=>{
  if(!(path in d))throw Error('GH_API_READ_FORBIDDEN');
  return structuredClone(d[path]);
 };
 return {d,get};
}
describe('#740 native review cutover: real GitHub rulesets and legacy main write paths',()=>{
 it('readable legacy evidence always BLOCKS no-bypass cutover; classic protection UNKNOWN',async()=>{
  const x=await check(fixture().get);
  expect(x).toMatchObject({
   status:'LEGACY_MAIN_WRITES_BLOCK_NO_BYPASS_CUTOVER_QA_ONLY',
   registryAndRuleDetailsVerified:true,
   twoLegacyMainWritePathsSHAAndBlobVerified:true,
   productionRulesetHasRequiredPR:false,
   rulesetBypassActorsVerified:true,
   productionReleaseIntegrationAlwaysBypasses:true,
   classicProtection:{main:'UNVERIFIED','mid-stable':'UNVERIFIED'},
   protectedBranchPoliciesFullyVisible:false,
   nativeReviewEnforcementVerified:false,
   noBypassCutoverCompatible:false,
   installerAuthorized:false,cutoverAuthorized:false,releaseAuthorized:false
  });
 });
 it('redacted GitHub Actions bypass actor fields remain explicitly UNVERIFIED and blocked',async()=>{
  const x=fixture();
  for(const id of IDs)delete x.d[R+'/rulesets/'+id].bypass_actors;
  const result=await check(x.get);
  expect(result).toMatchObject({
   status:'BYPASS_ACTORS_UNVERIFIED_CUTOVER_BLOCKED_QA_ONLY',
   registryAndRuleDetailsVerified:true,
   twoLegacyMainWritePathsSHAAndBlobVerified:true,
   rulesetBypassActorsVerified:false,
   productionReleaseIntegrationAlwaysBypasses:null,
   nativeReviewEnforcementVerified:false,
   noBypassCutoverCompatible:false,
   cutoverAuthorized:false,releaseAuthorized:false
  });
 });
 it('partial actor field redaction never silently qualifies the full policy',async()=>{
  const x=fixture();
  delete x.d[R+'/rulesets/23963851'].bypass_actors;
  const result=await check(x.get);
  expect(result).toMatchObject({status:'BLOCKED',
    reason:'PARTIAL_BYPASS_VISIBILITY_INCONSISTENT'});
 });
 it('a readable classic branch protection is still NOT a positive cutover authorization',async()=>{
  const x=fixture();
  for(const branch of ['main','mid-stable'])
   x.d[R+'/branches/'+branch+'/protection']={required_pull_request_reviews:{required_approving_review_count:1}};
  const out=await check(x.get);
  expect(out.classicProtection).toEqual({main:'READABLE','mid-stable':'READABLE'});
  expect(out.nativeReviewEnforcementVerified).toBe(false);
  expect(out.cutoverAuthorized).toBe(false);
 });
 it.each([
  ['wrong repo',x=>{x.d[R].id=1}],
  ['stale stable',x=>{x.d[R+'/branches/mid-stable'].commit.sha='b'.repeat(40)}],
  ['missing registry entry',x=>{x.d[R+'/rulesets?per_page=100'].pop()}],
  ['inactive production guard',x=>{x.d[R+'/rulesets/23963851'].enforcement='disabled'}],
  ['production branch target removed',x=>{x.d[R+'/rulesets/23963851'].conditions.ref_name.include.pop()}],
  ['release bot bypass disappears',x=>{x.d[R+'/rulesets/23963851'].bypass_actors=[]}],
  ['different bypass actor',x=>{x.d[R+'/rulesets/23963851'].bypass_actors[0].actor_id=1}],
  ['new native review rule (requires new qualification)',x=>{x.d[R+'/rulesets/23963851'].rules.push({type:'pull_request'})}],
  ['missing stable required check',x=>{x.d[R+'/rulesets/21919727'].rules.pop()}],
  ['source ZIP push changed',x=>{x.d[R+'/contents/.github/workflows/agent-source-release.yml?ref='+SHA].content=
    Buffer.from('node tools/ci/mid-review-premerge-guard.mjs\n').toString('base64')}],
  ['forged trusted workflow SHA',x=>{x.d[R+'/contents/.github/workflows/install-mid.yml?ref='+SHA].sha='0'.repeat(40)}],
  ['missing installer workflow',x=>{delete x.d[R+'/contents/.github/workflows/install-mid.yml?ref='+SHA]}],
  ['repo name swapped',x=>{x.d[R].full_name='other/repo'}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s must block evidence',async(_,mutate)=>{
  const x=fixture();mutate(x);
  expect((await check(x.get)).status).toBe('BLOCKED');
 });
 it('blocks a race in main SHA after the initial metadata snapshot',async()=>{
  const x=fixture();let n=0;
  const out=await check(async path=>{
   const value=await x.get(path);
   if(path===R+'/branches/main'&&++n===2)value.commit.sha='c'.repeat(40);
   return value;
  });
  expect(out.reason).toBe('FINAL_POLICY_OR_STABLE_RACE');
 });
 it('blocks a ruleset mutation after a first successful read',async()=>{
  const x=fixture();let n=0;
  const out=await check(async path=>{
   const v=await x.get(path);
   if(path===R+'/rulesets/23963851'&&++n===2)
    v.bypass_actors[0].actor_id=4;
   return v;
  });
  expect(out.reason).toBe('FINAL_POLICY_OR_STABLE_RACE');
 });
});