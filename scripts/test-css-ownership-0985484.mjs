#!/usr/bin/env node
import assert from 'node:assert/strict';
import postcss from 'postcss';
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
console.log('PASS CSS ownership collision, context, importance, source bytes, conservative controls and invalid-entry tests');
