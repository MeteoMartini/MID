/**
 * MID RUC lossless transport CANDIDATE decoder. Not wired into production.
 * Matches tools/ruc/lossless_codec_pilot.py (v1). Runs in browser,
 * WKWebView, Cloudflare Worker and Node without an npm dependency.
 * Unknown wire always rejects; never reinterpret as v2 raw records.
 */
export const RUC_CANDIDATE_SCHEMA = 'mid.ruc.lossless-candidate.v1';
export const RUC_MAX_DECODED_BYTES = 2_000_000;
export const RUC_MAX_WIRE_BYTES = 2_100_000;
const CODECS = new Set(['gzip', 'byteplanes-gzip', 'delta-byteplanes-gzip']);
const FIELDS = ['schema', 'codec', 'decodedBytes', 'encodedBytes', 'decodedSha256', 'encodedSha256'];
const HASH = /^[0-9a-f]{64}$/;

function requireManifest(manifest, wire) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) ||
      Object.keys(manifest).sort().join(',') !== [...FIELDS].sort().join(',')) {
    throw new Error('RUC codec: invalid manifest fields');
  }
  const {schema, codec, decodedBytes, encodedBytes, decodedSha256, encodedSha256} = manifest;
  if (schema !== RUC_CANDIDATE_SCHEMA || !CODECS.has(codec)) throw new Error('RUC codec: unknown schema or codec');
  if (!Number.isSafeInteger(decodedBytes) || decodedBytes < 1 || decodedBytes > RUC_MAX_DECODED_BYTES ||
      (codec !== 'gzip' && decodedBytes % 2)) throw new Error('RUC codec: invalid decoded length/alignment');
  if (!Number.isSafeInteger(encodedBytes) || encodedBytes < 1 || encodedBytes > RUC_MAX_WIRE_BYTES ||
      !(wire instanceof Uint8Array) || wire.byteLength !== encodedBytes) throw new Error('RUC codec: invalid wire length');
  if (!HASH.test(decodedSha256) || !HASH.test(encodedSha256)) throw new Error('RUC codec: invalid SHA-256');
}

async function sha256Hex(bytes) {
  if (!globalThis.crypto?.subtle?.digest) throw new Error('RUC codec: SHA-256 unavailable');
  const hash = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  return Array.from(hash, value => value.toString(16).padStart(2, '0')).join('');
}

function restoreByteplanes(shaped) {
  const half = shaped.length / 2;
  const original = new Uint8Array(shaped.length);
  for (let i = 0; i < half; i++) {
    original[i * 2] = shaped[i];
    original[i * 2 + 1] = shaped[half + i];
  }
  return original;
}

function restoreDeltaByteplanes(shaped) {
  const half = shaped.length / 2;
  const original = new Uint8Array(shaped.length);
  let word = 0;
  for (let i = 0; i < half; i++) {
    const delta = shaped[i] | (shaped[half + i] << 8);
    word = (word + delta) & 0xffff;
    original[2 * i] = word & 0xff;
    original[2 * i + 1] = word >>> 8;
  }
  return original;
}

/** Decode verified bytes with an explicit bound BEFORE weather data parsing. */
export async function decodeRucLosslessCandidate(manifest, wire) {
  requireManifest(manifest, wire);
  if (await sha256Hex(wire) !== manifest.encodedSha256) throw new Error('RUC codec: wire SHA-256 mismatch');
  if (typeof globalThis.DecompressionStream !== 'function' || typeof globalThis.ReadableStream !== 'function') {
    throw new Error('RUC codec: gzip streaming unavailable');
  }
  const source = new ReadableStream({start(controller) {controller.enqueue(wire); controller.close();}});
  const reader = source.pipeThrough(new DecompressionStream('gzip')).getReader();
  const shaped = new Uint8Array(manifest.decodedBytes);
  let consumed = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array) || consumed + value.length > shaped.length) {
        throw new Error('RUC codec: decompression exceeds declared length');
      }
      shaped.set(value, consumed);
      consumed += value.length;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw new Error('RUC codec: invalid or oversized gzip (' + String(error?.message || error) + ')');
  } finally {
    reader.releaseLock();
  }
  if (consumed !== shaped.length) throw new Error('RUC codec: truncated decoded payload');
  const decoded = manifest.codec === 'gzip' ? shaped :
    manifest.codec === 'byteplanes-gzip' ? restoreByteplanes(shaped) : restoreDeltaByteplanes(shaped);
  if (await sha256Hex(decoded) !== manifest.decodedSha256) throw new Error('RUC codec: decoded SHA-256 mismatch');
  return decoded;
}
