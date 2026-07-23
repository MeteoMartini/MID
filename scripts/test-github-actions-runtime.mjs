import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workflowsDir=path.join(root,'.github','workflows');
const files=(await readdir(workflowsDir)).filter(name=>/\.ya?ml$/i.test(name));
const failures=[];
for(const name of files){
  const source=await readFile(path.join(workflowsDir,name),'utf8');
  if(/actions\/(?:checkout|setup-node)@v[1-4]\b/.test(source))failures.push(`${name}: veraltete Node-20-Action gefunden`);
}
for(const required of ['actions/checkout@v6','actions/setup-node@v6']){
  if(!(await Promise.all(files.map(async name=>(await readFile(path.join(workflowsDir,name),'utf8')).includes(required)))).some(Boolean))failures.push(`${required} fehlt`);
}
if(failures.length){console.error('GitHub-Actions-Runtime-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('GitHub-Actions-Runtime geprüft: Checkout und Setup Node verwenden Node-24-kompatible v6-Actions.');
