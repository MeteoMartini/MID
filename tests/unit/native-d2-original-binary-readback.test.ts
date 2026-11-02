/**
 * Read-only DWD ICON-D2 original binary -> actual MID TypeScript consumer contract.
 * The GitHub Actions artifact must already be separately verified by run SHA,
 * artifact SHA256, and original GRIB/WMO/bitmap pipeline. This NEVER approves
 * these staging-only objects or publishes a map. In-memory approval flags are
 * ONLY for exercising post-authorization client parsing against original bytes.
 */
import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {join,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {D2_FULL_DOMAIN_KINDS,validateD2FullDomainIndex,validateD2FullDomainField} from '../../src/nativeD2FullDomain';
import type {NativeFieldKind,NativeFrameRef} from '../../src/nativeModelFields';

const originalRoot=process.env.MID_D2_ORIGINAL_SITE_PATH;
describe.skipIf(!originalRoot)('Genuine SHA-verified full-domain native D2 binary -> MID browser decoder (shadow only)',()=>{
 it('replays all 72 unchanged original frame bytes, distinct masked zeros, UTC and source geometry',()=>{
  const root=originalRoot!;
  const indexes=readdirSync(root,{recursive:true})
   .filter(v=>typeof v==='string'&&basename(v)==='index.json')
   .map(v=>join(root,v));
  expect(indexes).toHaveLength(1);
  const indexFile=indexes[0];
  const raw=JSON.parse(readFileSync(indexFile,'utf8'));
  expect(raw.productionApproved).toBe(false);
  const originalInventory=raw.sourceInventorySha256;
  expect(originalInventory).toMatch(/^[a-f0-9]{64}$/);
  // Only the trusted publisher may ever approve native data. This strict
  // in-memory mock tests the actual client decoding path, not provenance grants.
  const browserIndex=validateD2FullDomainIndex(
   {...raw,productionApproved:true},
   Date.parse(raw.run)+10*3600000
  );
  let checked=0,missing=0,realZeros=0,maskedPacking=0;
  let gridSignature:string|null=null;
  for(const kind of D2_FULL_DOMAIN_KINDS){
   const frames=browserIndex.products[kind]!.frames;
   for(const frame of frames){
    const ref=frame as NativeFrameRef,filename=join(indexFile,'..',ref.file);
    const immutable=readFileSync(filename);
    expect(immutable.byteLength).toBe(ref.bytes);
    expect(createHash('sha256').update(immutable).digest('hex')).toBe(ref.sha256);
    const decoded=gunzipSync(immutable);
    expect(decoded.byteLength).toBe(ref.decodedBytes);
    const original=JSON.parse(decoded.toString('utf8'));
    expect(original.productionApproved).toBe(false);
    expect(original.sourceInventorySha256).toBe(originalInventory);
    const verified=validateD2FullDomainField(
     {...original,productionApproved:true},
     browserIndex,ref,kind as NativeFieldKind
    );
    const signature=JSON.stringify([verified.lats.length,verified.lons.length,
     verified.lats[0],verified.lons[0],verified.lats.at(-1),verified.lons.at(-1)]);
    if(gridSignature!==null)expect(signature).toBe(gridSignature);
    gridSignature=signature;
    expect(verified.values.length).toBe(verified.lats.length*verified.lons.length);
    for(let i=0;i<verified.values.length;i++){
     const v=verified.values[i];
     if(Number.isNaN(v))missing++;
     else if(v===0)realZeros++;
    }
    if(kind==='precipitation')maskedPacking+=Number(original.negativePackingUncertainNoDataCells);
    checked++;
   }
  }
  expect(checked).toBe(72);
  expect(missing).toBeGreaterThanOrEqual(maskedPacking);
  expect(realZeros).toBeGreaterThan(0);
  console.log(JSON.stringify({schema:'mid.d2.original-browser-shadow-readback.v1',
   frames:checked,originalInventorySha256:originalInventory,
   missingPreserved:missing,realZerosPreserved:realZeros,
   packingUncertaintyMasked:maskedPacking,
   productionApproved:false,clientVisible:false,
   testedScope:'TypeScript decoder of authentic native D2 original pixels; not Safari, map or export QA'}));
 });
});
