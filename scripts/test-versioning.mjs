import fs from 'node:fs';
import {assessMidVersionFreeze,assessMidReviewDispositions,inspectMidReleaseMirrors} from '../tools/ci/mid-release-freeze-evidence.mjs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const pkg=JSON.parse(read('../package.json'));
const descriptor=JSON.parse(read('../public/version.json'));
const sync=read('./sync-version.mjs');
const updater=read('../src/v078.ts');
const serviceWorker=read('../public/service-worker.js');
const legacyWorker=read('../public/sw.js');
const readme=read('../README.md');
const failures=[];

const versionPattern=/^\d+\.\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/;
if(!versionPattern.test(pkg.version))failures.push(`Paketversion entspricht nicht dem MID-Schema: ${pkg.version}`);
if(descriptor.version!==pkg.version)failures.push('version.json und package.json sind nicht synchron');
if(!sync.includes('(?:\\.\\d+)?'))failures.push('sync-version akzeptiert keine vierteiligen Wartungsversionen');
if(!sync.includes("['../public/service-worker.js','../public/sw.js']"))failures.push('Service-Worker-Cache wird nicht zentral synchronisiert');
if(!sync.includes("../MID_IOS_STATUS.json")||!sync.includes('iosStatus.releaseVersion=version'))failures.push('MID_IOS_STATUS.json wird nicht zentral mit der Releaseversion synchronisiert');
if(!updater.includes('(?:\\.\\d+)?'))failures.push('Sichtbare Versionsersetzung unterstützt keine vierte Stelle');
if(!serviceWorker.includes(`mid-shell-v${pkg.version}`)||legacyWorker!==serviceWorker)failures.push('Service-Worker-Versionen sind nicht vollständig synchron');
if(!readme.includes('https://www.midwx.app/version.json')||readme.includes('**Aktuelle Version:** v'))failures.push('README muss statt einer veraltenden Versionsnummer die aktuelle veröffentlichte Version verlinken');
if(!readme.includes('Wartungsrelease (`0.7.x.y` mit `y ≥ 1`)')||!readme.includes('Funktionsrelease (`0.7.x` oder äquivalent `0.7.x.0`)'))failures.push('Versionsrichtlinie ist nicht dokumentiert');

function versionNumbers(value){return String(value||'').trim().replace(/^v/i,'').split(/[.-]/).map(part=>Number.parseInt(part,10)).map(value=>Number.isFinite(value)?value:0)}
function isNewerVersion(candidate,current){const a=versionNumbers(candidate),b=versionNumbers(current),length=Math.max(a.length,b.length);for(let i=0;i<length;i++){const av=a[i]??0,bv=b[i]??0;if(av!==bv)return av>bv}return false}
for(const [candidate,current,expected] of [['0.7.70.1','0.7.70',true],['0.7.70.2','0.7.70.1',true],['0.7.71','0.7.70.9',true],['0.7.70','0.7.70.1',false],['0.7.70.1','0.7.70.1',false]])if(isNewerVersion(candidate,current)!==expected)failures.push(`Versionsvergleich fehlerhaft: ${candidate} gegenüber ${current}`);


// Release-concept qualification is deliberately part of the existing registered
// version regression (not a new workflow, source gate, or automatic Cubic gate).
const frozenVersion=await inspectMidReleaseMirrors(pkg.version,path=>Promise.resolve(read('../'+path)));
if(!frozenVersion.evidenceConsistent)
  failures.push('MID version mirrors drift: '+frozenVersion.blockers.join(', '));
if(frozenVersion.releaseAuthorized!==false||frozenVersion.mergeAuthorized!==false||frozenVersion.pathsChecked!==19)
  failures.push('Read-only release mirror inspector claimed authority or lost paths');
const damagedMirror=await inspectMidReleaseMirrors(pkg.version,path=>Promise.resolve(
 path==='contracts/index.json'?'{"releaseVersion":"0.9.85.0"}':read('../'+path)
));
if(damagedMirror.evidenceConsistent||!damagedMirror.blockers.includes('MIRROR_MISMATCH:contracts/index.json'))
  failures.push('Malformed version mirror was not rejected');

const excessiveVersion=await inspectMidReleaseMirrors(pkg.version,path=>Promise.resolve(
 path==='CHANGELOG.md'?'# MID v'+pkg.version+'.1\n':read('../'+path)
));
if(excessiveVersion.evidenceConsistent||!excessiveVersion.blockers.includes('MIRROR_MISMATCH:CHANGELOG.md'))
 failures.push('A fifth version component was wrongly accepted in a changelog mirror');
const legacyThreeComponent=await inspectMidReleaseMirrors('0.9.86',path=>Promise.resolve(read('../'+path)));
if(legacyThreeComponent.blockers.includes('EXPECTED_VERSION_INVALID')||legacyThreeComponent.pathsChecked!==19)
 failures.push('Legacy three-component feature version rejected before real version mirror comparison');
const missingMirror=await inspectMidReleaseMirrors(pkg.version,path=>path==='MID_IOS_STATUS.json'?
 Promise.reject(new Error('not available')):Promise.resolve(read('../'+path)));
if(missingMirror.evidenceConsistent||!missingMirror.blockers.some(x=>x.includes('MISSING_OR_UNREADABLE_MIRROR:MID_IOS_STATUS.json')))
  failures.push('Missing iOS source was incorrectly treated as a zero or as complete');

const snapshot={stableSha:'a'.repeat(40),mainSha:'a'.repeat(40),expectedStableSha:'a'.repeat(40),
 baseVersion:'0.9.85.455',candidateHeadSha:'b'.repeat(40),reviewedHeadSha:'b'.repeat(40)};
const maintenance=assessMidVersionFreeze({...snapshot,impact:'maintenance',targetVersion:'0.9.85.456'});
const feature=assessMidVersionFreeze({...snapshot,impact:'feature',targetVersion:'0.9.86.0'});
if(!maintenance.evidenceConsistent||!feature.evidenceConsistent||maintenance.releaseAuthorized!==false||maintenance.mergeAuthorized!==false||feature.releaseAuthorized!==false||
 feature.mergeAuthorized!==false)
 failures.push('Maintenance/feature four-component arithmetic is not read-only and correct');
for(const example of [
 {...snapshot,impact:'feature',targetVersion:'0.9.85.456'},
 {...snapshot,impact:'unknown',targetVersion:'0.9.85.456'},
 {...snapshot,impact:'maintenance',targetVersion:'0.9.86.0'},
 {...snapshot,impact:'maintenance',targetVersion:'0.9.85.455',reviewedHeadSha:'c'.repeat(40)},
 {...snapshot,impact:'maintenance',targetVersion:'0.9.85.456',expectedStableSha:'c'.repeat(40)},
 {...snapshot,impact:'maintenance',targetVersion:'0.9.85.456',stableSha:'c'.repeat(40)},
]){
 if(assessMidVersionFreeze(example).evidenceConsistent)failures.push('Invalid final SHA/version choice was accepted');
}

const reviewHead='c'.repeat(40),qualified={headSha:reviewHead,status:'qualified',
 evidenceRef:'Independent source review for pinned HEAD / test evidence'};
const baseReview={headSha:reviewHead,cubic:{state:'unavailable'},independentReview:qualified,findings:[]};
const cubicDown=assessMidReviewDispositions(baseReview);
if(!cubicDown.evidenceConsistent||cubicDown.cubicRequired!==false||
 cubicDown.releaseAuthorized!==false||cubicDown.mergeAuthorized!==false)
 failures.push('Cubic unavailability incorrectly created a new required release check');
const p1={id:'cubic-P1',severity:'P1',domainCritical:true,disposition:'unreviewed'};
for(const input of [
 {...baseReview,independentReview:null},
 {...baseReview,cubic:{state:'completed',headSha:reviewHead},independentReview:null},
 {...baseReview,cubic:{state:'completed',headSha:reviewHead},findings:[p1]},
 {...baseReview,findings:[{...p1,disposition:'deferred',
   reviewedHeadSha:reviewHead,evidenceRef:'reason / issue 740',rationale:'deferral has a written reason'}]},
 {...baseReview,findings:null},
 {...baseReview,findings:[p1,p1]},
]){
 if(assessMidReviewDispositions(input).evidenceConsistent)
  failures.push('Unqualified or critical Cubic finding was silently cleared');
}
const explained={...p1,disposition:'fixed',reviewedHeadSha:reviewHead,
 evidenceRef:'GitHub SHA-pinned regression test / CI run #12345',
 rationale:'Fixed in the reviewed final integration commit'};
const resolved=assessMidReviewDispositions({...baseReview,cubic:{state:'completed',headSha:reviewHead},findings:[explained]});
if(!resolved.evidenceConsistent||resolved.releaseAuthorized!==false||resolved.mergeAuthorized!==false)
 failures.push('Evidence-bearing disposition should be reviewable but never authorize release');
const staleCubic=assessMidReviewDispositions({...baseReview,cubic:{state:'completed',headSha:'d'.repeat(40)}});
if(!staleCubic.evidenceConsistent||!staleCubic.observations.some(x=>x.includes('stale')))
 failures.push('Stale Cubic review was treated as current proof');
const noncriticalP2={id:'optional-copy',severity:'P2',disposition:'deferred',
 reviewedHeadSha:reviewHead,evidenceRef:'Independent review #740 on the exact SHA',
 rationale:'A minor label alignment can be safely deferred with express owner risk acceptance'};
if(assessMidReviewDispositions({...baseReview,findings:[{...noncriticalP2,ownerRiskAccepted:'false'}]}).evidenceConsistent)
 failures.push('Truthiness of ownerRiskAccepted string falsely bypassed risk acceptance');
if(!assessMidReviewDispositions({...baseReview,findings:[{...noncriticalP2,ownerRiskAccepted:true}]}).evidenceConsistent)
 failures.push('Explicit verified Boolean risk acceptance was not recognized');
const unreviewedP3={id:'style-pending',severity:'P3',disposition:'unreviewed'};
if(assessMidReviewDispositions({...baseReview,findings:[unreviewedP3]}).evidenceConsistent)
 failures.push('Unreviewed P3 must be acknowledged before being non-blocking');
const traceableP3={id:'style-note',severity:'P3',disposition:'deferred',
 reviewedHeadSha:reviewHead,evidenceRef:'Tracked suggestion / optional housekeeping',
 rationale:'This style suggestion has no product or release implications'};
if(!assessMidReviewDispositions({...baseReview,findings:[traceableP3]}).evidenceConsistent)
 failures.push('Reviewed, deferred P3 suggestion caused a permanent Cubic deadlock');

if(failures.length){console.error('Versionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
const parts=pkg.version.split('.').map(Number),releaseType=parts.length===3||parts[3]===0?'Funktionsstand':'Wartungsstand';
console.log(`Versionsschema geprüft: ${pkg.version} als ${releaseType}; dreiteilige sowie vierteilige Funktionsstände mit abschließender 0 und Wartungsreleases ab .1 werden korrekt verarbeitet.`);
