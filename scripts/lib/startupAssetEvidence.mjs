/**
 * Static launch-reference inventory. This measures only assets declared by HTML,
 * never browser transfer, module execution, retained memory or render latency.
 * Keep this separate from the mandatory total-asset budget.
 */
import {initialCssAssetStats} from './initialCssBudget.mjs';

function attributes(tag){
 const result=new Map();
 for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)){
  result.set(match[1].toLowerCase(),match[2]??match[3]);
 }
 return result;
}
function localAsset(url){
 if(!url||/^(?:[a-z]+:)?\/\//i.test(url)||url.startsWith('data:')||url.startsWith('#')){
  throw Error('Startup asset must have a local, nonempty URL');
 }
 // A base-relative URL is safe; parent-relative traversal and encoded path
 // separators are not valid generated Vite asset references for MID.
 if(/%(?:2f|5c)/i.test(url)||url.includes('\\'))throw Error('Invalid startup asset path');
 const rawSegments=url.split(/[?#]/,1)[0].split('/');
 if(rawSegments.includes('..'))throw Error('Unsafe startup asset path');
 const parsed=new URL(url,'https://mid-local.invalid/');
 const decoded=decodeURIComponent(parsed.pathname);
 const segments=decoded.split('/').filter(Boolean);
 if(segments.includes('..')||segments.includes('.'))throw Error('Unsafe startup asset path');
 return segments.join('/');
}
export function startupAssetEvidence(html,assets){
 if(typeof html!=='string'||!Array.isArray(assets))throw TypeError('HTML and asset inventory required');
 const css=initialCssAssetStats(html,assets);
 const byName=new Map(assets.filter(a=>a.extension==='.js').map(a=>[a.file.replaceAll('\\','/'),a]));
 const references=new Map();let hasModuleScript=false;
 const include=(url,kind)=>{
  const name=localAsset(url),entry=byName.get(name);
  if(!entry)throw Error('Startup JavaScript missing from build: '+name);
  if(!references.has(name))references.set(name,{file:name,kind,bytes:entry.bytes,gzipBytes:entry.gzipBytes});
 };
 for(const tag of html.match(/<(?:script|link)\b[^>]*>/gi)||[]){
  const a=attributes(tag),isScript=/^<script\b/i.test(tag);
  if(isScript){
   // Inline boot scripts and nonmodule fallbacks are not part of the module graph.
   if(a.get('type')==='module'&&a.has('src')){hasModuleScript=true;include(a.get('src'),'module-script');}
  }else if((a.get('rel')??'').toLowerCase().split(/\s+/).includes('modulepreload')){
   if(!a.has('href'))throw Error('modulepreload without href');
   include(a.get('href'),'modulepreload');
  }
 }
 if(!hasModuleScript){
  throw Error('Production HTML has no initial module entry script');
 }
 const js=[...references.values()];
 return {
  schema:'mid.static-startup-assets.v1',
  scope:'HTML-referenced startup assets; no transitive import graph, network or heap measurement',
  js:{entries:js,bytes:js.reduce((s,a)=>s+a.bytes,0),gzipBytes:js.reduce((s,a)=>s+a.gzipBytes,0)},
  css,
 };
}
