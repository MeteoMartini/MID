#!/usr/bin/env node
// MID fail-closed release retry classifier. No API, writes, release or approval permissions.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const BROWSER_JOB = 'Release-Heavy · heavy-unified-map · 2/3';
const DETERMINISTIC = /TS[0-9]{4}:|AssertionError|SyntaxError|ReferenceError|TypeError|\bRegression(?:stests?)?\b|Tests? failed|Test .* failed|build failed|nicht bestanden|Capacitor-iOS-Web-Bundle .* != Release|Dependency-Audit konnte|high severity|critical severity|ERESOLVE/i;
const TRANSIENT = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENETUNREACH|ECONNREFUSED|socket hang up|TLS handshake|temporarily unavailable|Temporary failure|HTTP (429|500|502|503|504)|status code (429|500|502|503|504)|rate limit|codeload[^\r\n]{0,120}(?:error|fail|status|HTTP|429|500|502|503|504|ECONNRESET|ETIMEDOUT)|network timeout|upstream.*(502|503|504)|Cloudflare.*(429|500|502|503|504)|Pages.*(429|500|502|503|504)/i;

const blocked = reason => Object.freeze({retry:false,reason});
export function classifyReleaseFailure({failedLog,jobs,attempt}={}){
  if(!Number.isInteger(attempt)||attempt<1||attempt>=3)return blocked('invalid-or-exhausted-attempt');
  if(typeof failedLog!=='string'||!failedLog.trim()||failedLog.length>8_000_000)
    return blocked('failed-log-missing-or-oversize');
  if(!jobs||typeof jobs!=='object'||!Number.isSafeInteger(jobs.total_count)||
     jobs.total_count<1||jobs.total_count>100||!Array.isArray(jobs.jobs)||
     jobs.jobs.length!==jobs.total_count)return blocked('incomplete-job-inventory');
  const failures=jobs.jobs.filter(x=>x?.conclusion==='failure');
  if(failures.length===0)return blocked('no-failed-jobs');
  if(failures.length!==1)return blocked('multiple-failed-jobs');
  const failed=failures[0];
  if(typeof failed.name!=='string')return blocked('failed-job-identity-missing');

  // Narrow one-time retry of the *observed* .455 installer browser timeout.
  // A complete identical test must pass on the original release SHA before deployment.
  if(attempt===1&&failed.name===BROWSER_JOB&&
     /page\.waitForFunction: Timeout 30000ms exceeded\./.test(failedLog)&&
     /scripts\/verify-unified-map-browser-0985167\.mjs:[0-9]+:[0-9]+/.test(failedLog)&&
     /1 von 1 Regressionstests fehlgeschlagen: test-unified-map-layers-0985167\.mjs/.test(failedLog)&&
     // The *exact* allowlisted wrapper summary is expected for this timeout.
     // Any additional deterministic regression marker must still block.
     !DETERMINISTIC.test(failedLog.replace(
       '1 von 1 Regressionstests fehlgeschlagen: test-unified-map-layers-0985167.mjs','')))
    return Object.freeze({retry:true,reason:'one-time-map-browser-timeout'});

  // A recognized browser failure may only be retried once; an unrelated HTTP
  // transport string in its log cannot turn an attempt-2 timeout into a retry.
  const knownBrowserSignature=failed.name===BROWSER_JOB&&
    /page\.waitForFunction: Timeout 30000ms exceeded\./.test(failedLog)&&
    /scripts\/verify-unified-map-browser-0985167\.mjs:[0-9]+:[0-9]+/.test(failedLog)&&
    /1 von 1 Regressionstests fehlgeschlagen: test-unified-map-layers-0985167\.mjs/.test(failedLog);
  if(knownBrowserSignature)return blocked('browser-retry-exhausted-or-deterministic');

  // Existing fail-closed order for all other deterministic versus transient errors.
  if(DETERMINISTIC.test(failedLog))return blocked('deterministic');
  if(TRANSIENT.test(failedLog))return Object.freeze({retry:true,reason:'transient'});
  return blocked('unknown');
}

async function main(){
  const [logPath,jobsPath,attemptRaw]=process.argv.slice(2);
  if(!logPath||!jobsPath||!/^[12]$/.test(attemptRaw??''))throw Error('Invalid classifier arguments');
  const [failedLog,metadata]=await Promise.all([readFile(logPath,'utf8'),readFile(jobsPath,'utf8')]);
  const result=classifyReleaseFailure({failedLog,jobs:JSON.parse(metadata),attempt:Number(attemptRaw)});
  process.stdout.write('retry='+result.retry+'\nreason='+result.reason+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(()=>{process.stderr.write('MID retry classifier: failed closed on invalid evidence\n');process.exitCode=1});
