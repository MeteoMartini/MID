import {deliverLogiccResult} from './logicc-result.mjs';

const api = 'https://api.github.com/repos/MeteoMartini/MID/issues';
const MAX_RESPONSE_BYTES = 65_536;

// A response is evidence only after a complete, bounded UTF-8 JSON read.
// Fetch may transparently decode compressed bodies; cap actual decoded bytes.
async function readBoundedJson(response) {
  const type = response.headers.get('content-type') ?? '';
  const length = response.headers.get('content-length');
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(type) ||
      (length !== null && (!/^[0-9]{1,10}$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) ||
      !response.body) {
    try { await response.body?.cancel(); } catch {}
    throw new Error('Unverified Logicc response metadata');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal:true});
  let bytes = 0, text = '';
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('Invalid Logicc response chunk');
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw new Error('Logicc response limit exceeded');
      text += decoder.decode(value, {stream:true});
    }
    const encoding = response.headers.get('content-encoding');
    if (length !== null && (encoding === null || encoding === 'identity') && bytes !== Number(length))
      throw new Error('Incomplete Logicc response');
    const parsed = JSON.parse(text + decoder.decode());
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('Invalid Logicc response shape');
    return parsed;
  } catch {
    try { await reader.cancel(); } catch {}
    throw new Error('Unverified Logicc JSON response');
  } finally { reader.releaseLock(); }
}

// The host supplies a scoped installation token provider, the expected app
// actor and a durable, atomic receipt store. Callers supply only the result.
export function createLogiccCommentTransport(getInstallationToken) {
  if (typeof getInstallationToken !== 'function') {
    throw new TypeError('Logicc installation token provider is missing');
  }
  let token;
  async function request(path, method, body) {
    token ??= await getInstallationToken();
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error('Invalid Logicc installation token');
    }
    const response = await fetch(api + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body === undefined ? {} : {'Content-Type': 'application/json'}),
      },
      body: body === undefined ? undefined : JSON.stringify({body}),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== (method === 'POST' ? 201 : 200)) {
      try { await response.body?.cancel(); } catch {}
      throw new Error('Logicc comment transport rejected');
    }
    return readBoundedJson(response);
  }
  return Object.freeze({
    publish: ({body}) => request('/1007/comments', 'POST', body),
    readback: ({commentId}) => {if(!Number.isSafeInteger(commentId)||commentId<=0)throw new TypeError('Invalid comment ID');return request('/comments/' + commentId, 'GET');},
  });
}

export async function sendLogiccResult(result, assignment, {getInstallationToken, reserve, expectedActor}) {
  return deliverLogiccResult(result, assignment, {reserve,expectedActor,...createLogiccCommentTransport(getInstallationToken)});
}
