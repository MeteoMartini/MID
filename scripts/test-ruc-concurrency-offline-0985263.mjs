import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const bytes=readFileSync('scripts/fixtures/ruc-service-worker-0257.js');
assert.equal(createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'),'9025890e5d44d880149602f2956d4782fe18cc4f','Browser profile must be the byte-identical original .257 SW, source e0f05c5059a6b5e88c377f433e9737423a174393');
// The shared dual-read test exercises 64-way coalescing, two distinct inflight
// slots, busy fallback/recovery and concurrent failures on the actual decoder.
import './test-ruc-dual-read-0985258.mjs';
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-ruc-offline-browser-0985263.mjs'],{stdio:'inherit',timeout:240000});
console.log('RUC263: original .257 SW identity, concurrency and bounded codec slots verified. Browser profile is mandatory on GitHub.');
