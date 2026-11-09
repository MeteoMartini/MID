import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Uses MID's existing TypeScript dev dependency; no new package/network needed.
const source = readFileSync(new URL('../src/openMeteoSpatialManifest.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const { qualifySpatialManifest, spatialCompositeCoverage, spatialFrameCandidate } = mod;
const run = '2026-11-09T06:00:00Z', modified = '2026-11-09T07:22:54Z';
const t0 = '2026-11-09T06:00Z', t1 = '2026-11-09T07:00Z', t2 = '2026-11-09T09:00Z';
const sample = {
  completed: true, reference_time: run, last_modified_time: modified,
  valid_times: [t0, t1, t2],
  variables: ['precipitation', 'snowfall_height', 'freezing_level_height', 'cape', 'convective_inhibition'],
};
const qualified = qualifySpatialManifest(sample, 'dwd_icon_d2', Date.parse('2026-11-09T08:00Z'));
assert.equal(qualified.ok, true);
const m = qualified.manifest;
assert.equal(m.status, 'manifest-only');
assert.deepEqual(spatialCompositeCoverage(m, 'winter-berge').declared,
  ['precipitation', 'snowfall_height', 'freezing_level_height']);
assert.equal(spatialCompositeCoverage(m, 'winter-berge').pixelValidated, false);
assert.ok(spatialCompositeCoverage(m, 'sommer-gewitter').absent.includes('showers'));
assert.equal(spatialFrameCandidate(m, 'precipitation', t0).status, 'unavailable');
assert.equal(spatialFrameCandidate(m, 'precipitation', t0).reason, 'initial-accumulation-unavailable');
assert.equal(spatialFrameCandidate(m, 'precipitation', t1).accumulationHours, 1);
assert.equal(spatialFrameCandidate(m, 'precipitation', t2).accumulationHours, 2);
assert.equal(spatialFrameCandidate(m, 'cape', t0).status, 'manifest-only');
assert.equal(spatialFrameCandidate(m, 'cape', '2026-11-09T06:15Z').status, 'unavailable');
assert.equal(spatialFrameCandidate(m, 'snowfall', t1).reason, 'field-not-declared');
assert.equal(spatialFrameCandidate(m, 'cape', '2026-11-09T06:00+01:00').reason, 'invalid-utc-valid-time');
for (const [changed, reason] of [
  [{ completed: false }, 'incomplete-manifest'],
  [{ valid_times: [t0, t0] }, 'invalid-valid-time-sequence'],
  [{ valid_times: [t1, t0] }, 'invalid-valid-time-sequence'],
  [{ valid_times: ['2026-02-31T06:00Z'] }, 'invalid-valid-time-sequence'],
  [{ valid_times: [] }, 'missing-valid-times'],
  [{ reference_time: '2026-11-09T06:00+01:00' }, 'invalid-run-or-publication-time'],
  [{ last_modified_time: '2026-11-09T04:00Z' }, 'invalid-run-or-publication-time'],
  [{ variables: ['cape', 'cape'] }, 'invalid-variable-catalog'],
  [{ variables: ['cape', 'bad field'] }, 'invalid-variable-catalog'],
]) {
  assert.equal(qualifySpatialManifest({ ...sample, ...changed }, 'dwd_icon_d2').reason, reason);
}
assert.equal(qualifySpatialManifest(sample, 'unknown-model').reason, 'unsupported-model');
assert.equal(qualifySpatialManifest(sample, 'dwd_icon_d2', Date.parse('2026-11-11T08:00Z')).reason,
  'stale-or-future-manifest');
assert.equal(qualifySpatialManifest(sample, 'dwd_icon_d2', Date.parse('2026-11-09T04:00Z')).reason,
  'stale-or-future-manifest');
assert.equal(qualifySpatialManifest(sample, 'dwd_icon_eu').ok, true);
console.log('PASS MID spatial manifest: strict UTC, coverage, cadence, accumulation, stale and noData gates');
