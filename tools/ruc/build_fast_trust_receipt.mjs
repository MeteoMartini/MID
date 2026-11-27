import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const SHA256=/^[a-f0-9]{64}$/;
const SHA40=/^[a-f0-9]{40}$/;
const RUN=/^20\d{2}-\d\d-\d\dT\d\d:00$/;
export function trustedFastReceipt(proof,env,version,now=Date.now()){
 const fail=message=>{throw new Error('FAST_TRUST_DENIED: '+message)};
 if(env?.GITHUB_REPOSITORY!=='MeteoMartini/MID'||env?.GITHUB_REF!=='refs/heads/main')
  fail('requires protected canonical main workflow');
 if(!SHA40.test(env?.GITHUB_SHA||'')||env?.STABLE_SHA!==env.GITHUB_SHA)
  fail('source/stable SHA mismatch');
 if(!/^[1-9]\d*$/.test(env?.GITHUB_RUN_ID||''))
  fail('unverifiable publisher run id');
 if(!/^\d+\.\d+\.\d+\.\d+$/.test(version||''))
  fail('invalid released candidate version');
 if(!proof||!SHA256.test(proof.fastManifestSha256||'')||!SHA256.test(proof.primaryManifestSha256||''))
  fail('artifact-bound manifest digests missing');
 if(proof.publicationAuthorized!==false)fail('unrecognized candidate proof');
 if(typeof proof.run!=='string'||!RUN.test(proof.run))
  fail('original DWD run not canonical UTC');
 const when=Date.parse(proof.run+'Z');
 if(!Number.isFinite(when)||new Date(when).toISOString().slice(0,16)!==proof.run)
  fail('invalid source run calendar');
 if(!Number.isFinite(now)||now-when>4*3600000||when-now>5*60000)
  fail('unfresh/future native source run');
 if(!Number.isSafeInteger(proof.siteBytes)||proof.siteBytes<=0||proof.siteBytes>=900000000)
  fail('Pages physical budget missing or exceeded');
 return {
  schema:'mid.ruc.fast-publisher-trust.v1',
  version,repository:'MeteoMartini/MID',stableSha:env.STABLE_SHA,run:proof.run,
  fastManifestSha256:proof.fastManifestSha256,
  sourceRunId:Number(env.GITHUB_RUN_ID),
  publishedAt:new Date(now).toISOString()
 };
}

if(process.argv[1]&&resolve(fileURLToPath(import.meta.url))===resolve(process.argv[1])){
 const [input,output]=process.argv.slice(2);
 if(!input||!output)throw new Error('Expected candidate proof input and private receipt output');
 const [proof,pkg]=await Promise.all([readFile(input,'utf8'),readFile(new URL('../../package.json',import.meta.url),'utf8')]);
 const receipt=trustedFastReceipt(JSON.parse(proof),process.env,JSON.parse(pkg).version);
 await writeFile(output,JSON.stringify(receipt)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
 console.log('Trusted Fast publisher receipt prepared for '+receipt.version+' / '+receipt.run);
}
