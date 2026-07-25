import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const current=(await readdir(path.join(root,'scripts'))).filter(name=>/^test-.*\.mjs$/i.test(name)).sort();
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const runner=await readFile(path.join(root,'scripts','run-regressions.mjs'),'utf8');
const failures=[];
if(!String(pkg.scripts?.verify||'').includes('node scripts/run-regressions.mjs'))failures.push('verify verwendet nicht den automatischen Regressionstest-Runner.');
for(const token of ["/^test-.*\\.mjs$/i",'tests.length','spawnSync(process.execPath'])if(!runner.includes(token))failures.push(`Automatischer Runner unvollständig: ${token}`);

function git(args){const result=spawnSync('git',args,{cwd:root,encoding:'utf8'});return result.status===0?String(result.stdout||'').trim():''}
if(git(['rev-parse','--is-inside-work-tree'])==='true'){
 let baseline='HEAD';
 try{const headPkg=JSON.parse(git(['show','HEAD:package.json'])||'{}');if(headPkg.version===pkg.version&&git(['rev-parse','HEAD^']))baseline='HEAD^'}catch{}
 const names=git(['ls-tree','-r','--name-only',baseline,'scripts']).split(/\r?\n/).filter(Boolean).map(value=>path.basename(value)).filter(name=>/^test-.*\.mjs$/i.test(name));
 for(const name of names)if(!current.includes(name))failures.push(`Bereits geschützter Regressionstest wurde entfernt: ${name}`);
}
if(current.length<50)failures.push(`Unerwartet wenige geschützte Tests: ${current.length}`);
if(failures.length){console.error('Automatischer MID-Funktionsschutz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Funktionskontinuität geprüft: ${current.length} aktuelle und künftig neu hinzukommende test-*.mjs-Dateien werden automatisch geschützt; bestehende Tests dürfen nicht verschwinden.`);
