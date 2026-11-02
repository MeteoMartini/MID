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
export async function fetchVerifiedCopernicusSnowPng(tile:CopernicusSnowTile,signal:AbortSignal):Promise<Blob>{
 const verified=validateCopernicusSnowTile(tile);
 if(!globalThis.crypto?.subtle)throw new Error('Secure SHA-256 verification unavailable');
 const response=await fetch(verified.imagePath,{signal,cache:'no-store',redirect:'error'});
 if(!response.ok||!String(response.headers.get('content-type')||'').toLowerCase().startsWith('image/png'))
  throw new Error('Copernicus snow tile is not an available PNG');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength!==verified.compressedBytes||bytes.byteLength>8_000_000)
  throw new Error('Copernicus snow tile unexpected byte length');
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==verified.imageSha256)throw new Error('Copernicus snow tile SHA mismatch');
 return new Blob([bytes],{type:'image/png'});
}
