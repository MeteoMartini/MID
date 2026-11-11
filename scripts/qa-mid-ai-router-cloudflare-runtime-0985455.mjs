#!/usr/bin/env node
// Cloudflare runtime: static syntax, protected class and config checks ONLY.
// This is not a deployed OAuth test or a real Cloudflare Workers build.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const paths=['router/cloudflare/mcp-worker.mjs','router/cloudflare/oauth-server.mjs'];
let tests=0;
for(const path of paths){
 const abs=root+path,source=readFileSync(abs,'utf8');
 const node=spawnSync(process.execPath,['--check',abs],{encoding:'utf8',timeout:10000});
 assert.equal(node.status,0,node.stderr);tests++;
 assert.ok(!/console\.(log|info|debug)\(/.test(source));tests++;
 assert.ok(!/disableSecurity|unsafeAnonymous|forcePush/.test(source));tests++;
}
const resource=readFileSync(root+paths[0],'utf8');
const issuer=readFileSync(root+paths[1],'utf8');
assert.match(resource,/OAuthResourceServer/);tests++;
assert.match(resource,/AUTH_SERVER\.validateToken/);tests++;
assert.match(resource,/createMidAiGlobalAdmission/);tests++;
assert.match(resource,/createMidAiSignedQuotaVerifier/);tests++;
assert.match(resource,/MID_AI_LIVE_DISPATCH_ARMED/);tests++;
assert.match(resource,/principalDigest\(/);tests++;
assert.match(issuer,/OAuthAuthorizationServer/);tests++;
assert.match(issuer,/beginConsent/);tests++;
assert.match(issuer,/approveConsent/);tests++;
assert.match(issuer,/beginUpstream/);tests++;
assert.match(issuer,/finishUpstream/);tests++;
assert.match(issuer,/code_challenge_method/);tests++;
assert.match(issuer,/MID_AI_ALLOWED_GITHUB_USER_ID/);tests++;
assert.match(issuer,/scope:resumed\.data\.selected/);tests++;
const packageJson=JSON.parse(readFileSync(root+'router/cloudflare/package.json','utf8'));
assert.equal(packageJson.dependencies['@cloudflare/workers-oauth-provider'],'1.2.4');tests++;
const authToml=readFileSync(root+'router/cloudflare/wrangler.auth.toml','utf8');
assert.match(authToml,/global_fetch_strictly_public/);tests++;
console.log('MID AI Router Cloudflare runtime static QA OK; scenarios='+tests+
 '; only syntax and source checks, no OAuth handshake, deployment or inference.');
