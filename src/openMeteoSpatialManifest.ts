/**
 * MID-Karten 1.0 / Open-Meteo data_spatial read-only qualification.
 *
 * This module inspects Capture API metadata ONLY. A listed variable does not
 * prove that an OMfile has been fetched, decoded, licensed or pixel-validated.
 * No requests, worker state, global cache or UI mutations occur here.
 */
export type SpatialModelId = 'dwd_icon_d2' | 'dwd_icon_eu';
export type SpatialCompositeId = 'winter-berge' | 'sommer-gewitter';

export const SPATIAL_MODEL_IDS: readonly SpatialModelId[] = ['dwd_icon_d2', 'dwd_icon_eu'];

// Deliberately not Open-Meteo's derived `snowfall`: its fixed density ratio
// would otherwise silently present SWE as measured new-snow height.
export const SPATIAL_COMPOSITE_FIELDS: Readonly<Record<SpatialCompositeId, readonly string[]>> = {
  'winter-berge': [
    'precipitation', 'rain', 'showers', 'snowfall_height', 'freezing_level_height',
    'snow_depth', 'snowfall_water_equivalent', 'weather_code', 'cloud_cover',
    'pressure_msl', 'geopotential_height_500hPa',
  ],
  'sommer-gewitter': [
    'cape', 'convective_inhibition', 'showers', 'cloud_cover',
    'pressure_msl', 'wind_u_component_10m', 'wind_v_component_10m',
  ],
};

// Open-Meteo data_spatial stores backward-accumulated per-step sums for this
// family. Their initial run step is not a valid 0 mm or 0 mm/h observation.
const BACKWARD_ACCUMULATED = new Set([
  'precipitation', 'rain', 'showers', 'snowfall_water_equivalent', 'snowfall',
]);

export interface QualifiedSpatialManifest {
  readonly model: SpatialModelId;
  readonly referenceTime: string;
  readonly lastModifiedTime: string;
  readonly validTimes: readonly string[];
  readonly variables: readonly string[];
  readonly status: 'manifest-only';
}

export type ManifestResult =
  | { readonly ok: true; readonly manifest: QualifiedSpatialManifest }
  | { readonly ok: false; readonly reason: string };

export type FrameResult =
  | {
      readonly status: 'manifest-only';
      readonly model: SpatialModelId;
      readonly referenceTime: string;
      readonly validTime: string;
      readonly variable: string;
      readonly accumulationHours: number | null;
    }
  | { readonly status: 'unavailable'; readonly reason: string };

const objectRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Require explicit UTC and reject dates that JavaScript silently normalizes.
const utcMilliseconds = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?Z$/.test(value)) return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  const canonical = new Date(milliseconds).toISOString();
  const expected = value.length === 17 ? `${canonical.slice(0, 16)}Z` : `${canonical.slice(0, 19)}Z`;
  return value === expected ? milliseconds : null;
};

export function qualifySpatialManifest(
  source: unknown,
  model: string,
  nowUtcMilliseconds?: number,
): ManifestResult {
  if (!SPATIAL_MODEL_IDS.some(id => id === model)) return { ok: false, reason: 'unsupported-model' };
  if (!objectRecord(source) || source.completed !== true) return { ok: false, reason: 'incomplete-manifest' };
  const run = utcMilliseconds(source.reference_time);
  const modified = utcMilliseconds(source.last_modified_time);
  if (run === null || modified === null || modified < run) return { ok: false, reason: 'invalid-run-or-publication-time' };
  if (nowUtcMilliseconds !== undefined) {
    if (!Number.isFinite(nowUtcMilliseconds) || modified > nowUtcMilliseconds + 600_000 ||
        nowUtcMilliseconds - modified > 86_400_000) {
      return { ok: false, reason: 'stale-or-future-manifest' };
    }
  }
  if (!Array.isArray(source.valid_times) || !source.valid_times.length) return { ok: false, reason: 'missing-valid-times' };
  let previous = -Infinity;
  for (const entry of source.valid_times) {
    const time = utcMilliseconds(entry);
    if (time === null || time < run || time <= previous) return { ok: false, reason: 'invalid-valid-time-sequence' };
    previous = time;
  }
  if (!Array.isArray(source.variables) || !source.variables.length ||
      source.variables.some(v => typeof v !== 'string' || !/^[a-z][a-zA-Z0-9_]*$/.test(v)) ||
      new Set(source.variables).size !== source.variables.length) {
    return { ok: false, reason: 'invalid-variable-catalog' };
  }
  const manifest: QualifiedSpatialManifest = {
    model: model as SpatialModelId,
    referenceTime: source.reference_time as string,
    lastModifiedTime: source.last_modified_time as string,
    validTimes: [...source.valid_times] as string[],
    variables: [...source.variables] as string[],
    status: 'manifest-only',
  };
  return { ok: true, manifest };
}

/** Declared availability only: never label these variables as decoded raster. */
export function spatialCompositeCoverage(
  manifest: QualifiedSpatialManifest,
  composite: SpatialCompositeId,
): { readonly declared: readonly string[]; readonly absent: readonly string[]; readonly pixelValidated: false } {
  const stored = new Set(manifest.variables);
  const required = SPATIAL_COMPOSITE_FIELDS[composite];
  return {
    declared: required.filter(variable => stored.has(variable)),
    absent: required.filter(variable => !stored.has(variable)),
    pixelValidated: false,
  };
}

/**
 * Returns a candidate for an ORIGINAL byte/pixel QA, not a renderable frame.
 * No nearest-time interpolation; the initial accumulation is unavailable.
 */
export function spatialFrameCandidate(
  manifest: QualifiedSpatialManifest,
  variable: string,
  validTime: string,
): FrameResult {
  if (!manifest.variables.includes(variable)) return { status: 'unavailable', reason: 'field-not-declared' };
  if (utcMilliseconds(validTime) === null) return { status: 'unavailable', reason: 'invalid-utc-valid-time' };
  const index = manifest.validTimes.indexOf(validTime);
  if (index < 0) return { status: 'unavailable', reason: 'valid-time-not-in-model-run' };
  const accumulated = BACKWARD_ACCUMULATED.has(variable);
  if (accumulated && index === 0) return { status: 'unavailable', reason: 'initial-accumulation-unavailable' };
  const accumulationHours = accumulated
    ? (Date.parse(validTime) - Date.parse(manifest.validTimes[index - 1])) / 3_600_000
    : null;
  if (accumulated && (!Number.isFinite(accumulationHours) || (accumulationHours ?? 0) <= 0)) {
    return { status: 'unavailable', reason: 'invalid-accumulation-window' };
  }
  return {
    status: 'manifest-only', model: manifest.model,
    referenceTime: manifest.referenceTime, validTime, variable, accumulationHours,
  };
}
