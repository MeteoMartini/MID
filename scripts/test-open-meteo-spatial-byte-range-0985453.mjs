import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const ts = createRequire(import.meta.url)('typescript-strada');

const source = readFileSync(new URL('../src/openMeteoSpatialByteRange.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const { planOmHeaderProbe, verifyOmHeaderResponse, planOmTrailerProbe, verifyOmTrailerResponse, planOmRootIndexProbe, inspectOmRootIndexResponse } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const valid = {
  status: 'manifest-only', model: 'dwd_icon_d2',
  referenceTime: '2026-11-09T06:00:00Z', validTime: '2026-11-09T07:00Z',
  variable: 'cape', accumulationHours: null,
};
const p = planOmHeaderProbe(valid);
assert.equal(p.ok, true);
assert.equal(p.probe.url,
  'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2/2026/11/09/0600Z/2026-11-09T0700.om');
assert.equal(p.probe.range, 'bytes=0-63');
assert.equal(planOmHeaderProbe({ status: 'unavailable', reason: 'no-field' }).reason, 'no-qualified-frame');
assert.equal(planOmHeaderProbe({ ...valid, model: 'dwd_icon_seamless' }).reason, 'unsupported-model');
assert.equal(planOmHeaderProbe({ ...valid, variable: '../cape' }).reason, 'invalid-field-name');
assert.equal(planOmHeaderProbe({ ...valid, variable: 'geopotential_height_500hPa' }).ok, true);
assert.equal(planOmHeaderProbe({ ...valid, variable: 'geopotential_height_500hPa' }).probe.url, p.probe.url);
assert.equal(planOmHeaderProbe({ ...valid, validTime: '2026-11-09T07:15Z' }).reason, 'invalid-run-or-valid-time');
assert.equal(planOmHeaderProbe({ ...valid, validTime: '2026-11-09T07:00+01:00' }).reason, 'invalid-run-or-valid-time');
assert.equal(planOmHeaderProbe({ ...valid, validTime: '2026-11-09T05:00Z' }).reason, 'invalid-run-or-valid-time');
assert.equal(planOmHeaderProbe({ ...valid, validTime: '2026-02-31T07:00Z' }).reason, 'invalid-run-or-valid-time');
assert.equal(planOmHeaderProbe({ ...valid, model: 'dwd_icon_eu', referenceTime: '2026-11-09T03:00Z', validTime: '2026-11-09T04:00Z' }).probe.url,
  'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_eu/2026/11/09/0300Z/2026-11-09T0400.om');

const good = new Uint8Array(64);
good.set([0x4f, 0x4d, 0x03, 0xc0]);
const response = (b = good, status = 206, headers = {}) => {
  const h = new Headers({ 'content-range': 'bytes 0-63/23575944', 'content-length': '64',
    'content-type': 'application/octet-stream', ...headers });
  return { status, headers: h, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
};
const result = await verifyOmHeaderResponse(response());
assert.deepEqual(result, { ok: true, status: 'header-verified', formatVersion: 3,
  sampleBytes: 64, totalBytes: 23575944, pixelValidated: false });
let readCalled = false;
const refuseBody = { status: 200, headers: new Headers(), arrayBuffer: async () => { readCalled = true; return new ArrayBuffer(0); } };
assert.equal((await verifyOmHeaderResponse(refuseBody)).reason, 'range-not-honored');
assert.equal(readCalled, false, 'Never read full file when server ignores Range');
for (const [probe, reason] of [
  [response(good, 206, { 'content-range': 'bytes 1-64/23575944' }), 'invalid-or-unexposed-content-range'],
  [response(good, 206, { 'content-range': 'bytes 0-63/*' }), 'invalid-or-unexposed-content-range'],
  [response(good, 206, { 'content-range': 'bytes 0-63/9999999999' }), 'unqualified-file-size'],
  [response(good, 206, { 'content-length': '999999' }), 'unbounded-or-incomplete-body'],
  [response(good, 206, { 'content-type': 'text/html' }), 'unexpected-content-type'],
  [response(good.slice(0, 32)), 'wrong-range-length'],
  [response(new Uint8Array(64)), 'unknown-om-magic-or-version'],
  [response(new Uint8Array([0x4f, 0x4d, 0x04, ...new Array(61).fill(0)])), 'unknown-om-magic-or-version'],
]) assert.equal((await verifyOmHeaderResponse(probe)).reason, reason);
assert.equal((await verifyOmHeaderResponse({ ...response(), arrayBuffer: async () => { throw new Error('network'); } })).reason, 'range-read-failed');
console.log('PASS spatial OM range: origin/path, 206, size bounds, magic, no full-body fallback and no pixel claim');

const trailerPlan = planOmTrailerProbe(valid);
assert.equal(trailerPlan.ok, true);
assert.equal(trailerPlan.probe.url, p.probe.url);
assert.equal(trailerPlan.probe.range, 'bytes=-24');
assert.equal(planOmTrailerProbe({ status: 'unavailable', reason: 'missing' }).ok, false);
assert.equal(planOmTrailerProbe({ ...valid, model: 'dwd_icon_seamless' }).ok, false);

// Actual 24-byte tail read from two ORIGINAL Open-Meteo S3 OMfiles 2026-11-09.
// These bytes only prove the metadata root pointer, not the decoded variable.
const rawHex = hex => Uint8Array.from(hex.match(/../g), v => parseInt(v, 16));
const d2Trailer = rawHex('4f4d03000000000048b76701000000002806000000000000');
const euTrailer = rawHex('4f4d030000000000d80af60100000000e807000000000000');
const trailerResponse = (b = d2Trailer, status = 206, headers = {}) => {
  const h = new Headers({
    'content-range': 'bytes 23575920-23575943/23575944',
    'content-length': '24',
    'content-type': 'application/octet-stream',
    ...headers,
  });
  return { status, headers: h,
    arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
};
assert.deepEqual(await verifyOmTrailerResponse(trailerResponse()), {
  ok: true, status: 'metadata-position-verified', totalBytes: 23575944,
  metadataOffset: 23574344, metadataLength: 1576, pixelValidated: false,
});
assert.deepEqual(await verifyOmTrailerResponse(trailerResponse(euTrailer, 206, {
  'content-range': 'bytes 32903872-32903895/32903896',
})), {
  ok: true, status: 'metadata-position-verified', totalBytes: 32903896,
  metadataOffset: 32901848, metadataLength: 2024, pixelValidated: false,
});
let trailerBodyCalled = false;
assert.equal((await verifyOmTrailerResponse({
  status: 200, headers: new Headers(), arrayBuffer: async () => {
    trailerBodyCalled = true; throw Error('full body prohibited');
  },
})).reason, 'range-not-honored');
assert.equal(trailerBodyCalled, false);
for (const [r, reason] of [
  [trailerResponse(d2Trailer, 206, { 'content-range': 'bytes 0-23/23575944' }), 'unqualified-trailer-range'],
  [trailerResponse(d2Trailer, 206, { 'content-range': 'bytes 23575920-23575943/*' }), 'invalid-or-unexposed-content-range'],
  [trailerResponse(d2Trailer, 206, { 'content-range': 'bytes 23575920-23575943/9999999999999999' }), 'unqualified-trailer-range'],
  [trailerResponse(d2Trailer, 206, { 'content-length': '23575944' }), 'unbounded-or-incomplete-body'],
  [trailerResponse(d2Trailer, 206, { 'content-type': 'text/html' }), 'unexpected-content-type'],
  [trailerResponse(d2Trailer.slice(0, 20)), 'wrong-range-length'],
  [trailerResponse(new Uint8Array(24)), 'unknown-om-trailer-or-version'],
  [trailerResponse(rawHex('4f4d04000000000048b76701000000002806000000000000')), 'unknown-om-trailer-or-version'],
  [trailerResponse(rawHex('4f4d03010000000048b76701000000002806000000000000')), 'unknown-om-trailer-or-version'],
  [trailerResponse(rawHex('4f4d03000000000048b76701000000002906000000000000')), 'invalid-root-metadata-bounds'],
  [trailerResponse(rawHex('4f4d03000000000048b76701000000000000000000000000')), 'invalid-root-metadata-bounds'],
]) assert.equal((await verifyOmTrailerResponse(r)).reason, reason);
assert.equal((await verifyOmTrailerResponse({
  ...trailerResponse(), arrayBuffer: async () => { throw Error('network'); },
})).reason, 'range-read-failed');
console.log('PASS spatial OM trailer: original D2/EU root pointers, exact 24-byte range and hostile-response rejection');

// Root-index QA: the provider's original root prefix contains 98 (D2) or
// 126 (EU) child pointers and its verified 1576/2024-byte trailer-described
// region matches exactly 8+16*N. We have NOT decoded full real root indices:
// payloads below are explicitly SYNTHETIC pointers for validator regression.
const d2RootEvidence = await verifyOmTrailerResponse(trailerResponse());
const d2IndexPlan = planOmRootIndexProbe(valid, d2RootEvidence);
assert.equal(d2IndexPlan.ok, true);
assert.equal(d2IndexPlan.probe.range, 'bytes=23574344-23575919');
assert.equal(d2IndexPlan.probe.url, p.probe.url);
assert.equal(planOmRootIndexProbe({ status: 'unavailable', reason: 'missing' }, d2RootEvidence).ok, false);
assert.equal(planOmRootIndexProbe(valid, { ok: false, reason: 'bad' }).reason, 'unverified-root-metadata-pointer');
assert.equal(planOmRootIndexProbe(valid, { ...d2RootEvidence, metadataOffset: 5 }).reason, 'unverified-root-metadata-pointer');

const syntheticRoot = (count, offsets, lengths) => {
  const b = new Uint8Array(8 + 16 * count);
  const view = new DataView(b.buffer);
  view.setUint8(0, 0); // root container, not a grid array
  view.setUint8(1, 4);
  view.setUint32(4, count, true);
  for (let i = 0; i < count; i++) {
    view.setBigUint64(8 + i * 8, BigInt(lengths[i] ?? 104), true);
    view.setBigUint64(8 + count * 8 + i * 8, BigInt(offsets[i] ?? 100 + i * 150), true);
  }
  return b;
};
const knownD2Prefix = rawHex('000400006200000068000000000000006700000000000000');
const d2Synthetic = syntheticRoot(98, [], [104, 103, 103, 99, 108, 109, 108]);
assert.deepEqual([...d2Synthetic.slice(0, knownD2Prefix.length)], [...knownD2Prefix],
  'Only the already observed original prefix is byte-derived; subsequent synthetic pointers do NOT prove real-field data');
const d2RootResponse = (b = d2Synthetic, status = 206, headers = {}) => ({
  status,
  headers: new Headers({
    'content-range': 'bytes 23574344-23575919/23575944',
    'content-length': '1576',
    'content-type': 'application/octet-stream',
    ...headers,
  }),
  arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
});
const d2Root = await inspectOmRootIndexResponse(d2RootResponse(), d2IndexPlan.probe);
assert.equal(d2Root.ok, true);
assert.equal(d2Root.status, 'root-index-verified');
assert.equal(d2Root.childCount, 98);
assert.equal(d2Root.children.length, 98);
assert.deepEqual(d2Root.children[0], { offset: 100, length: 104 });
assert.equal(d2Root.pixelValidated, false);
const euCandidate = { ...valid, model: 'dwd_icon_eu',
  referenceTime: '2026-11-09T03:00Z', validTime: '2026-11-09T04:00Z' };
const euTrailerResult = await verifyOmTrailerResponse(trailerResponse(euTrailer, 206, {
  'content-range': 'bytes 32903872-32903895/32903896',
}));
const euIndexPlan = planOmRootIndexProbe(euCandidate, euTrailerResult);
assert.equal(euIndexPlan.ok, true);
assert.equal(euIndexPlan.probe.range, 'bytes=32901848-32903871');
const euSynthetic = syntheticRoot(126, [], [108, 99, 104, 109, 103, 103, 108]);
assert.deepEqual([...euSynthetic.slice(0, 8)], [...rawHex('000400007e000000')]);
assert.equal((await inspectOmRootIndexResponse({
  ...d2RootResponse(euSynthetic), headers: new Headers({
    'content-range': 'bytes 32901848-32903871/32903896',
    'content-length': '2024', 'content-type': 'application/octet-stream',
  }),
}, euIndexPlan.probe)).childCount, 126);

let rootBodyCalled = false;
assert.equal((await inspectOmRootIndexResponse({
  status: 200, headers: new Headers(),
  arrayBuffer: async () => { rootBodyCalled = true; throw Error('full-body read prohibited'); },
}, d2IndexPlan.probe)).reason, 'range-not-honored');
assert.equal(rootBodyCalled, false);
const corruptRoot = mutator => { const b = new Uint8Array(d2Synthetic); mutator(b, new DataView(b.buffer)); return b; };
for (const [r, reason] of [
  [d2RootResponse(d2Synthetic, 206, { 'content-range': 'bytes 0-1575/23575944' }), 'invalid-or-unexposed-content-range'],
  [d2RootResponse(d2Synthetic, 206, { 'content-length': '23575944' }), 'unbounded-or-incomplete-body'],
  [d2RootResponse(d2Synthetic, 206, { 'content-type': 'text/html' }), 'unexpected-content-type'],
  [d2RootResponse(d2Synthetic.slice(0, 60)), 'wrong-range-length'],
  [d2RootResponse(corruptRoot(b => { b[0] = 15; })), 'unsupported-root-node-type'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setUint32(4, 0, true); })), 'invalid-root-index-layout'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setUint32(4, 50000, true); })), 'invalid-root-index-layout'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setUint16(2, 1, true); })), 'invalid-root-index-layout'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setBigUint64(8 + 98 * 8, 23574340n, true); })), 'invalid-child-metadata-bounds'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setBigUint64(8, 7n, true); })), 'invalid-child-metadata-bounds'],
  [d2RootResponse(corruptRoot((_b, v) => { v.setBigUint64(8 + 98 * 8 + 8, 150n, true); })), 'overlapping-child-metadata'],
]) assert.equal((await inspectOmRootIndexResponse(r, d2IndexPlan.probe)).reason, reason);
assert.equal((await inspectOmRootIndexResponse({
  ...d2RootResponse(), arrayBuffer: async () => { throw Error('read failed'); },
}, d2IndexPlan.probe)).reason, 'range-read-failed');
console.log('PASS synthetic OM root index layout/child span protections; D2/EU real prefixes verified, pixel claims prohibited');
