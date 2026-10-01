import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {regressionSuite} from './regression-suite.mjs';
const root=new URL('../',import.meta.url).pathname;
const source=await readFile(new URL('../worker-src/25-dach-extreme-outlook.js',import.meta.url),'utf8');
const domain=JSON.parse(await readFile(new URL('../src/extremeOutlookCoverage.generated.json',import.meta.url),'utf8'));
const expected=vm.runInNewContext(source.slice(0,source.indexOf('const DACH_EXTREME_MASKS'))+';dachExtremeDomainPolygon()');
expected.push(expected[0]);assert.deepEqual(domain,JSON.parse(JSON.stringify(expected)));
const area=domain.slice(0,-1).reduce((sum,p,i)=>sum+p[0]*domain[i+1][1]-domain[i+1][0]*p[1],0);
assert.ok(area>0,'Coverage hole must be clockwise after reversal');
const inside=vm.runInNewContext(source+';dachExtremeInCoverage');
assert.equal(inside(52.5,13.4),true);assert.equal(inside(58,-3.8),false);assert.equal(inside(40,10),false);
const panel=await readFile(new URL('../src/ExtremeWeatherOutlookPanel.tsx',import.meta.url),'utf8');
assert.ok(panel.includes('render={drawExtremeOutlookOutsideCoverage}'));assert.ok(panel.includes("events={['render','resize']} zIndex={1}"));assert.ok(panel.includes('außerhalb ICON-D2'));
const rendererSource=(await readFile(new URL('../src/extremeOutlookCoverage.ts',import.meta.url),'utf8')).replace(/import domain from .*?;/,`const domain=${JSON.stringify(domain)};`);
const ts=createRequire(import.meta.url)('typescript-strada');
const {drawExtremeOutlookOutsideCoverage}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(rendererSource,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const operations=[];const ctx=new Proxy({},{get:(_,key)=>(...args)=>operations.push([key,...args]),set:(_,key,value)=>{operations.push([key,value]);return true}});
const canvas={width:0,height:0,style:{},getContext:()=>ctx};
drawExtremeOutlookOutsideCoverage({getCanvas:()=>({clientWidth:400,clientHeight:300}),getCenter:()=>({lng:0}),project:([lon,lat])=>({x:lon,y:lat})},canvas);
assert.equal(canvas.width,400);assert.equal(canvas.height,300);
assert.ok(operations.some(row=>row[0]==='rect'&&row[3]===400&&row[4]===300));
assert.deepEqual(operations.at(-1),['fill','evenodd']);assert.equal(operations.filter(row=>row[0]==='closePath').length,3);
assert.ok(operations.some(row=>row[0]==='fillStyle'&&row[1]==='rgba(16,25,35,.84)'));
await regressionSuite(root);
const tmp=await mkdtemp(path.join(tmpdir(),'mid-regression-inventory-'));
try{
 await mkdir(path.join(tmp,'scripts'));await writeFile(path.join(tmp,'scripts','test-a.mjs'),'');
 const write=async required=>writeFile(path.join(tmp,'MID_BASELINE.json'),JSON.stringify({requiredRegressionTests:required,regressionTests:['scripts/test-a.mjs']}));
 await write(['scripts/test-a.mjs']);assert.deepEqual(await regressionSuite(tmp),['test-a.mjs']);
 for(const required of [[],['scripts/test-stale.mjs'],['scripts/test-a.mjs','scripts/test-a.mjs']]){await write(required);await assert.rejects(()=>regressionSuite(tmp),/inventory differs/)}
}finally{await rm(tmp,{recursive:true,force:true})}
console.log('Curved ICON-D2 coverage matches analysis; consolidated regression inventories reject missing, stale and duplicate checks.');
