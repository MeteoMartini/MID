import {readFile,writeFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const version=String(pkg.version||'').trim();
if(!/^\d+\.\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/.test(version))throw new Error(`Ungültige Paketversion: ${version}`);

await writeFile(new URL('../src/version.ts',import.meta.url),`export const MID_VERSION='${version}';\n`);
await writeFile(new URL('../public/version.json',import.meta.url),`${JSON.stringify({version},null,2)}\n`);
const indexUrl=new URL('../index.html',import.meta.url);
const indexHtml=await readFile(indexUrl,'utf8');
const nextIndexHtml=indexHtml.replace(/<meta name="mid-version" content="[^"]+">/,`<meta name="mid-version" content="${version}">`);
if(nextIndexHtml===indexHtml&&!indexHtml.includes(`<meta name="mid-version" content="${version}">`))throw new Error('index.html: MID-Releaseversion konnte nicht synchronisiert werden.');
await writeFile(indexUrl,nextIndexHtml);
const lockUrl=new URL('../package-lock.json',import.meta.url);
const lock=JSON.parse(await readFile(lockUrl,'utf8'));
lock.version=version;
if(lock.packages?.['']){
 lock.packages[''].version=version;
 lock.packages[''].dependencies={...(pkg.dependencies??{})};
 lock.packages[''].devDependencies={...(pkg.devDependencies??{})};
 if(pkg.engines)lock.packages[''].engines={...pkg.engines};else delete lock.packages[''].engines;
}
await writeFile(lockUrl,`${JSON.stringify(lock,null,2)}\n`);
const baselineUrl=new URL('../MID_BASELINE.json',import.meta.url);
const baseline=JSON.parse(await readFile(baselineUrl,'utf8'));
baseline.releaseVersion=version;
await writeFile(baselineUrl,`${JSON.stringify(baseline,null,2)}\n`);
const workerUrl=new URL('../worker/metar-proxy.js',import.meta.url);
const worker=await readFile(workerUrl,'utf8');
const updated=worker.replace(/const WORKER_VERSION='[^']+';/,`const WORKER_VERSION='${version}';`);
if(updated===worker&&!worker.includes(`const WORKER_VERSION='${version}';`))throw new Error('WORKER_VERSION konnte nicht synchronisiert werden.');
await writeFile(workerUrl,updated);

for(const relativePath of ['../public/service-worker.js','../public/sw.js']){
 const serviceWorkerUrl=new URL(relativePath,import.meta.url);
 const serviceWorker=await readFile(serviceWorkerUrl,'utf8');
 const nextServiceWorker=serviceWorker.replace(/const CACHE='mid-shell-v[^']+';/,`const CACHE='mid-shell-v${version}';`);
 if(nextServiceWorker===serviceWorker&&!serviceWorker.includes(`const CACHE='mid-shell-v${version}';`))throw new Error(`${relativePath}: Service-Worker-Cacheversion konnte nicht synchronisiert werden.`);
 await writeFile(serviceWorkerUrl,nextServiceWorker);
}
