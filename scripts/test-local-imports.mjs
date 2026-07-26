import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),src=path.join(root,'src'),failures=[];
const files=(await readdir(src)).filter(name=>/\.(?:ts|tsx)$/.test(name));
for(const name of files){const file=path.join(src,name),text=await readFile(file,'utf8');for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)){const spec=match[1],base=path.resolve(path.dirname(file),spec),candidates=[base,`${base}.ts`,`${base}.tsx`,path.join(base,'index.ts'),path.join(base,'index.tsx')];let found=false;for(const candidate of candidates)try{if((await stat(candidate)).isFile()){found=true;break}}catch{}if(!found)failures.push(`${name}: ${spec}`)}}
if(failures.length){console.error('Fehlende lokale Importziele:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Lokale Importprüfung bestanden: ${files.length} TypeScript-Dateien besitzen vollständige relative Importziele.`);
