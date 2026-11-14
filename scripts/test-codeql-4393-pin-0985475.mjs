import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const old='9b3254085494b55a0f7c4c2b3d2d52cc712ce370',approved='33d7b85da1a04171e211befe2c739303b9a4c066';
const [source,mirror,generator]=await Promise.all([
 read('ci/github/workflows/mid-code-revision.yml'),
 read('.github/workflows/mid-code-revision.yml'),
 read('scripts/sync-github-workflows.mjs')
]);
assert.equal(mirror,source,'Canonical and installed CodeQL workflows must match byte-for-byte');
for(const action of ['init','analyze']){
 const expected='github/codeql-action/'+action+'@'+approved+' # v4.39.3';
 assert.ok(source.includes(expected),'Missing approved SHA pin for '+action);
 assert.equal(source.split('github/codeql-action/'+action+'@').length-1,1,'Duplicate CodeQL '+action);
}
assert.ok(generator.includes("const CODEQL_V4_SHA='"+approved+"'"),'Pin generator must use official v4.39.3 target');
assert.ok(generator.includes('(init|analyze)@')&&generator.includes('CODEQL_V4_SHA} # v4.39.3'),'Generator must pin both entrypoints and label consistently');
for(const [name,content] of [['canonical',source],['mirror',mirror],['generator',generator]]){
 assert.ok(!content.includes(old),name+': obsolete CodeQL SHA is forbidden');
 assert.ok(!content.includes('v4.39.1'),name+': obsolete CodeQL version label is forbidden');
}
assert.ok(source.includes('build-mode: none')&&source.includes('queries: security-extended'),'Existing CodeQL scope and query selection must be preserved');
console.log('MID CodeQL v4.39.3: official SHA, dual pins, canonical mirror and regeneration guard passed.');
