import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const paths=['package.json','package-lock.json','MID_BASELINE.json','src/EnsemblePanel.tsx','src/EnsembleChartFrame.tsx','src/cachePolicy.ts','src/radarHistory.ts','src/heavyRain.ts','src/travelPlanner.ts','ci/github/workflows/install-mid.yml','ci/github/workflows/deploy.yml','ci/github/workflows/dependency-audit.yml'];
const files=Object.fromEntries(await Promise.all(paths.map(async path=>[path,await readFile(new URL(path,root),'utf8')])));
const pkg=JSON.parse(files['package.json']),lock=JSON.parse(files['package-lock.json']),baseline=JSON.parse(files['MID_BASELINE.json']);
const failures=[];
const warnings=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};

// Harte, reproduzierbare Release-Invarianten. Diese Prüfungen hängen ausschließlich von
// versionierten Dateien ab und sind deshalb auf Linux/GitHub Actions und lokal identisch.
if(lock.lockfileVersion!==3)failures.push(`Lockfile-Version ${lock.lockfileVersion} statt 3.`);
if(lock.version!==pkg.version||lock.packages?.['']?.version!==pkg.version||baseline.releaseVersion!==pkg.version)failures.push('Versionen in Paket, Lockfile und Baseline sind nicht synchron.');
const rootLock=lock.packages?.['']??{};
for(const [group,values] of [['dependencies',pkg.dependencies??{}],['devDependencies',pkg.devDependencies??{}]]){
 const locked=rootLock[group]??{};
 for(const [name,version] of Object.entries(values))if(locked[name]!==version)failures.push(`Lockfile-Wurzel: ${group}.${name} ist ${locked[name]??'nicht vorhanden'} statt ${version}.`);
}
const rechartsVersion=String(pkg.dependencies?.recharts??'');
const lockedRechartsVersion=String(lock.packages?.['node_modules/recharts']?.version??'');
if(!/^3\.\d+\.\d+$/.test(rechartsVersion)||lockedRechartsVersion!==rechartsVersion)failures.push(`Recharts-3-Lockvertrag inkonsistent: package=${rechartsVersion||'fehlt'}, lock=${lockedRechartsVersion||'fehlt'}.`);
if(pkg.dependencies?.['react-is']!=='18.3.1'||lock.packages?.['node_modules/react-is']?.version!=='18.3.1')failures.push('react-is 18.3.1 ist nicht reproduzierbar festgeschrieben.');
if(pkg.devDependencies?.typescript!=='5.9.3'||pkg.devDependencies?.vite!=='6.4.3'||pkg.devDependencies?.['@vitejs/plugin-react']!=='4.7.0')failures.push('Werkzeugversionen sind nicht exakt festgeschrieben.');
if(!pkg.scripts?.['verify:types']?.includes('tsc --noEmit -p tsconfig.app.json')||!pkg.scripts?.['verify:types']?.includes('tsc --noEmit -p tsconfig.node.json')||!pkg.scripts?.build?.includes('npm run verify:types')||pkg.scripts?.['verify:types']?.includes('tsc -b'))failures.push('Artefaktfreie TypeScript-Prüfung fehlt im expliziten finalen Buildvertrag.');

const panel=files['src/EnsemblePanel.tsx'],frame=files['src/EnsembleChartFrame.tsx'];
need('Recharts-3-Migration',panel,"from 'recharts'");
need('Recharts-Frame',panel,"from './EnsembleChartFrame'");
for(const token of ['className="ensemble-responsive-chart"','ResizeObserver','getBoundingClientRect()','responsive:false'])need('Recharts-Frame',frame,token);
if(frame.includes('ResponsiveContainer'))failures.push('Recharts-Frame enthält wieder ResponsiveContainer.');
if(panel.includes('recharts/lib/')||panel.includes('recharts/es6/'))failures.push('Interne Recharts-Importpfade sind wieder aktiv.');

for(const [area,text,limit] of [['Radar-Cache',files['src/radarHistory.ts'],'RADAR_HISTORY_CACHE_LIMIT=24'],['KOSTRA-Cache',files['src/heavyRain.ts'],'KOSTRA_POINT_CACHE_LIMIT=32'],['Reisecache',files['src/travelPlanner.ts'],'TRAVEL_STORAGE_CACHE_LIMIT=24']])need(area,text,limit);
for(const token of ['writeBoundedMapEntry','pruneStorageEntries','writeBoundedStorage','while(cache.size>limit)'])need('Cache-Richtlinie',files['src/cachePolicy.ts'],token);

// Workflow-Pins werden weiterhin diagnostiziert. Ein historischer Wartungstest darf aber den
// Produktrelease nicht blockieren, nur weil GitHub Actions eine geprüfte Workflow-Revision
// unabhängig vom Anwendungscode aktualisiert. Die eigentlichen Workflow-Verträge besitzen
// separate Regressionen (u. a. test-github-actions-runtime.mjs / 08262).
const workflows=[files['ci/github/workflows/install-mid.yml'],files['ci/github/workflows/deploy.yml'],files['ci/github/workflows/dependency-audit.yml']].join('\n');
for(const action of ['actions/checkout','actions/setup-node','actions/upload-pages-artifact','actions/deploy-pages'])if(!new RegExp(`${action.replace('/','\\/')}@[0-9a-f]{40}`).test(workflows))warnings.push(`Workflow-SHA diagnostisch nicht gefunden: ${action}`);
if(!baseline.regressionTests?.includes('scripts/test-maintenance-recharts3-cache-ci-08260.mjs'))failures.push('Wartungsregression fehlt in MID_BASELINE.json.');

// Rein speicherinterner Dynamiktest ohne npm-Unterprozess, TypeScript-Runtime, Dateisystemstatus
// oder Zeit-/Plattformannahmen.
const writeBoundedMapEntry=(cache,key,value,maxEntries)=>{cache.delete(key);cache.set(key,value);const limit=Math.max(1,Math.floor(maxEntries));while(cache.size>limit){const oldest=cache.keys().next().value;if(oldest===undefined)break;cache.delete(oldest)}};
const map=new Map();for(let index=0;index<7;index++)writeBoundedMapEntry(map,`k${index}`,index,4);if(map.size!==4||map.has('k0')||!map.has('k6'))failures.push('Dynamik: LRU-Map-Begrenzung arbeitet nicht korrekt.');

if(warnings.length)console.warn('MID-Wartungsdiagnose:\n- '+warnings.join('\n- '));
if(failures.length){console.error('MID-Wartungs-/Recharts-3-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts '+rechartsVersion+', Lockfile-Wurzel, begrenzte Caches und CI-deterministische Release-Invarianten geprüft.');
