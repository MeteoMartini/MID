/**
 * MID-Karten 1.0: bounded, READ-ONLY OMfile byte-range evidence.
 * A valid OM header is not a decoded field, forecast or render authorization.
 */
import type { FrameResult, SpatialModelId } from './openMeteoSpatialManifest';

export interface OmHeaderProbe {
  readonly status: 'planned-header-only';
  readonly model: SpatialModelId;
  readonly referenceTime: string;
  readonly validTime: string;
  readonly variable: string;
  readonly url: string;
  readonly range: 'bytes=0-63';
}

export type OmProbePlan =
  | { readonly ok: true; readonly probe: OmHeaderProbe }
  | { readonly ok: false; readonly reason: string };

export type OmHeaderResult =
  | {
      readonly ok: true;
      readonly status: 'header-verified';
      readonly formatVersion: 3;
      readonly sampleBytes: 64;
      readonly totalBytes: number;
      readonly pixelValidated: false;
    }
  | { readonly ok: false; readonly reason: string };

const SPATIAL_S3_ORIGIN = 'https://openmeteo.s3.amazonaws.com/data_spatial';
const HEADER_LENGTH = 64;
const MAX_OMFILE_BYTES = 256 * 1024 * 1024; // bounded pilot; larger files need explicit review

const hourDate = (raw: unknown): Date | null => {
  if (typeof raw !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:00(?::00)?Z$/.test(raw)) return null;
  const epoch = Date.parse(raw);
  if (!Number.isFinite(epoch) || epoch % 3_600_000 !== 0) return null;
  const date = new Date(epoch);
  return raw === `${date.toISOString().slice(0, 16)}Z` ||
         raw === `${date.toISOString().slice(0, 19)}Z` ? date : null;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Requires a qualified candidate; no arbitrary origin, user URL or model blending. */
export function planOmHeaderProbe(candidate: FrameResult): OmProbePlan {
  if (candidate?.status !== 'manifest-only') return { ok: false, reason: 'no-qualified-frame' };
  if (candidate.model !== 'dwd_icon_d2' && candidate.model !== 'dwd_icon_eu') {
    return { ok: false, reason: 'unsupported-model' };
  }
  if (!/^[a-z][a-z0-9_]*$/.test(candidate.variable)) {
    return { ok: false, reason: 'invalid-field-name' };
  }
  const run = hourDate(candidate.referenceTime);
  const valid = hourDate(candidate.validTime);
  if (!run || !valid || valid.getTime() < run.getTime()) {
    return { ok: false, reason: 'invalid-run-or-valid-time' };
  }
  const runPath = `${run.getUTCFullYear()}/${pad(run.getUTCMonth() + 1)}/${pad(run.getUTCDate())}/${pad(run.getUTCHours())}00Z`;
  const validName = `${valid.getUTCFullYear()}-${pad(valid.getUTCMonth() + 1)}-${pad(valid.getUTCDate())}T${pad(valid.getUTCHours())}00.om`;
  return {
    ok: true,
    probe: {
      status: 'planned-header-only', model: candidate.model,
      referenceTime: candidate.referenceTime, validTime: candidate.validTime,
      variable: candidate.variable,
      url: `${SPATIAL_S3_ORIGIN}/${candidate.model}/${runPath}/${validName}`,
      range: 'bytes=0-63',
    },
  };
}

/**
 * Validate a supplied HTTP 206 response before even reading its body.
 * Range refusal, oversized responses, wrong OM magic/version and missing
 * exposed Content-Range are all rejected. This does NOT parse OM fields.
 */
export async function verifyOmHeaderResponse(
  response: Pick<Response, 'status' | 'headers' | 'arrayBuffer'>,
): Promise<OmHeaderResult> {
  if (response.status !== 206) return { ok: false, reason: 'range-not-honored' };
  const contentRange = response.headers.get('content-range');
  const match = /^bytes 0-63\/([1-9]\d*)$/.exec(contentRange ?? '');
  if (!match) return { ok: false, reason: 'invalid-or-unexposed-content-range' };
  const totalBytes = Number(match[1]);
  if (!Number.isSafeInteger(totalBytes) || totalBytes <= HEADER_LENGTH ||
      totalBytes > MAX_OMFILE_BYTES) return { ok: false, reason: 'unqualified-file-size' };
  if (response.headers.get('content-length') !== String(HEADER_LENGTH)) {
    return { ok: false, reason: 'unbounded-or-incomplete-body' };
  }
  if (response.headers.get('content-type')?.toLowerCase().split(';')[0].trim() !== 'application/octet-stream') {
    return { ok: false, reason: 'unexpected-content-type' };
  }
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await response.arrayBuffer()); }
  catch { return { ok: false, reason: 'range-read-failed' }; }
  if (bytes.byteLength !== HEADER_LENGTH) return { ok: false, reason: 'wrong-range-length' };
  if (bytes[0] !== 0x4f || bytes[1] !== 0x4d || bytes[2] !== 0x03) {
    return { ok: false, reason: 'unknown-om-magic-or-version' };
  }
  return { ok: true, status: 'header-verified', formatVersion: 3,
    sampleBytes: HEADER_LENGTH, totalBytes, pixelValidated: false };
}
