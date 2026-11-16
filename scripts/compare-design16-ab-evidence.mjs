/**
 * Independent, read-only compare: TWO exact production dist directories plus
 * the corresponding SHA-bound startup and module-only Chrome probe artifacts.
 * Descriptive only, never a real full-app A/B pass or source/release gate.
 *
 * Usage:
 * node scripts/compare-design16-ab-evidence.mjs \
 *   <stable-dist> <stable-40-sha> <stable-startup-json> <stable-map-json> \
 *   <candidate-dist> <candidate-40-sha> <candidate-startup-json> <candidate-map-json>
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';
import {compareDesign16Evidence} from './lib/design16AbEvidence.mjs';

if(process.argv.length!==10){
 console.error('Usage: node scripts/compare-design16-ab-evidence.mjs <stable-dist> <stable-40-sha> <stable-startup-json> <stable-map-json> <candidate-dist> <candidate-40-sha> <candidate-startup-json> <candidate-map-json>');
 process.exit(2);
}
const fields=process.argv.slice(2);
const parse=async filename=>JSON.parse(await readFile(resolve(filename),'utf8'));
async function loadSide(index,label){
 const dist=resolve(fields[index]);
 const expectedSha=fields[index+1];
 if(!/^[a-f0-9]{40}$/.test(expectedSha))throw Error(label+' requires an exact 40-character Git SHA');
 const identity=await parse(dist+'/mid-build-identity.json');
 if(identity.sourceGitSha!==expectedSha)throw Error(label+' dist source SHA is not the requested Git commit');
 await verifyStartupBuildIdentity(dist,identity);
 const version=await parse(dist+'/version.json');
 if(version.version!==identity.version)throw Error(label+' production version differs from build identity');
 return {buildIdentity:identity,startup:await parse(fields[index+2]),mapModule:await parse(fields[index+3])};
}
const stable=await loadSide(0,'stable');
const candidate=await loadSide(4,'candidate');
const result=compareDesign16Evidence({stable,candidate,expectedStableSha:fields[1],expectedCandidateSha:fields[5]});
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/design16-ab-evidence.json',JSON.stringify(result,null,2)+'\n');
console.log('MID_DESIGN16_AB_EVIDENCE '+JSON.stringify({
 stableSha:result.stable.sourceGitSha,candidateSha:result.candidate.sourceGitSha,
 status:result.status,releaseAuthorized:false,
 initialCssGzipDelta:result.metrics.initialCssGzip.delta,
 initialJsGzipDelta:result.metrics.initialJsGzip.delta,
 moduleOnlyGzipDelta:result.metrics.mapJsGzip.delta,
 warnings:result.reasons.length,
}));
