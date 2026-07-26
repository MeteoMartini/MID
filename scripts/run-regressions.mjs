import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),directory=path.join(root,'scripts');
const tests=(await readdir(directory)).filter(name=>/^test-.*\.mjs$/i.test(name)).sort();
const failures=[];
for(const name of tests){const result=spawnSync(process.execPath,[path.join(directory,name)],{cwd:root,stdio:'inherit',env:process.env});if(result.status!==0)failures.push(name)}
if(failures.length){console.error(`\n${failures.length} von ${tests.length} Regressionstests fehlgeschlagen: ${failures.join(', ')}`);process.exit(1)}
console.log(`\nAlle ${tests.length} automatisch erkannten MID-Regressionstests bestanden.`);
