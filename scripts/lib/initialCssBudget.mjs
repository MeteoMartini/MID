/** Built HTML, not an asset filename heuristic, defines startup-blocking CSS. */
export function initialCssAssetStats(html,assets){
 const byName=new Map(assets.filter(item=>item.extension==='.css').map(item=>[item.file.replaceAll('\\','/'),item]));
 const entries=[],seen=new Set();
 for(const tag of html.match(/<link\b[^>]*>/gi)||[]){
  const rel=tag.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  if(!(rel?.[1]??rel?.[2]??'').toLowerCase().split(/\s+/).includes('stylesheet'))continue;
  const href=tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i),url=href?.[1]??href?.[2];
  if(!url)throw new Error('Initiales Stylesheet ohne href im Produktions-HTML.');
  if(/^(?:https?:)?\/\//i.test(url)||url.startsWith('data:'))throw new Error('Externes oder eingebettetes Start-CSS liegt außerhalb des MID-Assetbudgets: '+url);
  // WHATWG URL parsing normalizes literal AND encoded dot segments first.
  // Validate the decoded input path before normalization to avoid accepting
  // disguised ../ traversals as legitimate startup CSS budget entries.
  let decodedInputPath;
  try{decodedInputPath=decodeURIComponent(url.split(/[?#]/,1)[0]);}
  catch{throw new Error('Ungültige Kodierung im initialen CSS-Pfad: '+url);}
  if(/%(?:2f|5c)/i.test(url)||decodedInputPath.includes('\\')||
    decodedInputPath.split('/').some((segment,index)=>segment==='..'||(segment==='.'&&index>0))){
   throw new Error('Unsicherer initialer CSS-Pfad: '+url);
  }
  const parsed=new URL(url,'https://mid-local.invalid/'),name=decodeURIComponent(parsed.pathname).replace(/^\/+/,''),entry=byName.get(name);
  if(!entry)throw new Error('Initiales CSS-Asset fehlt im Produktionsbuild: '+name);
  if(seen.has(name))continue;
  seen.add(name);entries.push({file:name,bytes:entry.bytes,gzipBytes:entry.gzipBytes,brotliBytes:entry.brotliBytes});
 }
 if(!entries.length)throw new Error('Produktions-HTML enthält kein auswertbares initiales Stylesheet.');
 return {entries,bytes:entries.reduce((sum,item)=>sum+item.bytes,0),gzipBytes:entries.reduce((sum,item)=>sum+item.gzipBytes,0),brotliBytes:entries.reduce((sum,item)=>sum+item.brotliBytes,0)};
}
