import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scriptsDir=path.join(root,'scripts');
const tests=(await readdir(scriptsDir)).filter(name=>/^test-.*\.mjs$/i.test(name)).sort((a,b)=>a.localeCompare(b,'de'));
if(!tests.length){console.error('Keine Regressionstests gefunden.');process.exit(1)}
console.log(`Automatischer MID-Funktionsschutz: ${tests.length} Regressionstests werden ausgeführt.`);
for(const [index,name] of tests.entries()){
 console.log(`\n[${index+1}/${tests.length}] ${name}`);
 const result=spawnSync(process.execPath,[path.join(scriptsDir,name)],{cwd:root,stdio:'inherit',env:process.env,timeout:180000});
 if(result.error){console.error(`${name}: ${result.error.message}`);process.exit(1)}
 if(result.status!==0)process.exit(result.status??1);
}
console.log(`\nAlle ${tests.length} automatisch erkannten MID-Regressionstests bestanden.`);
