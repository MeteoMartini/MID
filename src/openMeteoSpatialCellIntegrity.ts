/**
 * MID-Karten 1.0: read-only scientific integrity checks for a DECODED sample.
 * No OM reader/renderer, grid fallback or product admission is implemented.
 * A sample passing these rules is NOT a licensed, published raster.
 */
import type { FrameResult, SpatialModelId } from './openMeteoSpatialManifest';
import { planOmHeaderProbe } from './openMeteoSpatialByteRange';

export type SpatialCellValue = number | null;
export interface SpatialCellEvidence {
  readonly model: SpatialModelId;
  readonly run: string;
  readonly valid: string;
  readonly file: string;
  readonly grid: { readonly rows: number; readonly cols: number; readonly row: number; readonly col: number };
  readonly values: Readonly<Record<string, SpatialCellValue>>;
}
export type SpatialPrecipitationState =
  | 'initial-accumulation-unavailable'
  | 'not-sampled'
  | 'masked'
  | 'valid-zero'
  | 'positive-component-match-only'
  | 'positive-unresolved-phase'
  | 'positive-overlapping-components'
  | 'contradictory-components';
export type SpatialSnowlineState =
  | 'not-sampled' | 'masked' | 'raw-below-sea-level' | 'raw-unverified';
export type SpatialCellIntegrityResult =
  | { readonly ok: false; readonly reason: string }
  | {
      readonly ok: true;
      readonly status: 'research-only';
      readonly model: SpatialModelId;
      readonly referenceTime: string;
      readonly validTime: string;
      readonly precipitation: SpatialPrecipitationState;
      readonly precipitationRaw: number | null;
      readonly snowfallHeight: SpatialSnowlineState;
      readonly snowfallHeightRaw: number | null;
      readonly zeroFields: readonly string[];
      readonly maskedFields: readonly string[];
      readonly publicationApproved: false;
    };

const own = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
const REVERSE_ACCUMULATIONS = ['precipitation', 'rain', 'showers', 'snowfall_water_equivalent'] as const;
const hasExpectedUtc = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  (value === new Date(Date.parse(value)).toISOString().slice(0, 16) + 'Z' ||
   value === new Date(Date.parse(value)).toISOString().slice(0, 19) + 'Z');

/**
 * Checks only an independently supplied historical/scientific sample.
 * Does not claim the supplied bytes were authenticated. Future production
 * adapters must separately SHA-attest all raster bytes, grid, units, licence
 * and native-DWD source/derivation before using the values.
 */
export function assessSpatialCellIntegrity(
  frame: FrameResult,
  sample: unknown,
): SpatialCellIntegrityResult {
  if (frame.status !== 'manifest-only') return { ok: false, reason: 'frame-unqualified' };
  const planned = planOmHeaderProbe(frame);
  if (!planned.ok) return { ok: false, reason: 'frame-unqualified' };
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
    return { ok: false, reason: 'invalid-cell-evidence' };
  }
  const s = sample as Partial<SpatialCellEvidence>;
  if (!hasExpectedUtc(s.run) || !hasExpectedUtc(s.valid) ||
      s.model !== frame.model ||
      Date.parse(s.run) !== Date.parse(frame.referenceTime) ||
      Date.parse(s.valid) !== Date.parse(frame.validTime) ||
      typeof s.file !== 'string' ||
      planned.probe.url !== 'https://openmeteo.s3.amazonaws.com/data_spatial/' + s.file) {
    return { ok: false, reason: 'model-run-valid-file-mismatch' };
  }
  const g = s.grid;
  if (!g || ![g.rows, g.cols, g.row, g.col].every(Number.isSafeInteger) ||
      g.rows < 2 || g.cols < 2 || g.rows > 10000 || g.cols > 10000 ||
      g.row < 0 || g.col < 0 || g.row >= g.rows || g.col >= g.cols) {
    return { ok: false, reason: 'invalid-grid-cell-index' };
  }
  const values = s.values;
  if (!values || typeof values !== 'object' || Array.isArray(values) ||
      Object.keys(values).length > 64 ||
      Object.entries(values).some(([name, value]) =>
        !/^[a-z][a-zA-Z0-9_]*$/.test(name) ||
        (value !== null && (typeof value !== 'number' || !Number.isFinite(value))))) {
    return { ok: false, reason: 'invalid-or-nonfinite-field-values' };
  }
  const firstStep = Date.parse(s.run) === Date.parse(s.valid);
  if (firstStep && REVERSE_ACCUMULATIONS.some(name => own(values, name))) {
    return { ok: false, reason: 'fabricated-first-step-accumulation' };
  }
  if (REVERSE_ACCUMULATIONS.some(name => own(values, name) &&
      values[name] !== null && Number(values[name]) < 0)) {
    return { ok: false, reason: 'negative-accumulated-amount' };
  }
  const zeroFields = Object.keys(values).filter(name => values[name] === 0);
  const maskedFields = Object.keys(values).filter(name => values[name] === null);
  const snowline = own(values, 'snowfall_height') ? values.snowfall_height! : null;
  const snowfallHeight: SpatialSnowlineState = !own(values, 'snowfall_height')
    ? 'not-sampled' : snowline === null ? 'masked'
    : snowline < 0 ? 'raw-below-sea-level' : 'raw-unverified';
  let precipitation: SpatialPrecipitationState;
  let precipitationRaw: number | null = null;
  if (firstStep) {
    precipitation = 'initial-accumulation-unavailable';
  } else if (!own(values, 'precipitation')) {
    precipitation = 'not-sampled';
  } else {
    const total = values.precipitation!;
    precipitationRaw = total;
    if (total === null) {
      precipitation = 'masked';
    } else {
      const components = REVERSE_ACCUMULATIONS.slice(1).map(name => values[name]);
      const componentsComplete = REVERSE_ACCUMULATIONS.slice(1).every(name => own(values, name) && values[name] !== null);
      const componentSum = componentsComplete
        ? (components as number[]).reduce((sum, part) => sum + part, 0) : null;
      // A dry total is only trustworthy if no nonzero rain/shower/SWE value
      // contradicts it. These components may NOT partition all precipitation.
      if (total === 0 && components.some(part => part !== null && part !== undefined && part > 0)) {
        precipitation = 'contradictory-components';
      } else if (total === 0) {
        precipitation = 'valid-zero';
      } else if (!componentsComplete || componentSum === null || componentSum + 0.05 < total) {
        precipitation = 'positive-unresolved-phase';
      } else if (componentSum > total + 0.05) {
        precipitation = 'positive-overlapping-components';
      } else {
        precipitation = 'positive-component-match-only';
      }
    }
  }
  return {
    ok: true, status: 'research-only', model: s.model!,
    referenceTime: s.run, validTime: s.valid,
    precipitation, precipitationRaw, snowfallHeight,
    snowfallHeightRaw: snowline,
    zeroFields, maskedFields, publicationApproved: false,
  };
}
