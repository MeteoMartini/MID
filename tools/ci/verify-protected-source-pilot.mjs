#!/usr/bin/env node
// MID read-only end-to-end validation of a protected signed Source observation.
// This module grants neither release nor test/build/artifact reuse authority.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,readdir,lstat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {observeProtectedSource} from './protected-source-attestation.mjs';

const REPO='MeteoMartini/MID', REPO_ID=1305110795;
const WORKFLOW='.github/workflows/attested-source-qualification.yml';
const SIGNER=REPO+'/'+WORKFLOW;
const SIGN_JOB='GitHub-Quellgates unabhängig prüfen und Beobachtung attestieren';
const SHA=/^[a-f0-9]{40}$/;
const positive=v=>Number.isSafeInteger(v)&&v>0;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=s=>{throw Error('Protected Source signature rejected: '+s)};
const hash=b=>createHash('sha256').update(b).digest('hex');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function inspectSignedObservation({run,jobs,bytes,verified,independent},expected){
 const {signerSha,signingRunId,signingAttempt,sourceRunId,prNumber,now=Date.now()}=expected;
 if(!SHA.test(signerSha)||![signingRunId,signingAttempt,sourceRunId,prNumber].every(positive)||
    !Number.isFinite(now))fail('invalid expected identity');
 if(!object(run)||run.id!==signingRunId||run.run_attempt!==signingAttempt||
    run.head_sha!==signerSha||run.head_branch!=='main'||run.path!==WORKFLOW||
    run.event!=='workflow_dispatch'||!['in_progress','completed'].includes(run.status)||
    (run.conclusion!==null&&run.conclusion!=='success')||
    run.repository?.id!==REPO_ID||run.repository?.full_name!==REPO||
    run.head_repository?.id!==REPO_ID||run.head_repository?.full_name!==REPO)
    fail('wrong signed workflow run');
 if(!object(jobs)||!Number.isSafeInteger(jobs.total_count)||
    !Array.isArray(jobs.jobs)||jobs.total_count!==jobs.jobs.length||jobs.jobs.length>5)
    fail('incomplete signer job list');
 const signer=jobs.jobs.filter(x=>x?.name===SIGN_JOB);
 if(signer.length!==1||signer[0].run_id!==signingRunId||
    signer[0].run_attempt!==signingAttempt||signer[0].head_sha!==signerSha||
    signer[0].status!=='completed'||signer[0].conclusion!=='success')
    fail('signer job not independently successful');
 if(!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>262144)fail('invalid signed bytes');
 let report;
 try{report=JSON.parse(bytes.toString('utf8'))}catch{fail('invalid JSON subject')}
 if(!object(report)||!Buffer.from(JSON.stringify(report,null,2)+'\n').equals(bytes))
    fail('noncanonical signed JSON');
 const keys=['schema','producerWorkflow','repo','repoId','signerSourceSha','sourceSha',
  'sourceTreeSha','originalBaseSha','sourceRunId','runAttempt','sourcePrNumber',
  'issuedAt','expiresAt','releaseAuthorized','reuseAuthorized','mandatoryJobs','optionalJobs'];
 if(!equal(Object.keys(report).sort(),keys.sort())||
    report.schema!=='mid.protected-source-observation.v1'||
    report.producerWorkflow!==SIGNER||report.repo!==REPO||report.repoId!==REPO_ID||
    report.signerSourceSha!==signerSha||report.sourceRunId!==sourceRunId||
    report.sourcePrNumber!==prNumber||report.releaseAuthorized!==false||
    report.reuseAuthorized!==false)fail('schema/source/permissions mismatch');
 const issued=Date.parse(report.issuedAt),expires=Date.parse(report.expiresAt),
  created=Date.parse(run.created_at);
 if(![issued,expires,created].every(Number.isFinite)||
    new Date(issued).toISOString()!==report.issuedAt||
    new Date(expires).toISOString()!==report.expiresAt||
    issued<created-60000||issued>now+60000||expires-issued!==86400000||now>expires)
    fail('stale, future, or inconsistent observation timestamps');
 if(!object(independent)||independent.signerSourceSha!==signerSha||
    independent.sourceRunId!==sourceRunId||independent.sourcePrNumber!==prNumber)
    fail('fresh Source-Gate identity mismatch');
 const omitTime=v=>{const {issuedAt,expiresAt,...rest}=v;return rest};
 if(!equal(omitTime(report),omitTime(independent))||
    !Array.isArray(report.mandatoryJobs)||report.mandatoryJobs.length!==12)
    fail('signed Source claims not equal to independently observed GitHub evidence');
 if(!Array.isArray(verified)||verified.length!==1)fail('missing or ambiguous Sigstore result');
 const result=verified[0]?.verificationResult,cert=result?.signature?.certificate;
 if(!object(cert)||cert.sourceRepository!==REPO||
    String(cert.sourceRepositoryIdentifier)!==String(REPO_ID)||
    cert.sourceRepositoryDigest!==signerSha||cert.sourceRepositoryRef!=='refs/heads/main'||
    !Array.isArray(result.verifiedTimestamps)||!result.verifiedTimestamps.length)
    fail('signed certificate identity/ref/digest mismatch');
 const statement=result.statement;
 if(statement?._type!=='https://in-toto.io/Statement/v1'||
    statement.predicateType!=='https://slsa.dev/provenance/v1'||
    !Array.isArray(statement.subject)||statement.subject.length!==1||
    statement.subject[0]?.digest?.sha256!==hash(bytes))
    fail('signed subject digest/predicate mismatch');
 return Object.freeze({schema:'mid.protected-source-verification.v1',
  signerSourceSha:signerSha,signingRunId,signingAttempt,sourceRunId,prNumber,
  subjectSha256:hash(bytes),mandatoryJobs:12,signatureVerified:true,
  sourceReverified:true,releaseAuthorized:false,reuseAuthorized:false});
}

export function verificationArgs(file,signerSha){
 if(typeof file!=='string'||!path.isAbsolute(file)||!SHA.test(signerSha))
    fail('unsafe verification arguments');
 return ['attestation','verify',file,'--repo',REPO,'--signer-workflow',SIGNER,
  '--signer-digest',signerSha,'--source-ref','refs/heads/main',
  '--source-digest',signerSha,'--deny-self-hosted-runners','--format','json'];
}
async function main(){
 const e=process.env;
 if(e.GITHUB_ACTIONS!=='true'||e.GITHUB_REPOSITORY!==REPO||
    e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.GITHUB_REF!=='refs/heads/main'||
    e.GITHUB_REF_PROTECTED!=='true'||!SHA.test(e.GITHUB_SHA||''))
    fail('not a verified protected-main dispatch');
 for(const field of ['GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','MID_SOURCE_RUN_ID','MID_SOURCE_PR_NUMBER'])
   if(!/^[1-9][0-9]{0,14}$/.test(e[field]||''))fail('invalid run/PR input: '+field);
 const signerSha=e.GITHUB_SHA,signingRunId=Number(e.GITHUB_RUN_ID),
  signingAttempt=Number(e.GITHUB_RUN_ATTEMPT),
  sourceRunId=Number(e.MID_SOURCE_RUN_ID),prNumber=Number(e.MID_SOURCE_PR_NUMBER);
 const gh=args=>execFileSync('gh',args,{encoding:'utf8',maxBuffer:4194304,
  stdio:['ignore','pipe','pipe']});
 const api=endpoint=>JSON.parse(gh(['api','-X','GET','repos/'+REPO+'/'+endpoint]));
 const run=api('actions/runs/'+signingRunId);
 const jobs=api('actions/runs/'+signingRunId+'/jobs?filter=latest&per_page=100');
 const dir=await mkdtemp(path.join(tmpdir(),'mid-signed-observation-'));
 try{
  gh(['run','download',String(signingRunId),'--repo',REPO,'--name',
   'mid-protected-observation-'+signingRunId+'-'+signingAttempt,'--dir',dir]);
  const entries=await readdir(dir);
  if(entries.length!==1||entries[0]!=='mid-source-observation.json')
    fail('artifact filename/inventory mismatch');
  const file=path.join(dir,entries[0]),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>262144)
    fail('unsafe attestation subject');
  const bytes=await readFile(file);
  // Only a real zero-exit gh attestation verify result is accepted.
  const verified=JSON.parse(gh(verificationArgs(file,signerSha)));
  const independent=observeProtectedSource({runId:sourceRunId,prNumber,signerSha});
  const verdict=inspectSignedObservation({run,jobs,bytes,verified,independent},
    {signerSha,signingRunId,signingAttempt,sourceRunId,prNumber});
  const after=api('actions/runs/'+signingRunId);
  for(const field of ['id','run_attempt','head_sha','head_branch','path','event'])
    if(after?.[field]!==run[field])fail('signer run race');
  console.log(JSON.stringify(verdict));
 }finally{await rm(dir,{recursive:true,force:true})}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error(error?.message||'fail-closed');process.exitCode=1});
