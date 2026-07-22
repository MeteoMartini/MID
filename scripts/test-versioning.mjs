import fs from 'node:fs';

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
if(!updater.includes('(?:\\.\\d+)?'))failures.push('Sichtbare Versionsersetzung unterstützt keine vierte Stelle');
if(!serviceWorker.includes(`mid-shell-v${pkg.version}`)||legacyWorker!==serviceWorker)failures.push('Service-Worker-Versionen sind nicht vollständig synchron');
if(!readme.includes('Wartungsrelease (`0.7.x.y`)')||!readme.includes('Funktionsrelease (`0.7.x`)'))failures.push('Versionsrichtlinie ist nicht dokumentiert');

function versionNumbers(value){return String(value||'').trim().replace(/^v/i,'').split(/[.-]/).map(part=>Number.parseInt(part,10)).map(value=>Number.isFinite(value)?value:0)}
function isNewerVersion(candidate,current){const a=versionNumbers(candidate),b=versionNumbers(current),length=Math.max(a.length,b.length);for(let i=0;i<length;i++){const av=a[i]??0,bv=b[i]??0;if(av!==bv)return av>bv}return false}
for(const [candidate,current,expected] of [['0.7.70.1','0.7.70',true],['0.7.70.2','0.7.70.1',true],['0.7.71','0.7.70.9',true],['0.7.70','0.7.70.1',false],['0.7.70.1','0.7.70.1',false]])if(isNewerVersion(candidate,current)!==expected)failures.push(`Versionsvergleich fehlerhaft: ${candidate} gegenüber ${current}`);

if(failures.length){console.error('Versionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Versionsschema geprüft: ${pkg.version} als Wartungsstand; dreiteilige Funktions- und vierteilige Wartungsreleases werden korrekt verarbeitet.`);
