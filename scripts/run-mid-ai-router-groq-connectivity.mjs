#!/usr/bin/env node
/**
 * Manual trusted GitHub Workflow ONLY.
 * No raw errors, model output or API keys are ever logged.
 */
import {checkMidGroqModelConnectivity} from './mid-ai-router-groq-connectivity.mjs';
import {readMidGithubSourceSnapshot} from './mid-ai-router-github-readback.mjs';
try{
 if(process.env.GITHUB_ACTIONS!=='true'||
    process.env.GITHUB_ACTOR!=='MeteoMartini'||
    process.env.GITHUB_REF!=='refs/heads/mid-stable')
   throw Object.assign(new Error('Context denied'),{reason:'TRUSTED_WORKFLOW_ONLY'});
 const result=await checkMidGroqModelConnectivity({
  apiKey:process.env.GROQ_API_KEY,
  expectedStableSha:process.env.GITHUB_SHA,
  fetchImpl:fetch,
  sourceReadback:()=>readMidGithubSourceSnapshot({fetchImpl:fetch})
 });
 console.log(JSON.stringify(result));
 if(result.status!=='MODEL_CATALOG_CONFIRMED')process.exitCode=1;
}catch(e){
 const why=/^[A-Z_]{4,72}$/.test(e?.reason||'')?e.reason:'GROQ_PREFLIGHT_FAILED';
 console.error('MID Groq Free preflight: '+why);
 process.exitCode=1;
}
