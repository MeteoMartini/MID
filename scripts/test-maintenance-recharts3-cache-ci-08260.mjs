import {readFile,access,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const root=new URL('../',import.meta.url);
const paths=['package.json','package-lock.json','src/EnsemblePanel.tsx','src/EnsembleChartFrame.tsx','src/cachePolicy.ts','src/radarHistory.ts','src/heavyRain.ts','src/travelPlanner.ts','src/v078.ts','scripts/sync-version.mjs','ci/github/workflows/install-mid.yml','ci/github/workflows/deploy.yml','ci/github/workflows/dependency-audit.yml','ci/github/dependabot.yml','.gitignore','MID_BASELINE.json'];
const files=Object.fromEntries(await Promise.all(paths.map(async path=>[path,await readFile(new URL(path,root),'utf8')])));
const pkg=JSON.parse(files['package.json']),lock=JSON.parse(files['package-lock.json']),baseline=JSON.parse(files['MID_BASELINE.json']);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

if(lock.lockfileVersion!==3)failures.push(`Lockfile-Version ${lock.lockfileVersion} statt 3.`);
if(lock.version!==pkg.version||lock.packages?.['']?.version!==pkg.version||baseline.releaseVersion!==pkg.version)failures.push('Versionen in Paket, Lockfile und Baseline sind nicht synchron.');
const rootLock=lock.packages?.['']??{};
for(const [group,values] of [['dependencies',pkg.dependencies??{}],['devDependencies',pkg.devDependencies??{}]]){
 const locked=rootLock[group]??{};
 for(const [name,version] of Object.entries(values))if(locked[name]!==version)failures.push(`Lockfile-Wurzel: ${group}.${name} ist ${locked[name]??'nicht vorhanden'} statt ${version}.`);
 for(const name of Object.keys(locked))if(!(name in values))failures.push(`Lockfile-Wurzel: verwaister Eintrag ${group}.${name}.`);
}
for(const [name,entry] of Object.entries(lock.packages??{})){
 if(!entry||typeof entry!=='object'||!name)continue;
 const resolved=entry.resolved;
 if(typeof resolved==='string'){
  if(!/^https:\/\/(registry\.npmjs\.org|github\.com|codeload\.github\.com)\//i.test(resolved))failures.push(`Lockfile: nicht freigegebene Paketquelle bei ${name}: ${resolved}`);
  if(!entry.integrity&&!entry.link)failures.push(`Lockfile: Integritätswert fehlt bei ${name}.`);
 }
}
if(pkg.dependencies?.recharts!=='3.8.1'||lock.packages?.['node_modules/recharts']?.version!=='3.8.1')failures.push('Recharts 3.8.1 ist nicht reproduzierbar festgeschrieben.');
if(pkg.dependencies?.['react-is']!==pkg.dependencies?.react?.replace(/^\^/,''))failures.push('react-is entspricht nicht der React-Hauptinstallation.');
if(lock.packages?.['node_modules/react-is']?.version!=='18.3.1')failures.push('react-is 18.3.1 fehlt im Lockfile.');
for(const node of ['node_modules/@reduxjs/toolkit','node_modules/es-toolkit','node_modules/eventemitter3','node_modules/immer','node_modules/react-redux','node_modules/redux','node_modules/redux-thunk','node_modules/reselect','node_modules/use-sync-external-store','node_modules/victory-vendor'])if(!lock.packages?.[node])failures.push(`Lockfile: ${node} fehlt`);
if(pkg.devDependencies?.typescript!=='5.9.3'||pkg.devDependencies?.vite!=='6.4.3'||pkg.devDependencies?.['@vitejs/plugin-react']!=='4.7.0')failures.push('Sicherheits- und Werkzeugupdates sind nicht exakt festgeschrieben.');
if(pkg.packageManager!=='npm@10.9.2'||!pkg.engines?.node||!pkg.engines?.npm)failures.push('Node-/npm-Laufzeitvertrag fehlt.');
if(!pkg.scripts?.build?.includes('tsc --noEmit -p tsconfig.app.json')||pkg.scripts?.build?.includes('tsc -b'))failures.push('Der Build ist nicht auf eine artefaktfreie TypeScript-Prüfung umgestellt.');

const panel=files['src/EnsemblePanel.tsx'],frame=files['src/EnsembleChartFrame.tsx'];
need('Recharts-3-Migration',panel,"from 'recharts'");
if((panel.match(/<ComposedChart\b/g)||[]).length!==3)failures.push('Es sind nicht genau drei Ensemble-Diagramme vorhanden.');
if(panel.includes('accessibilityLayer'))failures.push('Die zusätzliche Recharts-Accessibility-DOM-Schicht ist wegen mobiler Scrolllast wieder aktiv.');
for(const token of ['className="ensemble-responsive-chart"','ResizeObserver','getBoundingClientRect()','cloneElement(children,{width,height,responsive:false','style={{height,minHeight}}','responsive:false'])need('Recharts-Frame',frame,token);forbid('Recharts-Frame',frame,'ResponsiveContainer');need('Recharts-Frame',panel,"from './EnsembleChartFrame'");
forbid('Recharts-3-Migration',panel,'recharts/lib/');forbid('Recharts-3-Migration',panel,'recharts/es6/');forbid('Recharts-3-Migration',panel,'activeIndex=');

for(const [area,text,limit] of [['Radar-Cache',files['src/radarHistory.ts'],'RADAR_HISTORY_CACHE_LIMIT=24'],['KOSTRA-Cache',files['src/heavyRain.ts'],'KOSTRA_POINT_CACHE_LIMIT=32'],['Reisecache',files['src/travelPlanner.ts'],'TRAVEL_STORAGE_CACHE_LIMIT=24']])need(area,text,limit);
for(const token of ['writeBoundedMapEntry','pruneStorageEntries','writeBoundedStorage'])need('Cache-Richtlinie',files['src/cachePolicy.ts'],token);
forbid('DOM-Performance',files['src/v078.ts'],'observe(document.documentElement');forbid('DOM-Performance',files['src/v078.ts'],'attributes:true');need('DOM-Performance',files['src/v078.ts'],"observe(next,{subtree:true,childList:true})");need('DOM-Performance',files['src/v078.ts'],'function mutationTouchesEnhancement(');need('DOM-Performance',files['src/v078.ts'],'scheduleEnhanceAfterResize');forbid('DOM-Performance',files['src/v078.ts'],'enhancementResizeObserver');

const workflows=[files['ci/github/workflows/install-mid.yml'],files['ci/github/workflows/deploy.yml'],files['ci/github/workflows/dependency-audit.yml']].join('\n');
for(const action of ['actions/checkout','actions/setup-node','actions/configure-pages','actions/upload-pages-artifact','actions/deploy-pages'])if(!new RegExp(`${action.replace('/','\\/')}@[0-9a-f]{40}`).test(workflows))failures.push(`Workflow-SHA fehlt: ${action}`);
forbid('Workflow-Sicherheit',workflows,'actions/checkout@v');forbid('Workflow-Sicherheit',workflows,'actions/setup-node@v');
need('Workflow-Audit',files['ci/github/workflows/install-mid.yml'],'npm run audit:dependencies');need('Workflow-Audit',files['ci/github/workflows/dependency-audit.yml'],'npm run audit:all');forbid('Workflow-Sicherheit',files['ci/github/workflows/install-mid.yml'],'Geprüfte MID-Workflows aktualisieren');need('Dependabot',files['ci/github/dependabot.yml'],'package-ecosystem: npm');need('Dependabot',files['ci/github/dependabot.yml'],'package-ecosystem: github-actions');
need('Versionssynchronisierung',files['scripts/sync-version.mjs'],"new URL('../package-lock.json'");need('Versionssynchronisierung',files['scripts/sync-version.mjs'],"lock.packages[''].version=version");
for(const token of ['*.tsbuildinfo','vite.config.js','vite.config.d.ts'])need('Release-Sauberkeit',files['.gitignore'],token);
for(const path of ['vite.config.js','vite.config.d.ts','tsconfig.app.tsbuildinfo','tsconfig.node.tsbuildinfo'])try{await access(new URL(path,root));failures.push(`Generierte Datei liegt weiterhin im Release: ${path}`)}catch{}
if(!baseline.regressionTests?.includes('scripts/test-maintenance-recharts3-cache-ci-08260.mjs'))failures.push('Wartungsregression fehlt in MID_BASELINE.json.');

const temp=await mkdtemp(join(tmpdir(),'mid-08260-'));
try{
 const cacheOut=ts.transpileModule(files['src/cachePolicy.ts'],{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'cachePolicy.ts'}).outputText;
 const cachePath=join(temp,'cachePolicy.mjs');await writeFile(cachePath,cacheOut);const cache=await import(`${pathToFileURL(cachePath).href}?v=${Date.now()}`);
 const map=new Map();for(let index=0;index<7;index++)cache.writeBoundedMapEntry(map,`k${index}`,index,4);
 if(map.size!==4||map.has('k0')||!map.has('k6'))failures.push('Dynamik: LRU-Map-Begrenzung arbeitet nicht korrekt.');
 class MemoryStorage{constructor(){this.data=new Map()}get length(){return this.data.size}key(index){return [...this.data.keys()][index]??null}getItem(key){return this.data.has(key)?this.data.get(key):null}setItem(key,value){this.data.set(key,String(value))}removeItem(key){this.data.delete(key)}clear(){this.data.clear()}}
 const storage=new MemoryStorage(),now=Date.now();for(let index=0;index<8;index++)storage.setItem(`mid:test:${index}`,JSON.stringify({createdAt:now-index*1000,value:index}));storage.setItem('mid:test:expired',JSON.stringify({createdAt:now-500000,value:99}));cache.pruneStorageEntries(storage,['mid:test:'],4,60000,now);
 if(storage.length!==4||storage.getItem('mid:test:expired')!==null)failures.push('Dynamik: Storage-Bereinigung/LRU-Begrenzung arbeitet nicht korrekt.');
}finally{await rm(temp,{recursive:true,force:true})}

if(failures.length){console.error('MID-Wartungs-/Recharts-3-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts 3.8.1, deterministisches Lockfile, begrenzte Caches, DOM-Performance, SHA-fixierte CI, Audits und Release-Sauberkeit geprüft.');
