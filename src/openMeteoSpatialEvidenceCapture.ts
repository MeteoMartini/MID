/**
 * Capture an independently replayable bounded HTTP-206 OM byte range.
 * Research-only: caller must separately preserve the bytes and receipt.
 * No network request, decode, persistence, or publication occurs here.
 */
import type {FrameResult} from './openMeteoSpatialManifest';
import {planOmHeaderProbe} from './openMeteoSpatialByteRange';
import type {SpatialRangeReceipt} from './openMeteoSpatialRangeProof';
import {verifySpatialRangeReceipt} from './openMeteoSpatialRangeProof';

export type SpatialCaptureResult =
 | {readonly ok:false;readonly reason:string}
 | {readonly ok:true;readonly receipt:SpatialRangeReceipt;readonly bytes:Uint8Array;
    readonly publicationApproved:false};

export async function captureSpatialEvidence(
 frame:FrameResult, kind:'header'|'trailer',
 response:Pick<Response,'url'|'status'|'headers'|'arrayBuffer'>,
 capturedUtc:string,
):Promise<SpatialCaptureResult>{
 const plan=planOmHeaderProbe(frame);
 if(!plan.ok||frame.status!=='manifest-only')return{ok:false,reason:'frame-unqualified'};
 // Reject origin substitutions and redirects before reading a single byte.
 // URL matching is necessary evidence, not a cryptographic origin attestation.
 if(response.url!==plan.probe.url)return{ok:false,reason:'unexpected-response-origin'};
 if(response.status!==206)return{ok:false,reason:'range-not-honored'};
 const rawRange=response.headers.get('content-range');
 const match=/^bytes (\d+)-(\d+)\/([1-9]\d*)$/.exec(rawRange||'');
 if(!match)return{ok:false,reason:'invalid-content-range'};
 const [start,end,totalBytes]=match.slice(1).map(Number);
 if(![start,end,totalBytes].every(Number.isSafeInteger)||
    totalBytes<=64||totalBytes>256*1024*1024||
    (kind==='header'&&(start!==0||end!==63))||
    (kind==='trailer'&&(start!==totalBytes-24||end!==totalBytes-1)))
   return{ok:false,reason:'unqualified-range'};
 const length=end-start+1;
 if(response.headers.get('content-length')!==String(length)||
    response.headers.get('content-type')?.toLowerCase().split(';')[0].trim()!=='application/octet-stream')
   return{ok:false,reason:'invalid-response-headers'};
 let bytes:Uint8Array;
 try{bytes=new Uint8Array(await response.arrayBuffer())}
 catch{return{ok:false,reason:'body-unavailable'}}
 if(bytes.byteLength!==length)return{ok:false,reason:'wrong-byte-count'};
 if(typeof crypto==='undefined'||!crypto.subtle?.digest)
   return{ok:false,reason:'sha256-unavailable'};
 let digest:ArrayBuffer;
 try{digest=await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes))}
 catch{return{ok:false,reason:'sha256-failed'}}
 const sha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 const receipt:SpatialRangeReceipt={
   model:frame.model,run:frame.referenceTime,valid:frame.validTime,
   field:frame.variable,
   file:plan.probe.url.slice('https://openmeteo.s3.amazonaws.com/data_spatial/'.length),
   capturedUtc,kind,start,end,totalBytes,httpStatus:206,
   contentRange:rawRange!,contentLength:length,contentType:'application/octet-stream',sha256,
 };
 const check=await verifySpatialRangeReceipt(frame,receipt,bytes);
 if(!check.ok)return{ok:false,reason:check.reason};
 return{ok:true,receipt,bytes,publicationApproved:false};
}
