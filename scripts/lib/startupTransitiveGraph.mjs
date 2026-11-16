/** Read-only, SHA-bound static ES-module closure of built Vite JavaScript.
 * Dynamic imports are separately reported and NEVER counted as eager assets.
 * This is not a network waterfall, CSSOM, browser execution or heap profile.
 */
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import ts from 'typescript-strada';

const SHA256=/^[a-f0-9]{64}$/;
function validPath(file){
 if(typeof file!=='string'||!file||file.includes('\\')||file.includes('?')||file.includes('#')||file.includes('\0')||
    file.startsWith('/')||file.split('/').some(part=>!part||part==='.'||part==='..')||!file.endsWith('.js')){
  throw Error('Invalid built JS path: '+String(file));
 }
 return file;
}
function targetPath(from,specifier){
 if(typeof specifier!=='string'||!specifier.startsWith('.')||specifier.includes('\\')||specifier.includes('?')||specifier.includes('#')||specifier.includes('\0')){
  throw Error('Unsupported or external static JS import: '+String(specifier)+' in '+from);
 }
 const target=posix.normalize(posix.join(posix.dirname(from),specifier));
 if(target==='..'||target.startsWith('../')||target.startsWith('/')||!target.endsWith('.js')){
  throw Error('Static JS import escapes assets or has unexpected extension: '+specifier+' in '+from);
 }
 return validPath(target);
}
function importsIn(file,source){
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.ESNext,true,ts.ScriptKind.JS);
 if(ast.parseDiagnostics.length)throw Error('Malformed built JavaScript: '+file+' '+ts.flattenDiagnosticMessageText(ast.parseDiagnostics[0].messageText,' '));
 const staticSpecifiers=[],dynamicSpecifiers=[];
 function visit(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){
   if(!ts.isStringLiteralLike(node.moduleSpecifier))throw Error('Nonliteral static module import: '+file);
   staticSpecifiers.push(node.moduleSpecifier.text);
  }else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
   dynamicSpecifiers.push(node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0])?node.arguments[0].text:null);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 return {staticSpecifiers,dynamicSpecifiers};
}

export function startupTransitiveGraph(bootstrap,assets){
 if(bootstrap?.schema!=='mid.static-startup-assets.v1'||!Array.isArray(bootstrap.js?.entries)||!bootstrap.js.entries.length||!Array.isArray(assets)){
  throw Error('Complete HTML startup evidence and built JS assets required');
 }
 const byPath=new Map();
 for(const asset of assets){
  const file=validPath(asset.file);
  if(byPath.has(file))throw Error('Duplicate built JS file: '+file);
  if(typeof asset.source!=='string'||!SHA256.test(asset.sha256??'')||
    !Number.isSafeInteger(asset.bytes)||asset.bytes<1||
    !Number.isSafeInteger(asset.gzipBytes)||asset.gzipBytes<1){
   throw Error('Incomplete built JS bytes, SHA or size: '+file);
  }
  const byteLength=Buffer.byteLength(asset.source);
  const actualSha=createHash('sha256').update(asset.source).digest('hex');
  if(byteLength!==asset.bytes||actualSha!==asset.sha256){
   throw Error('Built JS source fingerprint mismatch: '+file);
  }
  byPath.set(file,asset);
 }
 const htmlEntries=new Set();
 for(const entry of bootstrap.js.entries){
  const file=validPath(entry.file),asset=byPath.get(file);
  if(!asset)throw Error('HTML startup JS not present in inventory: '+file);
  if(entry.bytes!==asset.bytes||entry.gzipBytes!==asset.gzipBytes)throw Error('HTML startup JS size mismatch: '+file);
  htmlEntries.add(file);
 }
 const visiting=new Set(),visited=new Set(),dynamic=[];
 function collect(file){
  if(visited.has(file)||visiting.has(file))return;
  visiting.add(file);
  const item=byPath.get(file);
  if(!item)throw Error('Static JS dependency missing from verified build: '+file);
  const deps=importsIn(file,item.source);
  for(const name of deps.staticSpecifiers){
   const next=targetPath(file,name);
   if(!byPath.has(next))throw Error('Static JS dependency missing from verified build: '+next);
   collect(next);
  }
  for(const specifier of deps.dynamicSpecifiers)dynamic.push({parent:file,specifier,kind:'excluded-dynamic-import'});
  visiting.delete(file);visited.add(file);
 }
 for(const entry of [...htmlEntries].sort())collect(entry);
 const entries=[...visited].sort().map(file=>{
  const {bytes,gzipBytes,sha256}=byPath.get(file);
  return {file,bytes,gzipBytes,sha256,htmlReferenced:htmlEntries.has(file)};
 });
 const sum=key=>entries.reduce((total,row)=>total+row[key],0);
 return {schema:'mid.static-transitive-startup-js.v1',
  scope:'SHA-checked static ES-module imports/exports reachable from HTML module scripts and modulepreloads; dynamic chunks excluded; no actual transfer, FCP/LCP/INP, execution or memory claim',
  htmlReferencedFiles:htmlEntries.size,staticClosureFiles:entries.length,
  additionalStaticFiles:entries.length-htmlEntries.size,
  staticClosureBytes:sum('bytes'),staticClosureGzipBytes:sum('gzipBytes'),
  dynamicImportCount:dynamic.length,excludedDynamicImports:dynamic,
  entries};
}
