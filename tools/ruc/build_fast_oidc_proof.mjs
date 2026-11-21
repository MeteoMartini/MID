// Publish an issuer-signed, SHA-audience-bound Fast provenance envelope.
// GitHub Actions issues the private signing token; no MID signing secret exists.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FAST_OIDC_JWKS,fastOidcAudience,verifyFastOidcProof} from './fast_oidc_proof.mjs';
const MAX_SITE=900000000;
export async function buildFastOidcProof(source,env,requestToken,readJwks,now=Date.now()){
 const deny=reason=>{throw new Error('FAST_OIDC_PUBLISH_DENIED: '+reason)};
 if(env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||env.GITHUB_REF!=='refs/heads/main'||
   !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'')||env.STABLE_SHA!==env.GITHUB_SHA||
   !/^[1-9]\d*$/.test(env.GITHUB_RUN_ID||'')||
   !/^[1-9]\d*$/.test(env.GITHUB_RUN_ATTEMPT||'')||
   !['schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME))deny('protected workflow lineage');
 if(!source||source.publicationAuthorized!==false||
    !/^[a-f0-9]{64}$/.test(source.fastManifestSha256||'')||
    !/^[a-f0-9]{64}$/.test(source.primaryManifestSha256||'')||
    !/^20\d{2}-\d{2}-\d{2}T\d{2}:00$/.test(source.run||'')||
    !Number.isSafeInteger(source.siteBytes)||source.siteBytes<1||source.siteBytes>=MAX_SITE)deny('unsealed Fast candidate');
 const when=Date.parse(source.run+'Z');
 if(!Number.isFinite(now)||!Number.isFinite(when)||now<when-5*60000||now-when>4*3600000)deny('old or future DWD source');
 const aud=fastOidcAudience(source.fastManifestSha256);
 const jwt=await requestToken(aud);
 if(typeof jwt!=='string'||jwt.length>12000)deny('invalid OIDC token response');
 const payload={schema:'mid.ruc.fast-oidc-proof.v1',run:source.run,
  manifestSha256:source.fastManifestSha256,stableSha:env.STABLE_SHA,
  runId:Number(env.GITHUB_RUN_ID),runAttempt:Number(env.GITHUB_RUN_ATTEMPT),oidcToken:jwt};
 const verified=await verifyFastOidcProof(payload,await readJwks(),{now});
 if(!verified||verified.run!==source.run||verified.sha!==source.fastManifestSha256)deny('issuer signature or claims invalid');
 return payload;
}
async function main(){
 const [inPath,outPath]=process.argv.slice(2);
 if(!inPath||!outPath)throw Error('Expected original fast-delivery-proof.json and in-site publisher-proof.v2.json');
 const raw=JSON.parse(await readFile(inPath,'utf8'));
 const env={...process.env};
 const tokenUrl=env.ACTIONS_ID_TOKEN_REQUEST_URL,authorization=env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
 if(!tokenUrl||!authorization)throw Error('GitHub OIDC issuance unavailable; fail-closed');
 const target=new URL(tokenUrl);
 if(target.protocol!=='https:'||!target.hostname.endsWith('.actions.githubusercontent.com')||
    target.username||target.password)throw Error('OIDC URL not GitHub-hosted');
 const fetchJson=async(url,opts)=>{
  const response=await fetch(url,{...opts,signal:AbortSignal.timeout(12000),redirect:'error'});
  if(!response.ok)throw Error('GitHub OIDC endpoint rejected request (HTTP '+response.status+')');
  return response.json();
 };
 const data=await buildFastOidcProof(raw,env,
  async audience=>{target.searchParams.set('audience',audience);return (await fetchJson(target,{headers:{Authorization:'Bearer '+authorization,Accept:'application/json'}})).value},
  async()=>fetchJson(FAST_OIDC_JWKS,{headers:{Accept:'application/json'}}));
 const body=JSON.stringify(data)+'\n';
 const originalSite=raw.siteBytes;
 if(originalSite+Buffer.byteLength(body)>=MAX_SITE)throw Error('Pages budget exceeded by signed envelope');
 await writeFile(outPath,body,{flag:'wx',mode:0o644});
 if((await stat(outPath)).size!==Buffer.byteLength(body))throw Error('OIDC receipt write incomplete');
 raw.siteBytes+=Buffer.byteLength(body);
 raw.remainingPagesBytes-=Buffer.byteLength(body);
 if(raw.remainingPagesBytes<=0)throw Error('Pages physical budget exceeded');
 await writeFile(inPath,JSON.stringify(raw)+'\n');
 console.log('Protected GitHub OIDC publisher proof created for run '+data.run+'; no R2 access');
}
if(process.argv[1]&&resolve(fileURLToPath(import.meta.url))===resolve(process.argv[1]))await main();
