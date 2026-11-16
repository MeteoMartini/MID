import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {downloadMid740Envelope as download} from '../../tools/ci/mid-740-download-artifact-envelope.mjs';

const api='https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/12/zip';
const signed='https://production.mid.blob.core.windows.net/bucket/download?sv=signed';
const data=new Uint8Array([0x50,0x4b,0x03,0x04,1,2,3,4,5,6]);
const digest=createHash('sha256').update(data).digest('hex');
const artifact=()=>({id:12,
 url:'https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/12',
 archive_download_url:api,expired:false,digest:'sha256:'+digest,size_in_bytes:data.length});
function mock({location=signed,body=data,cdStatus=200}={}){
 const sent:{url:string;auth?:string|null}[]=[];
 const fetcher=async(url:string,opts:any)=>{
  sent.push({url,auth:opts.headers?.Authorization??null});
  if(url===api)return new Response(null,{status:302,headers:{location}});
  return new Response(body,{status:cdStatus});
 };
 return {sent,fetcher};
}
describe('MID #740: GitHub archive bytes from exact ID without redirect credential leak',()=>{
 it('downloads exact binary digest; never forwards GitHub authorization to CDN',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-fetch-'));
  try{
   const x=mock(),output=join(root,'envelope.zip');
   const result=await download({artifact:artifact(),output,token:'trusted-test-token'},x.fetcher);
   expect(result).toMatchObject({envelopeSha256:digest,bytes:data.length,
    downloadedEnvelopeBytesVerified:true,installerAuthorized:false,releaseAuthorized:false});
   expect(x.sent).toEqual([{url:api,auth:'Bearer trusted-test-token'},
    {url:signed,auth:null}]);
   expect(existsSync(output)).toBe(true);
   await expect(download({artifact:artifact(),output,token:'trusted-test-token'},x.fetcher))
    .rejects.toThrow('MID_740_UNSAFE_OUTPUT_PATH');
  }finally{rmSync(root,{recursive:true,force:true})}
 });
 it.each([
  ['untrusted redirect','https://evil.example/path'],
  ['plaintext redirect','http://production.mid.blob.core.windows.net/path'],
  ['credentialed redirect','https://user:secret@production.mid.blob.core.windows.net/x'],
  ['private redirect','https://127.0.0.1/secret'],
  ['arbitrary GitHub redirect','https://github.com/MeteoMartini/MID']
 ])('%s blocks without writing output',async(_,location)=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-fetch-'));
  try{
   const path=join(root,'out.zip');
   await expect(download({artifact:artifact(),output:path,token:'trusted-test-token'},
    mock({location}).fetcher)).rejects.toThrow('MID_740_UNTRUSTED_REDIRECT');
   expect(existsSync(path)).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true})}
 });
 it('rejects incorrect digest, size, failed CDN, foreign artifact, missing token',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-fetch-'));
  try{
   const location=join(root,'out.zip');
   const altered={...artifact(),digest:'sha256:'+'f'.repeat(64)};
   await expect(download({artifact:altered,output:location,token:'trusted-test-token'},
    mock().fetcher)).rejects.toThrow('MID_740_DOWNLOAD_ENVELOPE_SHA256_MISMATCH');
   expect(existsSync(location)).toBe(false);
   await expect(download({artifact:{...artifact(),size_in_bytes:3},
    output:location,token:'trusted-test-token'},mock().fetcher))
    .rejects.toThrow('MID_740_OVERSIZED_DOWNLOAD');
   await expect(download({artifact:artifact(),output:location,token:'trusted-test-token'},
    mock({cdStatus:410}).fetcher)).rejects.toThrow('MID_740_UNEXPECTED_CDN_RESPONSE');
   await expect(download({artifact:{...artifact(),id:999},output:location,token:'trusted-test-token'},
    mock().fetcher)).rejects.toThrow('MID_740_UNTRUSTED_ARTIFACT_INPUT');
   await expect(download({artifact:artifact(),output:location,token:''},
    mock().fetcher)).rejects.toThrow('MID_740_UNTRUSTED_ARTIFACT_INPUT');
  }finally{rmSync(root,{recursive:true,force:true})}
 });
});