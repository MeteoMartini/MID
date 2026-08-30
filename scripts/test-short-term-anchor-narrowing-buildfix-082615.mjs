import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript-strada');

const source=await readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const failures=[];
const token="function bridgeThermalValue(anchor:number|undefined,horizon:number|undefined,base:number,offsetMinutes:number){const start=Number(anchor),end=Number(horizon);";
if(!source.includes(token))failures.push('Die optionale hyperlokale Temperaturbrücke wird nicht vor Vergleichen in sichere number-Werte überführt.');
if(/return\s+horizon\s*>=\s*anchor/.test(source))failures.push('Optionales horizon/anchor wird weiterhin direkt verglichen und kann TS18048 auslösen.');

const helper=source.match(/function bridgeThermalValue\([^\n]+/u)?.[0];
if(!helper)failures.push('bridgeThermalValue nicht gefunden.');
else{
 const check=`${helper}\nconst a:number=bridgeThermalValue(undefined,30,28,15);\nconst b:number=bridgeThermalValue(30,32,28,30);`;
 const fileName='short-term-anchor-buildfix.ts';
 const options={strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,skipLibCheck:true};
 const host=ts.createCompilerHost(options);
 const originalGetSourceFile=host.getSourceFile.bind(host);
 host.getSourceFile=(name,languageVersion,onError,shouldCreateNewSourceFile)=>name===fileName?ts.createSourceFile(name,check,languageVersion,true,ts.ScriptKind.TS):originalGetSourceFile(name,languageVersion,onError,shouldCreateNewSourceFile);
 host.readFile=name=>name===fileName?check:ts.sys.readFile(name);
 host.fileExists=name=>name===fileName||ts.sys.fileExists(name);
 const program=ts.createProgram([fileName],options,host);
 const diagnostics=ts.getPreEmitDiagnostics(program).filter(item=>item.file?.fileName===fileName);
 if(diagnostics.length)failures.push(...diagnostics.map(item=>`TypeScript: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
}

if(failures.length){
 console.error('Kurzfrist-Hyperlokal-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Kurzfrist-Hyperlokal-Buildfix geprüft: optionale Ankerwerte werden vor Vergleich typsicher normalisiert.');
