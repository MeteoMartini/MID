import {createHash} from 'node:crypto';
import {prepareLogiccResult,verifyLogiccComment} from './logicc-result.mjs';
import {sendLogiccResult,createLogiccCommentTransport} from './logicc-github-transport.mjs';
import {bindReceiptReservation} from './logicc-receipt-store.mjs';

const REPO='MeteoMartini/MID', REPO_ID=1305110795, APP_ID=5904572;
const sha=/^[a-f0-9]{40}$/, task=/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const keys=(o,k)=>record(o)&&Object.keys(o).sort().join(',')===k;
function need(ok,message){if(!ok)throw new Error(message);}
function safePath(p){
  return typeof p==='string'&&p.length<=200&&!p.includes('//')&&!/(^|\/)\.\.?($|\/)/.test(p)&&
    (/^src\/[A-Za-z0-9_./-]+\.(?:ts|tsx|css)$/.test(p)||/^tests\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs)$/.test(p));
}
function bytes(s){
  need(typeof s==='string'&&s.length>0&&!s.includes('\0'),'Invalid source text');
  const b=Buffer.from(s,'utf8');
  need(b.toString('utf8')===s&&b.length<=12_288,'Source text limit or invalid Unicode');
  need(!/-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_|\bgh[pousr]_[A-Za-z0-9_]{20,}|(?:Bearer\s+[A-Za-z0-9_-]{24,})|(?:token|secret|password|api[_ -]?key)\s*[:=]\s*['"][^'"]{8,}/i.test(s),'Potential credential');
  return b;
}
function blob(b){return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');}
function assignmentValid(a,id,kind){
  need(record(a)&&a.taskId===id&&task.test(id)&&sha.test(a.sourceSha??'')&&a.kind===kind&&Number.isFinite(Date.parse(a.expiresAt))&&Date.parse(a.expiresAt)>Date.now(),'Trusted assignment absent, expired or mismatched');
  if(kind==='code')need(a.publicationApproved===true&&Array.isArray(a.paths)&&a.paths.length>0&&a.paths.length<=2&&a.paths.every(safePath)&&new Set(a.paths).size===a.paths.length,'Public code scope not authorized');
  return a;
}
function qualify(q){
  need(record(q)&&q.appId===APP_ID&&positive(q.installationId)&&q.repositoryId===REPO_ID&&q.repository===REPO&&q.privateApp===true&&q.selectedOnly===true&&q.isolationVerified===true&&q.actorVerified===true&&keys(q.actor,'id,login,type')&&positive(q.actor.id)&&q.actor.type==='Bot'&&typeof q.actor.login==='string'&&/^[A-Za-z0-9-]+\[bot\]$/.test(q.actor.login),'Independent app and actor qualification missing');
  return q;
}
export async function prepareLogiccCodeCandidate(input,a,readBaseFile){
  need(keys(input,'files,sourceSha,taskId')&&input.taskId===a.taskId&&input.sourceSha===a.sourceSha&&Array.isArray(input.files)&&input.files.length>0&&input.files.length<=2,'Invalid code envelope');
  assignmentValid(a,input.taskId,'code');
  need(typeof readBaseFile==='function','Base reader missing');
  const files=[],seen=new Set();let total=0;
  for(const f of input.files){
    need(keys(f,'baseBlob,content,path')&&safePath(f.path)&&a.paths.includes(f.path)&&!seen.has(f.path)&&sha.test(f.baseBlob??''),'Unapproved, duplicate or malformed file');
    seen.add(f.path);
    const b=bytes(f.content);total+=b.length;need(total<=16_384,'Code envelope byte limit');
    const original=await readBaseFile(a.sourceSha,f.path);
    need(record(original)&&original.path===f.path&&original.sourceSha===a.sourceSha&&original.mode==='100644'&&original.type==='blob'&&original.blobSha===f.baseBlob&&typeof original.content==='string','Base file provenance mismatch');
    need(blob(Buffer.from(original.content,'utf8'))===f.baseBlob,'Base blob bytes mismatch');
    const next=blob(b);need(next!==f.baseBlob,'Unchanged file');
    files.push({path:f.path,mode:'100644',baseBlob:f.baseBlob,newBlob:next,bytes:b.length,contentBase64:b.toString('base64')});
  }
  files.sort((x,y)=>x.path<y.path?-1:x.path>y.path?1:0);
  const receipt=createHash('sha256').update(JSON.stringify([REPO+'#1007','code-v1',a.taskId,a.sourceSha])).digest('hex');
  const payload={schema:'MID-LOGICC-CODE-V1',taskId:a.taskId,sourceSha:a.sourceSha,files};
  // Base64 text is data, not executable instructions; the receiver must decode,
  // re-hash, inspect the diff and independently qualify it before creating a Draft.
  const body='<!-- MID-LOGICC-CODE:'+receipt+' -->\nLogicc code candidate (public, untrusted, no release authority)\n\n'+JSON.stringify(payload);
  need(Buffer.byteLength(body,'utf8')<=32_768,'Comment body limit');
  return {receipt,body,payload};
}

// Trusted receiver only: re-read the actual GitHub comment and the task/refs
// independently; no reference or PR writes are performed here.
export async function verifyReceivedLogiccCode({commentId,assignment,expectedActor,readComment,readRefs,readBaseFile}={}){
  need(positive(commentId)&&record(assignment)&&typeof readComment==='function'&&typeof readRefs==='function'&&typeof readBaseFile==='function','Trusted intake dependencies missing');
  const a=assignmentValid(assignment,assignment.taskId,'code');
  const refs=await readRefs();
  need(record(refs)&&refs.main===a.sourceSha&&refs.stable===a.sourceSha,'Intake stable drift');
  const comment=await readComment(commentId);
  need(record(comment)&&typeof comment.body==='string'&&Buffer.byteLength(comment.body,'utf8')<=32768,'Missing or oversized comment');
  const lines=comment.body.split('\n');
  need(lines.length===4&&/^<!-- MID-LOGICC-CODE:[a-f0-9]{64} -->$/.test(lines[0])&&lines[1]==='Logicc code candidate (public, untrusted, no release authority)'&&lines[2]==='','Code marker or framing mismatch');
  let p;
  try{p=JSON.parse(lines[3]);}catch{throw new Error('Invalid code JSON');}
  need(keys(p,'files,schema,sourceSha,taskId')&&p.schema==='MID-LOGICC-CODE-V1'&&p.taskId===a.taskId&&p.sourceSha===a.sourceSha&&Array.isArray(p.files)&&p.files.length>0&&p.files.length<=2,'Code payload mismatch');
  const files=p.files.map(f=>{
    need(keys(f,'baseBlob,bytes,contentBase64,mode,newBlob,path')&&f.mode==='100644'&&Number.isSafeInteger(f.bytes)&&f.bytes>0&&f.bytes<=12288&&typeof f.contentBase64==='string'&&f.contentBase64.length<=16384&&sha.test(f.newBlob??''),'Code blob metadata mismatch');
    const b=Buffer.from(f.contentBase64,'base64');
    need(b.length===f.bytes&&b.toString('base64')===f.contentBase64&&blob(b)===f.newBlob,'Code bytes or blob digest mismatch');
    const content=b.toString('utf8');
    need(Buffer.from(content,'utf8').equals(b),'Invalid UTF-8');
    return {path:f.path,baseBlob:f.baseBlob,content};
  });
  const prepared=await prepareLogiccCodeCandidate({taskId:p.taskId,sourceSha:p.sourceSha,files},a,readBaseFile);
  need(prepared.body===comment.body&&verifyLogiccComment(comment,commentId,prepared.body,expectedActor),'Canonical body or GitHub actor mismatch');
  const latest=await readRefs();
  need(record(latest)&&latest.main===a.sourceSha&&latest.stable===a.sourceSha&&Date.parse(a.expiresAt)>Date.now(),'Intake source or task drift');
  return {status:'verified_candidate_only',receipt:prepared.receipt,commentId,sourceSha:a.sourceSha,files};
}

// This is a host adapter, not an MCP endpoint or a permission grant. All
// dependencies are supplied by the independently authorized host, never by callers.
export function createLogiccPilotHost({readAssignment,readRefs,readBaseFile,readQualification,issueToken,revokeToken,assertOperational,recordCleanupIncident,receiptNamespace}={}){
  for(const fn of [readAssignment,readRefs,readBaseFile,readQualification,issueToken,revokeToken,assertOperational,recordCleanupIncident])need(typeof fn==='function','Trusted host dependency missing');
  const reserve=bindReceiptReservation(receiptNamespace);
  async function run(input,kind){
    need(record(input)&&typeof input.taskId==='string'&&task.test(input.taskId),'Invalid task ID');
    need(await assertOperational()===true,'Host incident gate is closed');
    const a=assignmentValid(await readAssignment(input.taskId),input.taskId,kind);
    if(kind==='result')need(a.publicationApproved===true,'Public result not authorized');
    const q=qualify(await readQualification());
    async function checkRefs(){
      const r=await readRefs();
      need(record(r)&&r.main===a.sourceSha&&r.stable===a.sourceSha,'Stable or main drift');
      need(Date.parse(a.expiresAt)>Date.now(),'Assignment expired');
    }
    await checkRefs();
    // Validate content before claiming or issuing any token.
    const prepared=kind==='result'?prepareLogiccResult(input,{taskId:a.taskId,sourceSha:a.sourceSha}):await prepareLogiccCodeCandidate(input,a,readBaseFile);
    let issued,observed,result;
    async function getInstallationToken(){
      if(issued)return issued.token;
      await checkRefs();
      need(await assertOperational()===true,'Host incident gate is closed');
      const t=await issueToken({appId:APP_ID,installationId:q.installationId,repositoryIds:[REPO_ID],permissions:{issues:'write',metadata:'read'}});
      if(record(t)&&typeof t.token==='string'&&/^[A-Za-z0-9_-]+$/.test(t.token))observed=t.token;
      const expiry=Date.parse(t?.expires_at);
      need(observed&&keys(t.permissions,'issues,metadata')&&t.permissions.issues==='write'&&t.permissions.metadata==='read'&&Array.isArray(t.repositoryIds)&&t.repositoryIds.length===1&&t.repositoryIds[0]===REPO_ID&&Number.isFinite(expiry)&&expiry>Date.now()&&expiry<=Date.now()+3_600_000,'Issued token scope or expiry unverified');
      issued=t;
      return t.token;
    }
    try{
      if(kind==='result')result=await sendLogiccResult(input,{taskId:a.taskId,sourceSha:a.sourceSha},{getInstallationToken,reserve,expectedActor:q.actor});
      else{
        const claim=await reserve(prepared.receipt);
        if(claim==='existing')return {status:'already_claimed',receipt:prepared.receipt};
        need(claim==='claimed','Receipt claim unverified');
        const transport=createLogiccCommentTransport(getInstallationToken);
        try{
          const posted=await transport.publish({body:prepared.body});
          need(positive(posted?.id),'Missing comment ID');
          const actual=await transport.readback({commentId:posted.id});
          need(verifyLogiccComment(actual,posted.id,prepared.body,q.actor),'Code readback mismatch');
          result={status:'posted',receipt:prepared.receipt,commentId:posted.id};
        }catch{result={status:'reconciliation_required',receipt:prepared.receipt};}
      }
    }finally{
      if(observed){
        let cleaned=false;
        try{cleaned=await revokeToken(observed)===true;}catch{}
        if(!cleaned){
          const incident={receipt:prepared.receipt,deliveryStatus:result?.status??'unknown',...(positive(result?.commentId)?{commentId:result.commentId}:{})};
          let recorded=false;
          try{recorded=await recordCleanupIncident(incident)===true;}catch{}
          result={status:'token_cleanup_required',...incident,incidentRecorded:recorded};
        }
      }
    }
    return result;
  }
  return Object.freeze({submitResult:input=>run(input,'result'),submitCodeCandidate:input=>run(input,'code')});
}
