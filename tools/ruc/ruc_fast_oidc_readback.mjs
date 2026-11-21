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
async function readBounded(response,maxBytes){
 if(!response.body)throw Error('Missing OIDC response body');
 const chunks=[];
 let size=0;
 for await(const chunk of response.body){
  size+=chunk.byteLength;
  if(size>maxBytes)throw Error('OIDC response exceeds byte limit');
  chunks.push(chunk);
 }
 return Buffer.concat(chunks,size);
}
const remote=await readBounded(fetched,16000),local=await readFile(localFile);
if(!remote.equals(local))throw Error('Fast OIDC public proof differs byte-for-byte');
const jwksResp=await fetch(FAST_OIDC_JWKS,{redirect:'error',signal:AbortSignal.timeout(12000)});
if(!jwksResp.ok)throw Error('Official GitHub OIDC JWKS unavailable');
const decoder=new TextDecoder('utf-8',{fatal:true});
const receipt=JSON.parse(decoder.decode(local));
const verified=await verifyFastOidcProof(receipt,JSON.parse(decoder.decode(await readBounded(jwksResp,64000))));
if(!verified||verified.sha!==expectedSha)throw Error('GitHub issuer signature/claims or SHA invalid');
console.log('Independent GitHub OIDC signed Fast readback verified: '+verified.run);
