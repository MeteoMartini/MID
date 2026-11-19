// Verify the public Fast Lane against the expected deployment digest.
import { pathToFileURL } from 'node:url';
import { readPagedFastPointShadow } from './ruc_fast_paged_point_shadow.mjs';

export async function verifyFastPagesReadback({
  origin,
  manifestSha256,
  modelRunUtc,
  gridIndex,
  fetchImpl = globalThis.fetch,
  signal,
}) {
  const base = new URL('/ruc/', origin);
  if (base.protocol !== 'https:' || base.username || base.password ||
      !/^[a-f0-9]{64}$/.test(manifestSha256 ?? '') ||
      !/^20\d\d-\d\d-\d\dT\d\d:00:00\.000Z$/.test(modelRunUtc ?? '') ||
      !Number.isSafeInteger(gridIndex) || gridIndex < 0 || gridIndex >= 964 * 596) {
    throw new Error('Invalid Fast Pages deployment proof inputs');
  }
  const deadline = signal ?? AbortSignal.timeout(15_000);

  async function read(key, maxBytes) {
    const url = new URL(key, base);
    const response = await fetchImpl(url, {
      redirect: 'error',
      cache: 'no-store',
      signal: deadline,
    });
    if (response.status !== 200 || !response.body) {
      throw new Error('Fast Pages object unavailable: ' + key);
    }
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maxBytes) {
          await reader.cancel();
          throw new Error('Fast Pages object exceeds its byte limit: ' + key);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  }

  const manifest = await read('fast/paged-shadow.json', 3_000_000);
  // The point reader validates each chunk key before passing it to read().
  const cell = await readPagedFastPointShadow(
    manifest, manifestSha256, key => read(key, 512 * 168), gridIndex,
  );
  if (!cell.available || cell.modelRunUtc !== modelRunUtc || cell.epsAvailable !== false) {
    throw new Error('Fast Pages returned a different run or no native data at the probe point');
  }
  return { modelRunUtc, manifestSha256, epsAvailable: false, pagesReadbackVerified: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [origin, manifestSha256, modelRunUtc, gridIndexText] = process.argv.slice(2);
  if (!/^[0-9]+$/.test(gridIndexText ?? '') || process.argv.length !== 6) {
    throw new Error('Expected origin, manifest SHA-256, ISO model run and grid index');
  }
  const proof = await verifyFastPagesReadback({
    origin, manifestSha256, modelRunUtc, gridIndex: Number(gridIndexText),
  });
  console.log(JSON.stringify(proof));
}
