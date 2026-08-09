import {readFile} from 'node:fs/promises';
const [safety,main,persistence,portable,twin,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/storageSafety.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/persistence.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/portableUserData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "RESERVE_KEY='mid:runtime:storage-reserve:v1'",
 'isQuotaExceededError',
 'trimReconstructibleStorage(true)',
 'nativeSetWithRecovery',
 'storageFallbackEntries',
 'nativeCommitted:committed',
 "STORAGE_DB='mid-durable-storage-v1'"
])if(!safety.includes(token))failures.push(`storageSafety fehlt: ${token}`);
for(const token of [
 'await timeout(initializeStorageSafety(),3500)',
 'await timeout(compactForecastVerificationLocalStorage(),5000)'
])if(!main.includes(token))failures.push(`main fehlt: ${token}`);
if(!persistence.includes('storageFallbackEntries()'))failures.push('Persistenz-Snapshot berücksichtigt Quota-Fallback nicht.');
if(!portable.includes('storageFallbackEntries()'))failures.push('Gerätesync berücksichtigt Quota-Fallback nicht.');
for(const token of [
 'const MAX_CAPTURES=72;',
 'const MAX_REFERENCES=60;',
 'const MAX_OBSERVATIONS=192;',
 'export async function compactForecastVerificationLocalStorage()',
 'const mirrored=await mirrorStore(candidate.locationKey,candidate.store)',
 'if(!mirrored)continue',
 'const compact=localCompactStore(updated)'
])if(!twin.includes(token))failures.push(`Wetterzwilling-Quota-Schutz fehlt: ${token}`);
for(const forbidden of ["localStorage.removeItem('mid:favorites')","localStorage.removeItem(FAVORITES_STORAGE_KEY)"])if(safety.includes(forbidden))failures.push('Favoriten dürfen niemals als Quota-Bereinigung entfernt werden.');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID Storage-Quota-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: quota-sichere Persistenz, Cache-Bereinigung und vollständiger Wetterzwilling-Erhalt geprüft.');
