import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const failures=[];
function git(args){const result=spawnSync('git',args,{cwd:root,encoding:'utf8'});return result.status===0?String(result.stdout||'').trim():''}
function baselineRef(){if(git(['rev-parse','--is-inside-work-tree'])!=='true')return'';let ref='HEAD';try{const head=JSON.parse(git(['show','HEAD:package.json'])||'{}');if(head.version===pkg.version&&git(['rev-parse','HEAD^']))ref='HEAD^'}catch{}return ref}
function meaningfulDiff(ref,file,ignoredPatterns=[]){const diff=git(['diff','--unified=0',ref,'--',file]);if(!diff)return false;return diff.split(/\r?\n/).some(line=>{
 if(!/^[+-](?![+-])/.test(line))return false;
 const text=line.slice(1).trim();
 return !ignoredPatterns.some(pattern=>pattern.test(text));
 })}
const ref=baselineRef();
if(ref){
 const changed=git(['diff','--name-only',ref,'--','src','worker','public']).split(/\r?\n/).filter(Boolean);
 const functional=changed.filter(file=>{
  if(file==='src/version.ts'||file==='public/version.json')return false;
  if(file==='worker/metar-proxy.js')return meaningfulDiff(ref,file,[/^const WORKER_VERSION=/]);
  if(file==='public/service-worker.js'||file==='public/sw.js')return meaningfulDiff(ref,file,[/^const CACHE='mid-shell-v/]);
  return true;
 });
 const modifiedTests=git(['diff','--name-only',ref,'--','scripts']).split(/\r?\n/).filter(name=>/^scripts\/test-.*\.mjs$/i.test(name));
 const untrackedTests=git(['ls-files','--others','--exclude-standard','--','scripts/test-*.mjs']).split(/\r?\n/).filter(name=>/^scripts\/test-.*\.mjs$/i.test(name));
 const changedTests=[...new Set([...modifiedTests,...untrackedTests])];
 if(functional.length&&!changedTests.length)failures.push(`Funktionscode geändert, aber kein Regressionstest ergänzt oder angepasst: ${functional.join(', ')}`);
}
if(failures.length){console.error('Automatische Testabdeckung neuer Funktionen fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Änderungsabdeckung geprüft: funktionale Quellcodeänderungen benötigen automatisch mindestens einen neuen oder angepassten Regressionstest.');
