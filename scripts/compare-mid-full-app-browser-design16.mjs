/** Read-only comparison of two already SHA-verified full-MID-page lab reports. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compareFullAppLabEvidence} from './lib/design16FullAppProbePolicy.mjs';
assert.equal(process.argv.length,4,'Usage: node scripts/compare-mid-full-app-browser-design16.mjs <stable-report.json> <candidate-report.json>');
const [a,b]=await Promise.all(process.argv.slice(2).map(async file=>JSON.parse(await readFile(resolve(file),'utf8'))));
const output=compareFullAppLabEvidence({stable:a,candidate:b});
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/mid-design16-real-app-lab-pair.json',JSON.stringify(output,null,2)+'\n');
console.log('MID_DESIGN16_LAB_PAIR '+JSON.stringify({status:output.status,stable:output.stable.sourceGitSha,
 candidate:output.candidate.sourceGitSha,releaseAuthorized:false,performanceGainProven:false}));
