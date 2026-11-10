/**
 * MID spatial OM research evidence: independent SHA-256 verification of a
 * bounded captured HTTP-206 byte range. This does NOT decode, license, attest
 * the whole file, compare to DWD native GRIB or enable map publication.
 */
import type {FrameResult} from './openMeteoSpatialManifest';
import {planOmHeaderProbe} from './openMeteoSpatialByteRange';

export interface SpatialRangeReceipt {
 readonly model:'dwd_icon_d2'|'dwd_icon_eu';
 readonly run:string;readonly valid:string;readonly field:string;
 readonly file:string;readonly capturedUtc:string;
 readonly kind:'header'|'trailer'|'root'|'descriptor'|'lut'|'chunk';
 readonly start:number;readonly end:number;readonly totalBytes:number;
 readonly httpStatus:206;readonly contentRange:string;
 readonly contentLength:number;readonly contentType:'application/octet-stream';
 readonly sha256:string;
}
export type SpatialRangeProofResult=
 | {readonly ok:false;readonly reason:string}
 | {readonly ok:true;readonly status:'range-bytes-hash-matched-research-only';
    readonly model:'dwd_icon_d2'|'dwd_icon_eu';readonly run:string;
    readonly valid:string;readonly field:string;readonly kind:SpatialRangeReceipt['kind'];
    readonly rangeSha256:string;readonly byteLength:number;
    readonly publicationApproved:false;readonly wholeFileAttested:false;
    readonly nativeDwdParityVerified:false};

const MAX_RANGE=4*1024*1024,MAX_FILE=256*1024*1024;
const utc=(s:unknown):number|null=>{
 if(typeof s!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?Z$/.test(s))return null;
 const n=Date.parse(s);if(!Number.isFinite(n))return null;
 const canonical=new Date(n).toISOString();
 return s===canonical.slice(0,16)+'Z'||s===canonical.slice(0,19)+'Z'?n:null;
};
/** Caller must provide the original bytes. A receipt alone cannot pass. */
export async function verifySpatialRangeReceipt(
 frame:FrameResult,receipt:unknown,bytes:Uint8Array,
):Promise<SpatialRangeProofResult>{
 if(frame.status!=='manifest-only')return{ok:false,reason:'frame-unqualified'};
 const planned=planOmHeaderProbe(frame);
 if(!planned.ok)return{ok:false,reason:'frame-unqualified'};
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))return{ok:false,reason:'invalid-receipt'};
 const r=receipt as Partial<SpatialRangeReceipt>;
 const run=utc(r.run),valid=utc(r.valid),captured=utc(r.capturedUtc);
 if(r.model!==frame.model||r.field!==frame.variable||run===null||valid===null||
   Date.parse(frame.referenceTime)!==run||Date.parse(frame.validTime)!==valid||
   typeof r.file!=='string'||
   'https://openmeteo.s3.amazonaws.com/data_spatial/'+r.file!==planned.probe.url)
   return{ok:false,reason:'model-run-valid-field-file-mismatch'};
 // Historical source captures cannot be silently backdated after expiry.
 if(captured===null||captured<run||captured>run+7*86400_000)
   return{ok:false,reason:'unqualified-capture-time'};
 if(!['header','trailer','root','descriptor','lut','chunk'].includes(r.kind||''))
   return{ok:false,reason:'unsupported-range-kind'};
 if(!Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||
   !Number.isSafeInteger(r.totalBytes)||r.start!<0||r.end!<r.start!||
   r.totalBytes!<=64||r.totalBytes!>MAX_FILE||r.end!>=r.totalBytes!||
   r.end!-r.start!+1>MAX_RANGE)
   return{ok:false,reason:'invalid-or-oversized-byte-range'};
 if(r.kind==='header'&&(r.start!==0||r.end!==63))
   return{ok:false,reason:'invalid-header-range'};
 if(r.kind==='trailer'&&(r.start!==r.totalBytes!-24||r.end!==r.totalBytes!-1))
   return{ok:false,reason:'invalid-trailer-range'};
 const length=r.end!-r.start!+1;
 if(r.httpStatus!==206||
   r.contentRange!=='bytes '+r.start+'-'+r.end+'/'+r.totalBytes||
   r.contentLength!==length||r.contentType!=='application/octet-stream')
   return{ok:false,reason:'response-range-metadata-mismatch'};
 if(!(bytes instanceof Uint8Array)||bytes.byteLength!==length||bytes.byteLength>MAX_RANGE||
   typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sha256))
   return{ok:false,reason:'invalid-bytes-or-digest'};
 // A digest proves only that the bytes match the supplied digest; it must
 // never be mistaken for OM format verification. Check known boundary magic.
 if((r.kind==='header'||r.kind==='trailer')&&
    (bytes[0]!==0x4f||bytes[1]!==0x4d||bytes[2]!==0x03))
   return{ok:false,reason:'invalid-om-boundary-magic'};
 if(r.kind==='trailer'&&bytes.slice(3,8).some(byte=>byte!==0))
   return{ok:false,reason:'invalid-om-trailer-preamble'};
 if(typeof crypto==='undefined'||!crypto.subtle?.digest)
   return{ok:false,reason:'sha256-unavailable'};
 let digest:ArrayBuffer;
 try{digest=await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes))}
 catch{return{ok:false,reason:'sha256-failed'}}
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==r.sha256)return{ok:false,reason:'sha256-mismatch'};
 return{ok:true,status:'range-bytes-hash-matched-research-only',
   model:frame.model,run:r.run!,valid:r.valid!,field:r.field!,kind:r.kind as SpatialRangeReceipt['kind'],
   rangeSha256:actual,byteLength:length,publicationApproved:false,
   wholeFileAttested:false,nativeDwdParityVerified:false};
}
