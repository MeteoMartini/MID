#!/usr/bin/env node
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {readFileSync,existsSync} from 'node:fs';
import {loadCssCascade} from './lib/cssCascade.mjs';
import {analyzeCssOwnership} from './audit-css-ownership-0985484.mjs';
const fixture=(file,original)=>({file,original,tree:postcss.parse(original)});
const result=analyzeCssOwnership([
 fixture('foundation.css','.current-card{color:red;display:grid}@media(max-width:430px){.current-card{margin:0}}'),
 fixture('features.css','.current-card{color:blue}@media(max-width:430px){.current-card{margin:2px}} .ensemble-card{display:block}'),
 fixture('later.css','.current-card{color:blue!important}@supports(display:grid){.current-card{margin:9px}}'),
]);
const rows=result.sources;
assert.equal(result.status,'DIAGNOSTIC_ONLY_NO_CSS_MOVE_APPROVAL');
assert.equal(rows[0].laterExactMatches,2,'two later exact selector/property/context matches');
assert.equal(rows[0].laterDifferentValue,2);
assert.equal(rows[1].laterExactMatches,1,'same selector later with importance change');
assert.equal(rows[1].laterImportanceDifferences,1);
assert.equal(rows[2].laterExactMatches,0,'different @supports context is not equal to @media');
assert.equal(rows[0].possibleOwners.current,2);
assert.equal(rows[1].possibleOwners.ensemble,1);
assert.equal(result.summary.importantDeclarations,1);
assert.equal(result.controls.cssOrderingUnchanged,true);
assert.equal(result.controls.visualBrowserParityNotChecked,true);
assert.equal(result.summary.sourceBytes,rows.reduce((sum,x)=>sum+x.sourceBytes,0));
assert.throws(()=>analyzeCssOwnership([]),/Invalid canonical/);
assert.throws(()=>analyzeCssOwnership([{file:'missing'}]),/Invalid canonical/);
// Resolve the canonical repository from the test file, never from process.cwd().
// Local and CI runs must both fail closed if the real CSS manifest is absent.
const projectRoot=new URL('../',import.meta.url);
function readMandatoryManifest(root){
 const manifestPath=new URL('src/styles-src/presentation-order.json',root);
 if(!existsSync(manifestPath))throw Error('Mandatory canonical CSS manifest missing: '+manifestPath.pathname);
 return JSON.parse(readFileSync(manifestPath,'utf8'));
}
assert.throws(()=>readMandatoryManifest(new URL('./__intentionally-missing-css-fixture__/',projectRoot)),/Mandatory canonical CSS manifest missing/);
const manifest=readMandatoryManifest(projectRoot);
{
 const actual=analyzeCssOwnership(loadCssCascade(projectRoot));
 assert.equal(actual.summary.sourceCount,manifest.sources.length,'canonical CSS source manifest must be fully scanned');
 assert.equal(actual.summary.sourceBytes,actual.sources.reduce((sum,s)=>sum+s.sourceBytes,0));
 assert.equal(actual.controls.sourceWrites,false);
 assert.ok(actual.summary.declarations>0&&actual.summary.importantDeclarations>0);
 assert.ok(actual.sources.some(x=>x.file==='src/styles-src/30-modern.css'));
 const metric={...actual.summary,exactLaterMatches:actual.sources.reduce((sum,s)=>sum+s.laterExactMatches,0),largestFour:actual.largestFour};
 console.log('MID_CSS_OWNERSHIP_DIAGNOSTIC '+JSON.stringify(metric));
 console.log('PASS real canonical CSS read-only scan on current repository');
}
console.log('PASS CSS ownership collision, context, importance, source bytes, conservative controls and invalid-entry tests');
