/** Original Alpine FSC/GFSC raster handoff. No remote BYOC URLs or browser credentials.
 * A manifest CLAIM is not evidence: the original-COG/QA admission remains external.
 * Only immutable same-origin assets, with browser SHA-256 verification, may be rendered.
 */
import {COPERNICUS_SNOW_COLLECTIONS,type CopernicusSnowKind} from './copernicusSnowObservation';

export type CopernicusSnowTile={
 schema:'mid.copernicus.alpine-snow-tile.v1';
 productionApproved:true;
 kind:CopernicusSnowKind;
 collectionId:string;
 productDayUtc:string;
 // Native Sentinel-2 UTM raster MUST have been reprojected by producer.
 mapProjection:'EPSG:4326';
 reprojectionMethod:'nearest-neighbor';
 bounds:[[number,number],[number,number]]; // SW / NE, lat then lon
 imagePath:string; // same-origin immutable PNG; never full external URL
 imageSha256:string;
 compressedBytes:number;
 sourceCogSha256:string;
 qaMaskSha256:string;
 qaFlagsDecoded:true;
 cloudsAndWaterTransparent:true;
 noDataTransparent:true;
 validZeroColorEncoded:true;
 maxPixelAcquisitionAgeDays:number;
 citation:'Copernicus Land Monitoring Service';
};
/** Every manifest field is part of the tile's render identity, not only the PNG hash.
 * A reused PNG at a new location or with changed QA must be re-admitted. */
export const copernicusSnowTileIdentity=(tile:CopernicusSnowTile):string=>JSON.stringify(tile);
const sha=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function validateCopernicusSnowTile(raw:unknown,nowMs=Date.now()):CopernicusSnowTile{
 if(!raw||typeof raw!=='object')throw new Error('Missing Copernicus snow tile manifest');
 const t=raw as Partial<CopernicusSnowTile>;
 if(t.schema!=='mid.copernicus.alpine-snow-tile.v1'||t.productionApproved!==true
    ||!['FSC-OG','FSC-TOC','GFSC'].includes(t.kind||''))throw new Error('Snow tile not production-approved');
 const expected=t.kind==='GFSC'?COPERNICUS_SNOW_COLLECTIONS.GFSC:COPERNICUS_SNOW_COLLECTIONS.FSC;
 if(t.collectionId!==expected||t.citation!=='Copernicus Land Monitoring Service')
  throw new Error('Snow tile original product identity/provenance mismatch');
 if(t.mapProjection!=='EPSG:4326'||t.reprojectionMethod!=='nearest-neighbor'
    ||t.qaFlagsDecoded!==true||t.cloudsAndWaterTransparent!==true
    ||t.noDataTransparent!==true||t.validZeroColorEncoded!==true)
  throw new Error('Snow tile projection, QA/NoData and zero semantics unverified');
 if(!Array.isArray(t.bounds)||t.bounds.length!==2
    ||t.bounds.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>typeof v!=='number'||!Number.isFinite(v))))
  throw new Error('Snow tile geometry invalid');
 const [[south,west],[north,east]]=t.bounds;
 if(!(south>=42&&north<=50&&south<north&&west>=1&&east<=21&&west<east
       &&north-south<=2&&east-west<=4))throw new Error('Snow tile bbox not original Alpine tile');
 if(typeof t.productDayUtc!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.productDayUtc))
  throw new Error('Snow tile UTC product day invalid');
 const epoch=Date.parse(t.productDayUtc+'T00:00:00Z');
 if(!Number.isFinite(nowMs)||!Number.isFinite(epoch)
    ||new Date(epoch).toISOString().slice(0,10)!==t.productDayUtc
    ||nowMs<epoch||nowMs-epoch>4*86400000)throw new Error('Snow tile product stale or future');
 if(typeof t.imagePath!=='string'||!/^\/snow\/validated\/[a-f0-9]{64}\/[a-z0-9_-]{1,80}\.png$/.test(t.imagePath))
  throw new Error('Snow tile URL not an immutable same-origin asset');
 if(!sha(t.imageSha256)||!sha(t.sourceCogSha256)||!sha(t.qaMaskSha256)
    ||t.imagePath.split('/')[3]!==t.imageSha256
    ||!Number.isInteger(t.compressedBytes)||t.compressedBytes!<100||t.compressedBytes!>8_000_000)
  throw new Error('Snow tile SHA/byte inventory invalid');
 if(typeof t.maxPixelAcquisitionAgeDays!=='number'||!Number.isInteger(t.maxPixelAcquisitionAgeDays)
    ||t.maxPixelAcquisitionAgeDays<0||t.maxPixelAcquisitionAgeDays>(t.kind==='GFSC'?7:2))
  throw new Error('Snow tile pixel age not scientifically qualified');
 return t as CopernicusSnowTile;
}
/** Bounded PNG envelope check, not a replacement for original COG/pixel QA.
 * Require an 8-bit non-interlaced RGBA tile so missing pixels CAN be transparent;
 * a small compressed file must never declare an unbounded decoded image.
 */
export function validateCopernicusSnowPngStructure(bytes:Uint8Array):void{
 const signature=[137,80,78,71,13,10,26,10];
 if(bytes.length<45||signature.some((v,i)=>bytes[i]!==v))
  throw new Error('Snow raster is not a complete PNG');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let offset=8,chunks=0,seenData=false,dataClosed=false,ended=false;
 while(offset<bytes.length){
  if(++chunks>512||offset+12>bytes.length)throw new Error('Snow PNG chunk inventory invalid');
  const length=view.getUint32(offset);
  if(length>bytes.length-offset-12)throw new Error('Snow PNG chunk exceeds byte budget');
  const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
  if(!/^[A-Za-z]{4}$/.test(type))throw new Error('Snow PNG chunk type invalid');
  if(chunks===1){
   if(type!=='IHDR'||length!==13)throw new Error('Snow PNG missing IHDR');
   const width=view.getUint32(offset+8),height=view.getUint32(offset+12);
   if(!width||!height||width>4096||height>4096||width*height>8_388_608)
    throw new Error('Snow PNG decoded pixel budget exceeded');
   if(bytes[offset+16]!==8||bytes[offset+17]!==6||bytes[offset+18]!==0
      ||bytes[offset+19]!==0||bytes[offset+20]!==0)
    throw new Error('Snow PNG must be non-interlaced RGBA8 with alpha');
   // Header CRC protects the dimensions and color-mode gate even before SHA.
   let crc=0xffffffff;
   for(let i=offset+4;i<offset+21;i++){
    crc^=bytes[i];
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(0xedb88320&-(crc&1));
   }
   if(((crc^0xffffffff)>>>0)!==view.getUint32(offset+21))
    throw new Error('Snow PNG IHDR CRC invalid');
  }else if(type==='IHDR')throw new Error('Snow PNG duplicate IHDR');
  if(type==='acTL'||type==='fcTL'||type==='fdAT')
   throw new Error('Animated snow PNG is not an immutable raster');
  if(type[0]===type[0].toUpperCase()&&!['IHDR','PLTE','IDAT','IEND'].includes(type))
   throw new Error('Snow PNG unknown critical chunk');
  if(type==='IDAT'){
   if(dataClosed)throw new Error('Snow PNG IDAT chunks must be contiguous');
   seenData=true;
  }else if(seenData)dataClosed=true;
  const next=offset+12+length;
  if(type==='IEND'){
   if(length!==0||!seenData||next!==bytes.length)
    throw new Error('Snow PNG missing image data or has trailing bytes');
   ended=true;break;
  }
  offset=next;
 }
 if(!ended)throw new Error('Snow PNG missing terminal IEND');
}
export async function fetchVerifiedCopernicusSnowPng(tile:CopernicusSnowTile,signal:AbortSignal):Promise<Blob>{
 const verified=validateCopernicusSnowTile(tile);
 if(!globalThis.crypto?.subtle)throw new Error('Secure SHA-256 verification unavailable');
 const response=await fetch(verified.imagePath,{signal,cache:'no-store',redirect:'error'});
 if(!response.ok||!String(response.headers.get('content-type')||'').toLowerCase().startsWith('image/png'))
  throw new Error('Copernicus snow tile is not an available PNG');
 const lengthHeader=response.headers.get('content-length');
 if(lengthHeader!==null&&(!/^[0-9]+$/.test(lengthHeader)||Number(lengthHeader)>verified.compressedBytes))
  throw new Error('Snow PNG HTTP length exceeds attested budget');
 if(!response.body)throw new Error('Snow PNG bounded streaming unavailable');
 const reader=response.body.getReader(),parts:Uint8Array[]=[];
 let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   if(!value?.byteLength)continue;
   size+=value.byteLength;
   if(size>verified.compressedBytes||size>8_000_000){
    void reader.cancel().catch(()=>{});
    throw new Error('Snow PNG stream exceeds attested byte budget');
   }
   parts.push(value);
  }
 }finally{reader.releaseLock()}
 if(size!==verified.compressedBytes)throw new Error('Snow PNG unexpected byte length');
 const binary=new Uint8Array(size);let at=0;
 for(const part of parts){binary.set(part,at);at+=part.byteLength}
 validateCopernicusSnowPngStructure(binary);
 const bytes=binary.buffer;
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==verified.imageSha256)throw new Error('Copernicus snow tile SHA mismatch');
 return new Blob([bytes],{type:'image/png'});
}
