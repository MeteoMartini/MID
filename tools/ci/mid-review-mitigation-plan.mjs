/** Review mitigation shadow contract. No inference, mutation, approval or release authority. */
const REPO='MeteoMartini/MID';
const SHA=/^[0-9a-f]{40}$/;
const VERSION=/^0(?:\.(?:0|[1-9]\d*)){3}$/;
function versionParts(v){
 if(typeof v!=='string'||!VERSION.test(v))return null;
 const parts=v.split('.').map(Number);
 return parts.every(Number.isSafeInteger)&&parts.join('.')===v?parts:null;
}
function advancesVersion(from,to){
 const a=versionParts(from),b=versionParts(to);if(!a||!b)return false;
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])return b[i]>a[i];
 return false;
}
const BRANCH=/^(chatgpt|codex)\/[A-Za-z0-9._/-]+$/;
export const MAX_ROUNDS=4;
const hold=(reason,fields={})=>({state:'HOLD',reason,rounds:null,remaining:null,openThreads:null,resolvedThreads:null,activeChangeRequests:null,...fields,reviewEvidenceVerified:false,externalCallsAuthorized:false,writeAuthorized:false,releaseAuthorized:false});
const validCount=x=>Number.isSafeInteger(x)&&x>=0;
// Accept only a canonical blank-separated terminal trailer block. A malformed
// or ambiguous terminal mitigation marker makes the budget unverifiable.
function terminalMitigationTrailers(message){
 const lines=message.split(/\r?\n/);while(lines.length&&lines.at(-1).trim()==='')lines.pop();
 const marker=line=>/^\s*MID-Review-Mitigation\b/i.test(line);
 const separator=lines.findLastIndex(line=>line.trim()==='');
 if(separator<1)return lines.some(marker)?null:[];
 const block=lines.slice(separator+1),matches=block.filter(marker);
 if(!matches.length)return [];
 if(!block.every(line=>/^[A-Za-z0-9][A-Za-z0-9-]*: [^\r\n]+$/.test(line)))return null;
 return matches;
}
export function countMitigationRounds({base,head,version,commits}={}){
 if(!SHA.test(base??'')||!SHA.test(head??'')||!versionParts(version)||!Array.isArray(commits)||commits.length<1||commits.length>100)return null;
 let prev=base,rounds=0;const seen=new Set([base]);
 for(const c of commits){
  if(!SHA.test(c?.sha??'')||seen.has(c.sha)||!Array.isArray(c.parents)||c.parents.length!==1||c.parents[0]?.sha!==prev||typeof c.commit?.message!=='string')return null;
  const trailers=terminalMitigationTrailers(c.commit.message);if(trailers===null)return null;
  if(trailers.length){
   if(trailers.length!==1||trailers[0]!=='MID-Review-Mitigation: '+version+'/'+(rounds+1)+'-of-'+MAX_ROUNDS||rounds>=MAX_ROUNDS)return null;
   rounds++;
  }
  seen.add(c.sha);prev=c.sha;
 }
 return prev===head?rounds:null;
}
export function planReviewMitigation({repository,source,pr,main,stable,fromVersion,target,commits,guard,final}={}){
 if(repository!==REPO||source?.path!=='.github/workflows/chatgpt-pr-gate.yml'||source.event!=='pull_request'||source.status!=='completed'||source.conclusion!=='success'||source.head_repository?.full_name!==REPO||!validCount(source.id)||source.id===0||!SHA.test(source.head_sha??'')||!BRANCH.test(source.head_branch??'')||!Array.isArray(source.pull_requests)||source.pull_requests.length!==1)return hold('SOURCE_UNVERIFIED');
 const link=source.pull_requests[0],head=source.head_sha,base=link?.base?.sha;
 const matches=p=>p?.number===link?.number&&Number.isSafeInteger(p.number)&&p.number>0&&p.state==='open'&&p.draft===false&&p.base?.ref==='main'&&p.base?.sha===base&&p.head?.sha===head&&p.head?.ref===source.head_branch&&p.head?.repo?.full_name===REPO;
 if(!SHA.test(base??'')||link?.head?.sha!==head||main?.protected!==true||stable?.protected!==true||main.commit?.sha!==base||stable.commit?.sha!==base||!matches(pr)||!matches(final?.pr)||final.main!==base||final.stable!==base)return hold('LIVE_REF_OR_PR_DRIFT');
 if(target?.fromVersion!==fromVersion||!advancesVersion(fromVersion,target?.toVersion)||target.requireSourceOfTruth!==true)return hold('VERSION_UNVERIFIED');
 const rounds=countMitigationRounds({base,head,version:target.toVersion,commits});
 if(rounds===null)return hold('ROUND_HISTORY_UNVERIFIED');
 const scope={rounds,remaining:MAX_ROUNDS-rounds,pr:pr.number,head,base,version:target.toVersion,sourceRun:source.id};
 if(!validCount(guard?.openThreads)||!validCount(guard?.resolvedThreads)||!validCount(guard?.activeChangeRequests))return hold('REVIEW_EVIDENCE_UNKNOWN',scope);
 const counts={...scope,openThreads:guard.openThreads,resolvedThreads:guard.resolvedThreads,activeChangeRequests:guard.activeChangeRequests};
 if(guard.ok===true&&guard.reason==='READBACK_CLEAN'&&guard.openThreads===0&&guard.activeChangeRequests===0)return hold('CLEAN_COUNTS_UNVERIFIED',counts);
 // The native guard reports open threads first; a reason must agree with the counts.
 const expectedReason=guard.openThreads>0?'MID_REVIEW_OPEN_THREAD':guard.activeChangeRequests>0?'MID_REVIEW_CHANGES_REQUESTED':null;
 if(guard.ok!==false||expectedReason===null||guard.reason!==expectedReason)return hold('REVIEW_EVIDENCE_INCONSISTENT',counts);
 if(rounds>=MAX_ROUNDS)return hold('BUDGET_EXHAUSTED',counts);
 if(guard.activeChangeRequests>0)return hold('FORMAL_CHANGE_REQUEST_REQUIRES_DISPOSITION',counts);
 // Caller-supplied counts are not independently bound native review evidence.
 // A source-gate observation is NOT evidence that the downstream bot stopped.
 // Never race an active release or turn a review comment into executable instructions.
 return {...hold('AWAIT_VERIFIED_BOT_HALT_AND_AUTHORIZED_INTAKE',counts),state:'REVIEW_HOLD_OBSERVED'};
}
/** No network call. A request envelope cannot establish entitlement or router identity. */
export function planProvider(provider){
 const model={groq:'openai/gpt-oss-20b',openrouter:'google/gemma-4-26b-a4b-it:free'}[provider];
 if(!Object.hasOwn({groq:1,openrouter:1,openai:1},provider))return {state:'HOLD',reason:'PROVIDER_NOT_ALLOWLISTED',externalCallsAuthorized:false,maxCalls:0};
 return {state:'HOLD',provider,model:model??null,reason:provider==='openai'?'API_BUDGET_AND_ENTITLEMENT_UNVERIFIED':'VERIFIED_ROUTER_BINDING_REQUIRED',externalCallsAuthorized:false,maxCalls:0,paidFallback:false};
}
/** Deterministic, lossless proposal only: explicit typed segments must reconstruct the original entry. */
export function proposeNotesSplit({raw,index,segments}={}){
 if(typeof raw!=='string'||raw.length>65536||!Number.isSafeInteger(index)||index<0||!Array.isArray(segments)||segments.length<2||segments.length>20||segments.some(s=>typeof s!=='string'||!s.length||s.trim()!==s))throw Error('INVALID_REPAIR_MANIFEST');
 const original=JSON.parse(raw);
 const noteEntries=entries=>Array.isArray(entries)&&entries.length>0&&entries.every(s=>typeof s==='string'&&s.trim().length>0);
 if(original?.schema!==1||!versionParts(original.version)||!noteEntries(original.external)||!noteEntries(original.internal)||!noteEntries(original.sourceOfTruth)||original.internal[index]!==segments.join('; '))throw Error('REPAIR_NOT_LOSSLESS');
 const next={...original,internal:[...original.internal.slice(0,index),...segments,...original.internal.slice(index+1)]};
 return {state:'UNTRUSTED_PROPOSAL_ONLY',path:'docs/releases/MID_RELEASE_NOTES_'+original.version+'.json',content:JSON.stringify(next,null,2)+'\n',writeAuthorized:false,releaseAuthorized:false};
}
