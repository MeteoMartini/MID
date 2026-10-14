import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {decodeRucLosslessCandidate, RUC_CANDIDATE_SCHEMA, RUC_MAX_DECODED_BYTES} from './lossless_candidate_decoder.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const candidates = ['gzip', 'byteplanes-gzip', 'delta-byteplanes-gzip'];
function build(raw, codec) {
  let shaped = raw;
  if (codec !== 'gzip') {
    const n = raw.length / 2;
    shaped = Buffer.alloc(raw.length);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const word = raw.readUInt16LE(i * 2);
      const value = codec === 'byteplanes-gzip' ? word : (word - last) & 0xffff;
      shaped[i] = value & 255;
      shaped[i + n] = value >>> 8;
      last = word;
    }
  }
  const wire = gzipSync(shaped, {level: 6, mtime: 0});
  return [{schema:RUC_CANDIDATE_SCHEMA,codec,decodedBytes:raw.length,
    encodedBytes:wire.length,decodedSha256:sha256(raw),encodedSha256:sha256(wire)},new Uint8Array(wire)];
}
async function rejects(fn) {await assert.rejects(fn, /RUC codec|invalid|gzip|SHA/i);}
const everyI16 = Buffer.alloc(65536 * 2);
for (let i=0; i<65536; i++) everyI16.writeUInt16LE(i, i * 2);
const cases = [everyI16, Buffer.from('00000080ff7fffff000001003412', 'hex'), Buffer.alloc(64), Buffer.from('01020304', 'hex')];
let passed=0;
for (const raw of cases) for (const codec of candidates) {
  const [manifest, wire] = build(raw, codec);
  assert.deepEqual(Buffer.from(await decodeRucLosslessCandidate(manifest,wire)),raw);
  await rejects(() => decodeRucLosslessCandidate({...manifest, codec:'unknown'},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, schema:'mid.dwd.ruc.grid.v2'},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, encodedBytes:manifest.encodedBytes+1},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, decodedBytes:RUC_MAX_DECODED_BYTES+1},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, decodedSha256:'f'.repeat(64)},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, extra:true},wire));
  await rejects(() => decodeRucLosslessCandidate({...manifest, encodedBytes:true},wire));
  const corrupt=new Uint8Array(wire);corrupt[Math.floor(corrupt.length/2)]^=1;
  await rejects(() => decodeRucLosslessCandidate(manifest,corrupt));
  await rejects(() => decodeRucLosslessCandidate(manifest,wire.slice(0,-1)));
  passed++;
}
// Python 3 gzip.compress(..., compresslevel=6, mtime=0) cross-language fixtures.
const pythonGolden = {
  gzip: '1f8b08000000000000ff63606068f85fffff3f03032383891000443e552c0e000000',
  'byteplanes-gzip': '1f8b08000000000000ff6360f8ff9f81d184a1a1fe3f03831000b3c6eba30e000000',
  'delta-byteplanes-gzip': '1f8b08000000000000ff6360f8cfc0c868ccd0f0bf818141080066376dde0e000000'
};
const pythonRaw = Buffer.from('00000080ff7fffff000001003412','hex');
for (const codec of candidates) {
  const wire = new Uint8Array(Buffer.from(pythonGolden[codec],'hex'));
  const manifest={schema:RUC_CANDIDATE_SCHEMA,codec,decodedBytes:pythonRaw.length,
    encodedBytes:wire.length,decodedSha256:sha256(pythonRaw),encodedSha256:sha256(wire)};
  assert.deepEqual(Buffer.from(await decodeRucLosslessCandidate(manifest, wire)),pythonRaw);
}
const bomb = gzipSync(Buffer.alloc(10000),{mtime:0});
const m = {schema:RUC_CANDIDATE_SCHEMA, codec:'gzip',decodedBytes:100,encodedBytes:bomb.length,
 decodedSha256:sha256(Buffer.alloc(100)),encodedSha256:sha256(bomb)};
await rejects(()=>decodeRucLosslessCandidate(m,new Uint8Array(bomb)));
const extra=Buffer.concat([gzipSync(Buffer.from('AB'),{mtime:0}),gzipSync(Buffer.from('CD'),{mtime:0})]);
const extraMeta={schema:RUC_CANDIDATE_SCHEMA,codec:'gzip',decodedBytes:2,encodedBytes:extra.length,
 decodedSha256:sha256(Buffer.from('AB')),encodedSha256:sha256(extra)};
await rejects(()=>decodeRucLosslessCandidate(extraMeta,new Uint8Array(extra)));
console.log('MID RUC JS codec candidate: ' + passed + ' full roundtrips, 65536 int16 patterns and 3 Python-golden fixtures; corrupt, truncated, oversized and unknown wire rejected');
