import {readFile,writeFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const version=String(pkg.version||'').trim();
if(!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version))throw new Error(`Ungültige Paketversion: ${version}`);

await writeFile(new URL('../src/version.ts',import.meta.url),`export const MID_VERSION='${version}';\n`);
await writeFile(new URL('../public/version.json',import.meta.url),`${JSON.stringify({version},null,2)}\n`);

for(const relative of['../public/service-worker.js','../public/sw.js']){
 const url=new URL(relative,import.meta.url),source=await readFile(url,'utf8');
 const updated=source.replace(/const MID_VERSION='[^']+';/,`const MID_VERSION='${version}';`);
 if(updated===source&&!source.includes(`const MID_VERSION='${version}';`))throw new Error(`${relative}: MID_VERSION konnte nicht synchronisiert werden.`);
 await writeFile(url,updated);
}

const workerUrl=new URL('../worker/metar-proxy.js',import.meta.url);
const worker=await readFile(workerUrl,'utf8');
const updated=worker.replace(/const WORKER_VERSION='[^']+';/,`const WORKER_VERSION='${version}';`);
if(updated===worker&&!worker.includes(`const WORKER_VERSION='${version}';`))throw new Error('WORKER_VERSION konnte nicht synchronisiert werden.');
await writeFile(workerUrl,updated);
