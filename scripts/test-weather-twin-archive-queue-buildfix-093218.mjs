import {readFile} from 'node:fs/promises';
const [source,pkg,baseline]=await Promise.all([readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];
for(const token of ["const ARCHIVE_WRITES=new Map<string,Promise<void>>()","then(async()=>{await mirrorStore(locationKey,store)})","async function mirrorStore(locationKey:string,store:Store)"])if(!source.includes(token))failures.push(`forecastVerification fehlt: ${token}`);
if(source.includes('then(()=>mirrorStore(locationKey,store))'))failures.push('Boolean-Promise darf nicht mehr direkt in die Promise<void>-Queue propagiert werden.');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID Wetterzwilling-Queue-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: Promise<void>-kompatible Wetterzwilling-Archivqueue geprüft.');
