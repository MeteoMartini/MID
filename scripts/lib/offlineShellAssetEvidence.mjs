/**
 * MID Design 1.3 – read-only inventory of Vite-generated rel=mid-offline links.
 * This is a declared-install-cache inventory, NOT a measured browser startup
 * transfer or a proven Service Worker cache population. No Data => error.
 */
export function offlineShellAssetEvidence(html,assets,startup){
 if(typeof html!=='string'||!Array.isArray(assets)||!Array.isArray(startup?.js?.entries)||!Array.isArray(startup?.css?.entries)){
  throw TypeError('HTML, asset inventory and verified startup references required');
 }
 const byName=new Map();
 for(const asset of assets){
  if(asset.extension!=='.js'&&asset.extension!=='.css')continue;
  const name=asset.file?.replaceAll('\\','/');
  if(typeof name!=='string'||byName.has(name)||!Number.isSafeInteger(asset.bytes)||asset.bytes<0||
    !Number.isSafeInteger(asset.gzipBytes)||asset.gzipBytes<0||
    (asset.extension==='.css'&&(!Number.isSafeInteger(asset.brotliBytes)||asset.brotliBytes<0))){
   throw Error('Malformed or duplicated offline-shell asset inventory: '+name);
  }
  byName.set(name,asset);
 }
 const startupPaths=new Set([...startup.js.entries,...startup.css.entries].map(asset=>asset.file));
 const offline=new Map();
 let declarations=0;
 for(const tag of html.match(/<link\b[^>]*>/gi)??[]){
  const attrs=new Map();
  for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)){
   attrs.set(match[1].toLowerCase(),match[2]??match[3]);
  }
  if(!(attrs.get('rel')??'').toLowerCase().split(/\s+/).includes('mid-offline'))continue;
  declarations++;
  const href=attrs.get('href');
  if(!href||/^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(href)||href.includes('\\')||/%(?:2f|5c)/i.test(href)){
   throw Error('Offline-shell link must have a safe local href');
  }
  const rawPath=href.split(/[?#]/,1)[0];
  let decoded;
  try{decoded=decodeURIComponent(rawPath);}
  catch{throw Error('Invalid offline-shell asset URL encoding');}
  const segments=decoded.split('/');
  if(!decoded.startsWith('./assets/')||segments.some((segment,index)=>index>0&&(segment==='.'||segment==='..'))){
   throw Error('Unsafe offline-shell path before URL normalization');
  }
  const file=decoded.slice(2);
  const asset=byName.get(file);
  if(!asset||!(file.endsWith('.js')||file.endsWith('.css'))){
   throw Error('Offline-shell asset missing from complete build: '+file);
  }
  offline.set(file,{file,extension:asset.extension,bytes:asset.bytes,gzipBytes:asset.gzipBytes,
   ...(asset.extension==='.css'?{brotliBytes:asset.brotliBytes}:{})});
 }
 if(!declarations||!offline.size)throw Error('No offline-shell references in production HTML');
 const entries=[...offline.values()].sort((a,b)=>a.file.localeCompare(b.file));
 const aggregate=list=>({
  fileCount:list.length,
  bytes:list.reduce((n,a)=>n+a.bytes,0),
  gzipBytes:list.reduce((n,a)=>n+a.gzipBytes,0),
  jsFiles:list.filter(a=>a.extension==='.js').length,
  cssFiles:list.filter(a=>a.extension==='.css').length,
  cssBrotliBytes:list.filter(a=>a.extension==='.css').reduce((n,a)=>n+a.brotliBytes,0),
 });
 const shared=entries.filter(a=>startupPaths.has(a.file));
 const deferred=entries.filter(a=>!startupPaths.has(a.file));
 return {
  schema:'mid.offline-shell-asset-evidence.v1',
  scope:'Declared rel=mid-offline build assets; not startup requests, service-worker fetch proof or measured network transfer',
  declarations,entries,
  total:aggregate(entries),
  sharedWithHtmlStartup:{...aggregate(shared),entries:shared},
  offlineOnly:{...aggregate(deferred),entries:deferred},
 };
}
