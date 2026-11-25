import {deliverLogiccResult} from './logicc-result.mjs';

const api = 'https://api.github.com/repos/MeteoMartini/MID/issues';

// The host supplies a scoped installation token provider, the expected app
// actor and a durable, atomic receipt store. Callers supply only the result.
export async function sendLogiccResult(result, assignment, {getInstallationToken, reserve, expectedActor}) {
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
      throw new Error('Logicc comment transport rejected');
    }
    return response.json();
  }
  return deliverLogiccResult(result, assignment, {
    reserve,
    expectedActor,
    publish: ({body}) => request('/1007/comments', 'POST', body),
    readback: ({commentId}) => request('/comments/' + commentId, 'GET'),
  });
}
