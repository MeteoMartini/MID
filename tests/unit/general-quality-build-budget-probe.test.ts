import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {describe,it,expect} from 'vitest';

// Temporary diagnostic ONLY: build using the repository's actual Vite production
// command in the isolated read-only QA runner. This file must be removed after
// documenting exact byte measurements; the official source/installer gates remain.
const root=fileURLToPath(new URL('../..',import.meta.url));
const commands=[
 ['npm',['run','verify:vite']],
 [process.execPath,['scripts/test-bundle-budget-098594.mjs']],
 [process.execPath,['scripts/check-build-budget.mjs']],
] as const;
function run(cmd:string,args:readonly string[]){
 const r=spawnSync(cmd,[...args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,timeout:390_000,
   env:{...process.env,FORCE_COLOR:'0'}});
 const output=[r.stdout,r.stderr].filter(Boolean).join('\n');
 expect(r.status,'Build/budget command failed '+cmd+' '+args.join(' ')+': '+String(r.error?.message??r.signal??output.slice(-8500))).toBe(0);
 return output;
}
describe('MID 18.2.84 temporary original Vite/raw-byte budget probe',()=>{
 it('actually builds dist first, then rejects over-budget originals',()=>{
  for(const [cmd,args] of commands)run(cmd,args);
  const assets=join(root,'dist','assets');
  expect(existsSync(assets),'Vite must produce actual dist/assets').toBe(true);
  const list=readdirSync(assets),js=list.filter(name=>/^index-.*\.js$/.test(name)),css=list.filter(name=>/^index-.*\.css$/.test(name));
  expect(js.length,'missing main JS must fail closed').toBeGreaterThan(0);
  expect(css.length,'missing main CSS must fail closed').toBeGreaterThan(0);
  const jsBytes=js.reduce((total,name)=>total+statSync(join(assets,name)).size,0);
  const cssBytes=Math.max(...css.map(name=>statSync(join(assets,name)).size));
  expect(jsBytes).toBeLessThanOrEqual(1_500_000);
  expect(cssBytes).toBeLessThanOrEqual(1_760_000);
  const budgetFile=join(root,'artifacts','build-budget.json');
  expect(existsSync(budgetFile)).toBe(true);
  const budget=JSON.parse(readFileSync(budgetFile,'utf8'));
  expect(budget.ok).toBe(true);
  expect(budget.totals.initialCssBytes).toBeLessThanOrEqual(1_760_000);
  console.log('[MID-QA-PROBE] Exact build bytes: JS='+jsBytes+'/1500000 CSS='+cssBytes+'/1760000 initialCssBytes='+budget.totals.initialCssBytes+' initialCssGzip='+budget.totals.initialCssGzipBytes+' buildBudgetOk='+budget.ok);
 },420_000);
});
