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

/** The trailing 24 bytes are separate from the OMfile header. */
export interface OmTrailerProbe {
  readonly status: 'planned-trailer-only';
  readonly model: SpatialModelId;
  readonly url: string;
  readonly range: 'bytes=-24';
}

export type OmTrailerPlan =
  | { readonly ok: true; readonly probe: OmTrailerProbe }
  | { readonly ok: false; readonly reason: string };

export type OmTrailerResult =
  | {
      readonly ok: true;
      readonly status: 'metadata-position-verified';
      readonly totalBytes: number;
      readonly metadataOffset: number;
      readonly metadataLength: number;
      readonly pixelValidated: false;
    }
  | { readonly ok: false; readonly reason: string };

const TRAILER_BYTES = 24;
const MAX_ROOT_METADATA_BYTES = 4 * 1024 * 1024;

/** Same already-qualified origin/model/run/time; do not construct user-supplied URLs. */
export function planOmTrailerProbe(candidate: FrameResult): OmTrailerPlan {
  const planned = planOmHeaderProbe(candidate);
  if (!planned.ok) return planned;
  return { ok: true, probe: {
    status: 'planned-trailer-only',
    model: planned.probe.model,
    url: planned.probe.url,
    range: 'bytes=-24',
  } };
}

/**
 * Check the trailing OM-v3 metadata pointer without decoding any weather field.
 * The first little-endian uint64 is the root metadata OFFSET and the second
 * uint64 its LENGTH (verified against original D2 and EU byte-range captures).
 * The root must end exactly where the 24-byte trailer starts.
 *
 * Never read the response body if Range, length, content-type or file bounds
 * fail: some HTTP endpoints reply with a full 20+ MB body to Range requests.
 */
export async function verifyOmTrailerResponse(
  response: Pick<Response, 'status' | 'headers' | 'arrayBuffer'>,
): Promise<OmTrailerResult> {
  if (response.status !== 206) return { ok: false, reason: 'range-not-honored' };
  const match = /^bytes (\d+)-(\d+)\/([1-9]\d*)$/.exec(response.headers.get('content-range') ?? '');
  if (!match) return { ok: false, reason: 'invalid-or-unexposed-content-range' };
  const [start, end, total] = match.slice(1).map(Number);
  if (![start, end, total].every(Number.isSafeInteger) ||
      total <= TRAILER_BYTES || total > MAX_OMFILE_BYTES ||
      start !== total - TRAILER_BYTES || end !== total - 1) {
    return { ok: false, reason: 'unqualified-trailer-range' };
  }
  if (response.headers.get('content-length') !== String(TRAILER_BYTES)) {
    return { ok: false, reason: 'unbounded-or-incomplete-body' };
  }
  if (response.headers.get('content-type')?.toLowerCase().split(';')[0].trim() !== 'application/octet-stream') {
    return { ok: false, reason: 'unexpected-content-type' };
  }
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await response.arrayBuffer()); }
  catch { return { ok: false, reason: 'range-read-failed' }; }
  if (bytes.byteLength !== TRAILER_BYTES) return { ok: false, reason: 'wrong-range-length' };
  if (bytes[0] !== 0x4f || bytes[1] !== 0x4d || bytes[2] !== 0x03 ||
      bytes.slice(3, 8).some(value => value !== 0)) {
    return { ok: false, reason: 'unknown-om-trailer-or-version' };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rootOffset = view.getBigUint64(8, true);
  const rootLength = view.getBigUint64(16, true);
  const trailerStart = BigInt(total - TRAILER_BYTES);
  if (rootOffset < 3n || rootLength < 8n ||
      rootLength > BigInt(MAX_ROOT_METADATA_BYTES) ||
      rootOffset + rootLength !== trailerStart) {
    return { ok: false, reason: 'invalid-root-metadata-bounds' };
  }
  return { ok: true, status: 'metadata-position-verified', totalBytes: total,
    metadataOffset: Number(rootOffset), metadataLength: Number(rootLength),
    pixelValidated: false };
}

/**
 * The root node is an index of child-variable metadata positions. Inspect
 * structure only: an indexed child is NOT evidence of a usable weather field.
 * No GPL reader, compression algorithm, grid decoding or network call.
 */
export interface OmRootIndexProbe {
  readonly status: 'planned-root-index-only';
  readonly url: string;
  readonly range: string;
  readonly metadataOffset: number;
  readonly metadataLength: number;
  readonly totalBytes: number;
}

export type OmRootIndexPlan =
  | { readonly ok: true; readonly probe: OmRootIndexProbe }
  | { readonly ok: false; readonly reason: string };

export interface OmChildMetadataSpan {
  readonly offset: number;
  readonly length: number;
}

export type OmRootIndexResult =
  | {
      readonly ok: true;
      readonly status: 'root-index-verified';
      readonly childCount: number;
      readonly children: readonly OmChildMetadataSpan[];
      readonly pixelValidated: false;
    }
  | { readonly ok: false; readonly reason: string };

const MAX_ROOT_CHILDREN = 4096;

/**
 * Only consume a successfully verified root pointer and an independently
 * qualified model/run/valid-time. The source URL is never user supplied.
 */
export function planOmRootIndexProbe(
  candidate: FrameResult,
  trailer: OmTrailerResult,
): OmRootIndexPlan {
  const frame = planOmTrailerProbe(candidate);
  if (!frame.ok) return frame;
  if (!trailer.ok || trailer.status !== 'metadata-position-verified' ||
      !Number.isSafeInteger(trailer.metadataOffset) ||
      !Number.isSafeInteger(trailer.metadataLength) ||
      !Number.isSafeInteger(trailer.totalBytes) ||
      trailer.metadataOffset < 3 ||
      trailer.metadataLength < 8 ||
      trailer.metadataLength > MAX_ROOT_METADATA_BYTES ||
      trailer.totalBytes > MAX_OMFILE_BYTES ||
      trailer.metadataOffset + trailer.metadataLength !== trailer.totalBytes - TRAILER_BYTES) {
    return { ok: false, reason: 'unverified-root-metadata-pointer' };
  }
  return { ok: true, probe: {
    status: 'planned-root-index-only', url: frame.probe.url,
    range: `bytes=${trailer.metadataOffset}-${trailer.metadataOffset + trailer.metadataLength - 1}`,
    metadataOffset: trailer.metadataOffset, metadataLength: trailer.metadataLength,
    totalBytes: trailer.totalBytes,
  } };
}

/**
 * Inspect the simple OM-v3 root-container layout documented by Open-Meteo:
 * 8-byte node preamble, then N little-endian u64 child lengths and N u64
 * child offsets. Root children are metadata references, not decoded values.
 * We deliberately reject array-valued roots (different layout).
 */
export async function inspectOmRootIndexResponse(
  response: Pick<Response, 'status' | 'headers' | 'arrayBuffer'>,
  probe: OmRootIndexProbe,
): Promise<OmRootIndexResult> {
  if (probe.status !== 'planned-root-index-only' ||
      !Number.isSafeInteger(probe.metadataOffset) ||
      !Number.isSafeInteger(probe.metadataLength) ||
      !Number.isSafeInteger(probe.totalBytes) ||
      probe.metadataOffset < 3 || probe.metadataLength < 8 ||
      probe.metadataLength > MAX_ROOT_METADATA_BYTES ||
      probe.metadataOffset + probe.metadataLength !== probe.totalBytes - TRAILER_BYTES ||
      probe.totalBytes > MAX_OMFILE_BYTES) {
    return { ok: false, reason: 'invalid-root-index-plan' };
  }
  if (response.status !== 206) return { ok: false, reason: 'range-not-honored' };
  const expectedRange = `bytes ${probe.metadataOffset}-${probe.metadataOffset + probe.metadataLength - 1}/${probe.totalBytes}`;
  if (response.headers.get('content-range') !== expectedRange) {
    return { ok: false, reason: 'invalid-or-unexposed-content-range' };
  }
  if (response.headers.get('content-length') !== String(probe.metadataLength)) {
    return { ok: false, reason: 'unbounded-or-incomplete-body' };
  }
  if (response.headers.get('content-type')?.toLowerCase().split(';')[0].trim() !== 'application/octet-stream') {
    return { ok: false, reason: 'unexpected-content-type' };
  }
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await response.arrayBuffer()); }
  catch { return { ok: false, reason: 'range-read-failed' }; }
  if (bytes.byteLength !== probe.metadataLength) return { ok: false, reason: 'wrong-range-length' };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // OM data-type 0 is a container, not an array-valued root node.
  if (view.getUint8(0) !== 0) return { ok: false, reason: 'unsupported-root-node-type' };
  const nameBytes = view.getUint16(2, true);
  const childrenCount = view.getUint32(4, true);
  if (!childrenCount || childrenCount > MAX_ROOT_CHILDREN ||
      8 + 16 * childrenCount + nameBytes !== bytes.byteLength) {
    return { ok: false, reason: 'invalid-root-index-layout' };
  }

  const children: OmChildMetadataSpan[] = [];
  for (let i = 0; i < childrenCount; i++) {
    const length = view.getBigUint64(8 + i * 8, true);
    const offset = view.getBigUint64(8 + childrenCount * 8 + i * 8, true);
    // All nested variable descriptions must be fully before the root.
    if (offset < 3n || length < 8n ||
        offset + length > BigInt(probe.metadataOffset)) {
      return { ok: false, reason: 'invalid-child-metadata-bounds' };
    }
    children.push({ offset: Number(offset), length: Number(length) });
  }
  // An overlapping child pointer could make two named fields refer to
  // ambiguous metadata; be conservative until an independent reader agrees.
  const sorted = [...children].sort((a, b) => a.offset - b.offset);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].offset + sorted[i - 1].length > sorted[i].offset) {
      return { ok: false, reason: 'overlapping-child-metadata' };
    }
  }
  return { ok: true, status: 'root-index-verified',
    childCount: childrenCount, children, pixelValidated: false };
}
