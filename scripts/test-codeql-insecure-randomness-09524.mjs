import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const productionRoots=[path.join(root,'src'),path.join(root,'worker')];
const sourceExtensions=new Set(['.ts','.tsx','.js','.mjs','.cjs']);
const offenders=[];

async function scan(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const full=path.join(directory,entry.name);
  if(entry.isDirectory()){await scan(full);continue}
  if(!sourceExtensions.has(path.extname(entry.name)))continue;
  const source=await readFile(full,'utf8');
  if(/\bMath\.random\s*\(/.test(source))offenders.push(path.relative(root,full));
 }
}
for(const directory of productionRoots)await scan(directory);
if(offenders.length)throw new Error(`Unsichere Math.random()-Nutzung im Produktionscode: ${offenders.join(', ')}`);

const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
if(!/function favoriteId\(\)/.test(app)||!/crypto\.randomUUID\(\)/.test(app)||!/crypto\.getRandomValues\(new Uint32Array\(4\)\)/.test(app))throw new Error('favoriteId() muss kryptografisch sichere Browser-Zufallsquellen verwenden.');
for(const relative of ['src/radarProjection.ts','src/seasonalForecast.ts']){
 const source=await readFile(path.join(root,relative),'utf8');
 if(/\bMath\.random\s*\(/.test(source))throw new Error(`${relative}: Math.random() darf nicht erneut eingeführt werden.`);
}
console.log('CodeQL-Schutz: keine Math.random()-Nutzung im Produktionscode; favoriteId() nutzt sichere Zufallsquellen.');
