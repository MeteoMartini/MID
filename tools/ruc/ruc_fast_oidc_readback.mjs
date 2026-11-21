// Independently verify public Pages bytes against issuer-signed provenance.
import {readFile} from 'node:fs/promises';
import {FAST_OIDC_JWKS,verifyFastOidcProof} from './fast_oidc_proof.mjs';
const [siteRoot,localFile,expectedSha]=process.argv.slice(2);
if(!siteRoot||!localFile||!/^[a-f0-9]{64}$/.test(expectedSha||''))throw Error('Expected canonical Pages root, local proof and exact manifest digest');
const root=new URL(siteRoot);
if(root.protocol!=='https:'||root.username||root.password||!root.pathname.endsWith('/'))throw Error('Noncanonical Pages HTTPS origin');
const target=new URL('ruc/fast/publisher-proof.v2.json',root);
target.searchParams.set('readback',String(process.env.GITHUB_RUN_ID||''));
const fetched=await fetch(target,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
if(!fetched.ok||fetched.status!==200)throw Error('Signed public Pages proof missing');
const remote=await fetched.text(),local=await readFile(localFile,'utf8');
if(remote!==local||remote.length>16000)throw Error('Fast OIDC public proof differs byte-for-byte');
const jwksResp=await fetch(FAST_OIDC_JWKS,{redirect:'error',signal:AbortSignal.timeout(12000)});
if(!jwksResp.ok)throw Error('Official GitHub OIDC JWKS unavailable');
const receipt=JSON.parse(local),verified=await verifyFastOidcProof(receipt,await jwksResp.json());
if(!verified||verified.sha!==expectedSha)throw Error('GitHub issuer signature/claims or SHA invalid');
console.log('Independent GitHub OIDC signed Fast readback verified: '+verified.run);
