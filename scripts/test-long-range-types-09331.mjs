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
const parts=value=>String(value).split('.').map(part=>Number(part)||0),atLeast=(value,minimum)=>{const a=parts(value),b=parts(minimum),length=Math.max(a.length,b.length);for(let index=0;index<length;index++){const av=a[index]??0,bv=b[index]??0;if(av>bv)return true;if(av<bv)return false}return true};if(!atLeast(pv,'0.9.33.2'))failures.push(`Version ${pv} liegt vor dem Langfrist-Vertrag 0.9.33.2`);
if(failures.length){console.error(`MID Langfrist-TypeScript-Buildfix fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`MID ${pv}: Langfrist-Diagrammachsen ohne implizites any geprüft.`);
