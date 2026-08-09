import {readFile} from 'node:fs/promises';
const [panel,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of ['y=(value:number)=>','x=(index:number)=>'])if(!panel.includes(token))failures.push(`LongRangePanel fehlt explizite Typisierung: ${token}`);
for(const token of ['y=value=>','x=index=>'])if(panel.includes(token))failures.push(`LongRangePanel enthält wieder implizites any: ${token}`);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(pv!=='0.9.33.1')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error(`MID v0.9.33.1 Langfrist-TypeScript-Buildfix fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.33.1: Langfrist-Diagrammachsen ohne implizites any geprüft.');
