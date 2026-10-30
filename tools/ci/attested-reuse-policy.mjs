#!/usr/bin/env node
// Qualification-only consumer. A valid signature is NOT permission to skip tests,
// deploy, merge, promote Stable, or reuse an artifact between trust domains.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const SHA=/^[0-9a-f]{40}$/, DIGEST=/^[0-9a-f]{64}$/, REF=/^refs\/heads\/[a-zA-Z0-9._/-]+$/;
export const SOURCE_JOBS=Object.freeze([
  'Source-Kern vollständig prüfen',
  ...[1,2,3,4].map(n=>`Core-Regression · core-${n}/4`),
  'Heavy-Regression · heavy-browser-state ·',
  'Heavy-Regression · heavy-native-map ·',
  'Heavy-Regression · heavy-mountain-visual ·',
  ...[1,2,3].map(n=>`Heavy-Regression · heavy-unified-map · ${n}/3`)
]);
const requiredKeys=(v,keys,what)=>{
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join('|')!==[...keys].sort().join('|'))
    throw Error(what+': missing or unexpected fields');
};
const fail=message=>{throw Error('Attested evidence rejected: '+message)};
const timestamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const hex=(v,re,field)=>{if(typeof v!=='string'||!re.test(v))fail(field)};
export function validateTrustedPolicy(p,now=Date.now()){
  requiredKeys(p,['schema','repo','repoId','sourceSha','treeSha','lockSha','envSha','artifactSha256','version','runId','attempt','sourceRef','signerWorkflow','signerDigest','signerSourceSha','notAfter'],'trusted policy');
  if(p.schema!=='mid.attested-source-policy.v1'||p.repo!=='MeteoMartini/MID'||String(p.repoId)!=='1305110795')fail('trusted repository identity');
  for(const k of ['sourceSha','treeSha','signerDigest','signerSourceSha'])hex(p[k],SHA,k);
  for(const k of ['lockSha','envSha','artifactSha256'])hex(p[k],DIGEST,k);
  if(!REF.test(p.sourceRef)||p.sourceRef!=='refs/heads/main')fail('trusted main ref required');
  // The signed workflow runs on protected main while sourceSha identifies the
  // independently verified PR Source-Gate HEAD. They are distinct trust zones.
  if(p.signerSourceSha===p.sourceSha)fail('protected signer SHA must differ from untrusted PR HEAD');
  if(p.signerWorkflow!=='MeteoMartini/MID/.github/workflows/attested-source-qualification.yml')fail('untrusted signer workflow');
  if(!/^\d+\.\d+\.\d+\.\d+$/.test(p.version)||!Number.isSafeInteger(p.runId)||p.runId<1||
    !Number.isInteger(p.attempt)||p.attempt<1||p.attempt>20)fail('version/run/attempt invalid');
  if(!timestamp(p.notAfter)||now>Date.parse(p.notAfter))fail('policy expired');
  return p;
}
export function examineVerifiedArtifact(policy,artifactBytes,verified,now=Date.now()){
  validateTrustedPolicy(policy,now);
  if(!Buffer.isBuffer(artifactBytes)||artifactBytes.length===0||artifactBytes.length>262144)fail('artifact size');
  const sha=createHash('sha256').update(artifactBytes).digest('hex');
  if(sha!==policy.artifactSha256)fail('subject digest mismatch');
  // Only pass JSON emitted by a SUCCESSFUL `gh attestation verify` invocation.
  // Certificate attributes are trusted only after that CLI verifies Sigstore.
  if(!Array.isArray(verified)||verified.length!==1)fail('missing or ambiguous verified attestation');
  const result=verified[0]?.verificationResult;
  const cert=result?.signature?.certificate;
  if(!cert||String(cert.sourceRepositoryIdentifier)!==String(policy.repoId)||
     cert.sourceRepository!==policy.repo||
     cert.sourceRepositoryDigest!==policy.signerSourceSha||
     cert.sourceRepositoryRef!==policy.sourceRef)fail('signing certificate repository/ref/digest mismatch');
  if(!Array.isArray(result.verifiedTimestamps)||result.verifiedTimestamps.length===0)fail('no verified signature timestamp');
  const statement=result.statement;
  if(statement?._type!=='https://in-toto.io/Statement/v1'||
     statement.predicateType!=='https://slsa.dev/provenance/v1'||
     !Array.isArray(statement.subject)||statement.subject.length!==1||
     statement.subject[0]?.digest?.sha256!==sha)fail('signed statement subject mismatch');
  let report;
  try{report=JSON.parse(artifactBytes.toString('utf8'))}catch{fail('invalid artifact JSON')}
  requiredKeys(report,['schema','releaseAuthorized','reuseAuthorized','repo','repoId','sourceSha','treeSha','lockSha','envSha','version','runId','attempt','issuedAt','notAfter','jobs'],'signed report');
  if(report.schema!=='mid.attested-source-evidence.v1'||report.releaseAuthorized!==false||
     report.reuseAuthorized!==false||report.repo!==policy.repo||String(report.repoId)!==String(policy.repoId))
    fail('report identity/permissions');
  for(const k of ['sourceSha','treeSha','lockSha','envSha','version','runId','attempt','notAfter'])
    if(report[k]!==policy[k])fail(k+' mismatch');
  if(!timestamp(report.issuedAt)||Date.parse(report.issuedAt)>now+60000||
     Date.parse(report.issuedAt)>Date.parse(report.notAfter)||now>Date.parse(report.notAfter))fail('report freshness');
  requiredKeys(report.jobs,SOURCE_JOBS,'complete source job inventory');
  for(const name of SOURCE_JOBS){
    const job=report.jobs[name];
    requiredKeys(job,['runId','attempt','headSha','conclusion'],'job provenance');
    if(job.runId!==policy.runId||job.attempt!==policy.attempt||
       job.headSha!==policy.sourceSha||job.conclusion!=='success')fail('missing/failed/cross-run job: '+name);
  }
  return {schema:'mid.attested-source-inspection.v1',provenanceConsistent:true,
    artifactSha256:sha,sourceSha:policy.sourceSha,inspectedJobs:SOURCE_JOBS.length,
    releaseAuthorized:false,reuseAuthorized:false,
    note:'Qualification-only: never substitute this report for Source, Installer, Worker, Pages or Stable gates.'};
}
export function verifyThroughGithubCLI(policy,artifactFile,{invoke=execFileSync,now=Date.now()}={}){
  validateTrustedPolicy(policy,now);
  const args=['attestation','verify',artifactFile,'--repo',policy.repo,
    '--signer-workflow',policy.signerWorkflow,'--signer-digest',policy.signerDigest,
    '--source-ref',policy.sourceRef,'--source-digest',policy.signerSourceSha,
    '--deny-self-hosted-runners','--format','json'];
  // Never pass untrusted data through a shell; never use --bundle (must query
  // current GitHub repository identity rather than accept an offline alias).
  const raw=invoke('gh',args,{encoding:'utf8',maxBuffer:2097152,stdio:['ignore','pipe','pipe']});
  const parsed=JSON.parse(raw);
  return parsed;
}
async function main(){
  if(process.argv.length!==5)throw Error('Usage: node attested-reuse-policy.mjs trusted-policy.json signed-artifact.json');
  const policy=JSON.parse(await readFile(process.argv[3],'utf8'));
  const data=await readFile(process.argv[4]); const result=examineVerifiedArtifact(
    policy,data,verifyThroughGithubCLI(policy,process.argv[4]),Date.now());
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(()=>{console.error('Attestation qualification failed closed; no release/reuse authorized.');process.exitCode=1;});
