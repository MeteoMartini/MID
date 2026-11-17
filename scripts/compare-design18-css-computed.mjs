/**
 * MID Design 1.8: compare two independently recorded real-browser CSSOM case arrays.
 * Usage: node scripts/compare-design18-css-computed.mjs stable.json candidate.json cases.json
 * Input arrays must each contain exact required cases; output is descriptive, NEVER a release gate.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compareCssomCases} from './lib/design18CssComputedEvidence.mjs';
assert.equal(process.argv.length,5,
 'Usage: node scripts/compare-design18-css-computed.mjs <stable-cases.json> <candidate-cases.json> <required-case-ids.json>');
const [stable,candidate,requiredCaseIds]=await Promise.all(
 process.argv.slice(2).map(async p=>JSON.parse(await readFile(resolve(p),'utf8'))));
const result=compareCssomCases({stable,candidate,requiredCaseIds});
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/mid-design18-cssom-descriptive.json',JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('MID_DESIGN18_CSSOM '+JSON.stringify({
 status:result.status,differences:result.differenceCount,
 cases:result.requiredCaseIds.length,releaseAuthorized:false,cssSplitSafeProven:false,
}));
