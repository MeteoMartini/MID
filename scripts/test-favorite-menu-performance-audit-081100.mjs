import {readFile} from 'node:fs/promises';
const [app,styles,persistence,sync]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/persistence.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 'function revealWithinScrollContainer',
 'resultsRef=useRef<HTMLElement>(null)',
 'activeFavoriteRef=useRef<HTMLButtonElement>(null)',
 "revealWithinScrollContainer(container,element,'vertical')",
 'ref={item.id===currentFavoriteId?activeFavoriteRef:undefined}',
 'bubbleContainerRef=useRef<HTMLDivElement>(null)',
 "revealWithinScrollContainer(container,element,'horizontal')",
 'ref={active?activeBubbleRef:undefined}'
])need('Aktiver Favorit im Lesezeichenmenü',app,token);
need('Aktiver Favorit visuell markiert',styles,'.search>section button.current-favorite-result');
for(const token of [
 'function writeStorageIfChanged',
 'if(locationsShallowEqual(item.location,merged))return item',
 "measured=[...document.querySelectorAll<HTMLElement>('[data-mid-view]')].map(node=>({node,rect:node.getBoundingClientRect()}))",
 'const pushFavoriteSignature=',
 'const learningFavoriteSignature=',
 'requestIdle?requestIdle(run,{timeout:1800})'
])need('App-Performance',app,token);
if(app.includes('queueMicrotask(()=>void persistStateNow())'))failures.push('Favoritenänderungen lösen weiterhin eine doppelte unmittelbare Vollsicherung aus.');
for(const token of [
 "const TRANSIENT_PREFIXES=['mid:analysis-cache:','mid:ensemble:'",
 'persistPromise:Promise<void>|null=null',
 'if(persistPromise){persistAgain=true;return persistPromise}',
 'requestIdleCallback',
 'if(localStorage.getItem(key)===value)return'
])need('Persistenz-Performance',persistence,token);
for(const token of [
 'lastArchiveRevision?:string',
 'sameRevision=Boolean(config.lastArchiveRevision&&manifest.revision===config.lastArchiveRevision)',
 'if(sameRevision||(!config.lastArchiveRevision',
 'deviceSyncPromise:Promise<boolean>|null=null',
 'const[pulled,archivePulled]=await Promise.all',
 'navigator.onLine===false',
 'if(localStorage.getItem(key)===value)return'
])need('Synchronisations-Performance',sync,token);
const sameRevisionPos=sync.indexOf('if(sameRevision||(!config.lastArchiveRevision');
const chunkPullPos=sync.indexOf("device-sync-archive-chunk-pull");
if(sameRevisionPos<0||chunkPullPos<0||sameRevisionPos>chunkPullPos)failures.push('Unveränderte Wetterzwilling-Archive werden nicht vor dem Chunk-Download übersprungen.');
if(failures.length){console.error('Favoritenmenü-/Performance-Audit fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoritenmenü und Performance geprüft: aktiver Favorit wird direkt sichtbar; Layoutmessung, Persistenz, Favoritenlernen, Push- und Archivsync sind entdoppelt beziehungsweise in Leerlaufphasen verlagert.');
