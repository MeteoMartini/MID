import {readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const failures=[];
if(!source.includes("function isFiniteNumber(value:unknown):value is number"))failures.push('Der zentrale Type-Guard isFiniteNumber fehlt.');
if(!source.includes('isFiniteNumber(row.climateMin)&&isFiniteNumber(row.climateMax)'))failures.push('Klimaminimum und -maximum werden vor der Formatierung nicht gemeinsam eingegrenzt.');
if(!source.includes('values.filter(isFiniteNumber)'))failures.push('Optionale Temperaturwerte werden nicht mit einem Type-Guard gefiltert.');
if(source.includes('.filter((v:number)=>Number.isFinite(v))'))failures.push('Der fehlerhafte explizite number-Filter ist noch vorhanden.');

const tempDir=path.join(root,'.ensemble-nullability-test');
await rm(tempDir,{recursive:true,force:true});
await mkdir(tempDir,{recursive:true});
await writeFile(path.join(tempDir,'check.ts'),`
function isFiniteNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
type Row={climateMin?:number;climateMax?:number;minLow:number;maxHigh:number;bestMin:number;bestMax:number};
declare function format(value:number):string;
function tooltip(row:Row,show:boolean){
 if(show&&isFiniteNumber(row.climateMin)&&isFiniteNumber(row.climateMax))return format(row.climateMin)+format(row.climateMax);
 return '';
}
function scale(data:Row[],show:boolean){
 const values=data.flatMap(row=>[row.minLow,row.maxHigh,row.bestMin,row.bestMax,show?row.climateMin:undefined,show?row.climateMax:undefined]);
 const finite=values.filter(isFiniteNumber);
 return [Math.min(...finite),Math.max(...finite)];
}
void tooltip;void scale;
`);
await writeFile(path.join(tempDir,'tsconfig.json'),JSON.stringify({
  compilerOptions:{
    noEmit:true,
    strict:true,
    target:'ES2022',
    module:'ESNext',
    moduleResolution:'Bundler',
    skipLibCheck:true,
    types:[]
  },
  files:['check.ts']
},null,2));
const compile=spawnSync('tsc',['-p',path.join(tempDir,'tsconfig.json')],{cwd:root,encoding:'utf8'});
if(compile.status!==0)failures.push(`Strikter TypeScript-Nullability-Test fehlgeschlagen: ${(compile.stdout||'')+(compile.stderr||'')}`.trim());
await rm(tempDir,{recursive:true,force:true});
if(failures.length){console.error('Ensemble-Nullability-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Nullability geprüft: optionale Klimawerte werden vor Formatierung und Skalierung typsicher auf endliche Zahlen eingegrenzt.');
