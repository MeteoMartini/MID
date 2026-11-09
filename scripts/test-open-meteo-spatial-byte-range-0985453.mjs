import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/openMeteoSpatialByteRange.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const { planOmHeaderProbe, verifyOmHeaderResponse } =
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
