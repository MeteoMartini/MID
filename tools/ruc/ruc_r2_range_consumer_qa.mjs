#!/usr/bin/env node
/*
 * Offline-only Cloudflare-style R2 range consumer parity proof.
 * All reads are local filesystem emulations: no real R2 bucket, Worker
 * CPU admission, production routing, or release permission is implied.
 */
import {readFile,open,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';

const SHA = d => createHash('sha256').update(d).digest('hex');
const SCHEMA = 'mid.ruc.r2.lossless-range-pack-qa.v1';
const POINTS = 542040;

function assert(value, reason) {
  if (!value) throw new Error(reason);
}

async function readExact(handle, offset, length) {
  assert(Number.isSafeInteger(offset) && offset >= 0 &&
         Number.isSafeInteger(length) && length > 0 &&
         length <= 4 * 1024 * 1024, 'unbounded or invalid range request');
  const result = Buffer.alloc(length);
  let done = 0;
  while (done < length) {
    const {bytesRead} = await handle.read(result, done, length - done, offset + done);
    assert(bytesRead > 0, 'R2 range shortened or absent');
    done += bytesRead;
  }
  return result;
}

async function workerCompatibleInflate(compressed, expectedLength) {
  assert(typeof DecompressionStream === 'function', 'Workers/Node stream API missing');
  assert(expectedLength > 0 && expectedLength <= 4 * 1024 * 1024, 'unbounded decoded size');
  // Cloudflare Workers explicitly support DecompressionStream('deflate').
  // Python zlib.compress emits a zlib-wrapped deflate stream.
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'));
  const data = new Uint8Array(await new Response(stream).arrayBuffer());
  assert(data.byteLength === expectedLength, 'decoded range length mismatch');
  return data;
}

async function verifyLocation({index, source, packed, cell}) {
  const rows = [];
  let calls = 0, compressedTransferred = 0;
  for (const desc of index.entries) {
    if (!desc.name.endsWith('.bin') || desc.recordBytes <= 1 ||
        desc.sourceBytes !== index.sourcePointCount * desc.recordBytes) continue;
    const recordStart = cell * desc.recordBytes;
    let chunkStart = 0, selected;
    for (const ch of desc.chunks) {
      if (recordStart >= chunkStart &&
          recordStart + desc.recordBytes <= chunkStart + ch.rawBytes) {
        selected = {chunk: ch, begin: recordStart - chunkStart};
        break;
      }
      chunkStart += ch.rawBytes;
    }
    assert(selected, 'native cell record crosses chunk boundary: ' + desc.name);
    const original = await open(join(source, desc.name), 'r');
    const zlib = await open(join(packed, desc.compressedKey), 'r');
    try {
      const c = await readExact(zlib, selected.chunk.offset, selected.chunk.bytes);
      assert(SHA(c) === selected.chunk.sha256, 'compressed SHA mismatch: ' + desc.name);
      const decoded = await workerCompatibleInflate(c, selected.chunk.rawBytes);
      assert(SHA(decoded) === selected.chunk.rawSha256, 'decoded SHA mismatch: ' + desc.name);
      const recovered = Buffer.from(decoded.buffer, decoded.byteOffset + selected.begin, desc.recordBytes);
      const expected = await readExact(original, recordStart, desc.recordBytes);
      assert(recovered.equals(expected), 'pointwise native bytes mismatch: ' + desc.name);
      rows.push(desc.name);
      calls += 1;
      compressedTransferred += c.length;
    } finally {
      await original.close();
      await zlib.close();
    }
  }
  assert(rows.includes('deterministic.bin') && rows.includes('eps-summary.bin') &&
         rows.includes('eps-members.bin'), 'missing deterministic / EPS20 point consumer parity');
  assert(calls < 50, 'exceeded Workers Free R2 subrequest cap for one point');
  return {cell, records:rows.length, simulatedR2RangeReads:calls,
          compressedBytesFetched:compressedTransferred};
}

async function main() {
  const args = process.argv.slice(2);
  const get = flag => {
    const i = args.indexOf(flag);
    assert(i >= 0 && args[i + 1], 'missing ' + flag);
    return args[i + 1];
  };
  const source = resolve(get('--source'));
  const packed = resolve(get('--pack'));
  const dest = resolve(get('--report'));
  const idxRaw = await readFile(join(packed, 'range-index.json'));
  const index = JSON.parse(idxRaw);
  assert(index.schema === SCHEMA && index.sourcePointCount === POINTS,
         'unexpected native DWD grid');
  assert(index.timeCount === 28 && index.horizonHours === 27 &&
         index.epsMemberCount === 20 && index.nativeEpsMemberObjectsIncluded === true,
         'missing 27h/EPS20');
  assert(index.objectCount === 12 && index.entries.length === 12,
         'missing original RUC object scope');
  assert(index.stableSha === 'd8852f672a40d26348d214dc85e9a3a1b9d79c1f',
         'unexpected authenticated source SHA');
  const fromSource = await readFile(join(source,'latest.json'));
  assert(SHA(fromSource) === index.sourceManifestSha256, 'original metadata drift');
  const start = process.cpuUsage();
  const cells = [0,1,7,47,1704,Math.floor(POINTS/2),POINTS-1];
  const rows = [];
  for (const cell of cells) rows.push(await verifyLocation({index,source,packed,cell}));
  const cpu = process.cpuUsage(start);
  const report = {
    schema:'mid.ruc.r2.offline-consumer-parity.v1',
    run:index.run,sourceSha:index.stableSha,
    sampledNativeCells:cells,
    checkedNativeProductRecords:rows.reduce((s,r)=>s+r.records,0),
    simulatedR2RangeReads:rows.reduce((s,r)=>s+r.simulatedR2RangeReads,0),
    maxR2ReadsForOneCell:Math.max(...rows.map(r=>r.simulatedR2RangeReads)),
    sampledCompressedBytes:rows.reduce((s,r)=>s+r.compressedBytesFetched,0),
    nodeProcessCpuMicroseconds:cpu.user+cpu.system,
    allPointBytesMatchOriginal:true,
    productionApproved:false, r2ActivationAuthorized:false,
    limitations:'Node CPU is NOT Cloudflare Workers Free CPU; no live R2, cache, client, map, invoice or 0-USD hardcap proof'
  };
  await writeFile(dest,JSON.stringify(report,null,2)+'\n','utf8');
  process.stdout.write(JSON.stringify(report)+'\n');
}
main().catch(e=>{console.error('OFFLINE CONSUMER QA BLOCKED: '+e.message);process.exitCode=2;});
