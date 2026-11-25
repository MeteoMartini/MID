import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLogiccPilotHost,prepareLogiccCodeCandidate} from './logicc-pilot-host.mjs';
const sourceSha='a'.repeat(40),path='src/example.ts',text='export const n=1;\n';
const blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const baseBlob=blob(text),actor={id:123,login:'logicc-test[bot]',type:'Bot'};
const code={taskId:'pilot-1',sourceSha,files:[{path,baseBlob,content:'export const n=2;\n'}]};
const result={taskId:'pilot-1',sourceSha,status:'completed',summary:'Pilot ready',checks:['Offline only']};
const assignment=kind=>({taskId:'pilot-1',sourceSha,kind,expiresAt:new Date(Date.now()+60000).toISOString(),publicationApproved:true,paths:[path]});
const readBaseFile=async(s,p)=>({sourceSha:s,path:p,mode:'100644',type:'blob',blobSha:baseBlob,content:text});
function fixture(t,kind='code',patch={}){
  const claims=new Set();let posts=0,reads=0,issued=0,revoked=0,body;
  const deps={readAssignment:async()=>assignment(kind),readRefs:async()=>({main:sourceSha,stable:sourceSha}),readBaseFile,
    readQualification:async()=>({appId:5904572,installationId:9,repositoryId:1305110795,repository:'MeteoMartini/MID',privateApp:true,selectedOnly:true,isolationVerified:true,actorVerified:true,actor}),
    issueToken:async request=>{issued++;assert.deepEqual(request.permissions,{issues:'write',metadata:'read'});assert.deepEqual(request.repositoryIds,[1305110795]);return {token:'synthetic-only',permissions:request.permissions,repositoryIds:request.repositoryIds,expires_at:new Date(Date.now()+60000).toISOString()};},
    revokeToken:async token=>{revoked++;assert.equal(token,'synthetic-only');return true;},
    receiptNamespace:{getByName:()=>({claim:async key=>{if(claims.has(key))return 'existing';claims.add(key);return 'claimed';}})},
    ...patch
  };
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    assert.equal(new URL(url).origin,'https://api.github.com');
    assert.equal(init.headers.Authorization,'Bearer synthetic-only');
    if(init.method==='POST'){assert.equal(url,'https://api.github.com/repos/MeteoMartini/MID/issues/1007/comments');posts++;body=JSON.parse(init.body).body;return Response.json({id:42},{status:201});}
    assert.equal(init.method,'GET');assert.equal(url,'https://api.github.com/repos/MeteoMartini/MID/issues/comments/42');reads++;
    return Response.json({id:42,url,issue_url:'https://api.github.com/repos/MeteoMartini/MID/issues/1007',body,user:actor});
  });
  return {host:createLogiccPilotHost(deps),counts:()=>[posts,reads,issued,revoked]};
}
test('code candidate exact base/new Git blob, bounded public envelope',async()=>{
  const c=await prepareLogiccCodeCandidate(code,assignment('code'),readBaseFile);
  assert.equal(c.payload.files[0].newBlob,blob(code.files[0].content));
  assert.equal(Buffer.from(c.payload.files[0].contentBase64,'base64').toString(),code.files[0].content);
  assert.equal(c.receipt.length,64);
});
test('code candidate rejects stale base, unapproved file, unchanged or credential content',async()=>{
  for(const f of [{...code.files[0],baseBlob:'b'.repeat(40)},{...code.files[0],path:'.github/workflows/x.yml'},{...code.files[0],content:text},{...code.files[0],content:'const secret = "long-secret-value";'},{...code.files[0],content:'x'.repeat(12289)}])
    await assert.rejects(prepareLogiccCodeCandidate({...code,files:[f]},assignment('code'),readBaseFile));
  await assert.rejects(prepareLogiccCodeCandidate(code,{...assignment('code'),publicationApproved:false},readBaseFile));
  await assert.rejects(prepareLogiccCodeCandidate(code,assignment('code'),async()=>({...await readBaseFile(sourceSha,path),mode:'120000'})));
});
test('one code POST/readback, token revoked, duplicate not sent',async t=>{
  const f=fixture(t);
  assert.equal((await f.host.submitCodeCandidate(code)).status,'posted');
  assert.equal((await f.host.submitCodeCandidate(code)).status,'already_claimed');
  assert.deepEqual(f.counts(),[1,1,1,1]);
});
test('existing result route remains fixed and token is revoked',async t=>{
  const f=fixture(t,'result');
  assert.equal((await f.host.submitResult(result)).status,'posted');
  assert.deepEqual(f.counts(),[1,1,1,1]);
});
test('unqualified actor, drift or missing publication approval cannot send',async t=>{
  const f=fixture(t,'code',{readRefs:async()=>({main:'b'.repeat(40),stable:sourceSha})});
  await assert.rejects(f.host.submitCodeCandidate(code),/drift/);
  assert.deepEqual(f.counts(),[0,0,0,0]);
});
test('broad token is not used; cleanup still required',async t=>{
  let cleaned=0;
  const f=fixture(t,'code',{issueToken:async()=>({token:'synthetic-only',permissions:{issues:'write',contents:'write',metadata:'read'},repositoryIds:[1305110795],expires_at:new Date(Date.now()+60000).toISOString()}),revokeToken:async()=>{cleaned++;return true;}});
  assert.equal((await f.host.submitCodeCandidate(code)).status,'reconciliation_required');
  assert.equal(cleaned,1);assert.equal(f.counts()[0],0);
});
test('cleanup failure preserves delivery status without claiming success',async t=>{
  const f=fixture(t,'code',{revokeToken:async()=>false});
  const r=await f.host.submitCodeCandidate(code);
  assert.equal(r.status,'token_cleanup_required');assert.equal(r.deliveryStatus,'posted');assert.equal(r.commentId,42);
});
