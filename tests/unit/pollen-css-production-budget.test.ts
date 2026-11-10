import {mkdtempSync,mkdirSync,readdirSync,readFileSync,rmSync,statSync,symlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {describe,expect,it} from 'vitest';

describe('MID #344 CSS pilot: isolated genuine Vite production build, NO release',()=>{
 it('must reduce eager CSS and offline-precache the deferred pollen CSS asset',()=>{
  const home=mkdtempSync(path.join(tmpdir(),'mid-pollen-css-prod-'));
  const work=path.join(home,'worktree');
  const cwd=process.cwd();
  // Worktree from the exact checked-out PR candidate; never reset/rebase or
  // change the original workspace, and never fetch remote source here.
  const git=spawnSync('git',['worktree','add','--detach',work,'HEAD'],{
   cwd,encoding:'utf8',timeout:25000
  });
  expect(git.status,[git.stdout,git.stderr,git.error?.message].filter(Boolean).join('\n')).toBe(0);
  try{
   symlinkSync(path.join(cwd,'node_modules'),path.join(work,'node_modules'),'dir');
   // No VITE_* environment and no external keys: compare actual production
   // emitted bytes rather than NODE_ENV=test's different build characteristics.
   const env={PATH:process.env.PATH||'',HOME:process.env.HOME||home,
    NODE_ENV:'production',CI:'true'};
   const vite=spawnSync('npm',['run','verify:vite'],{
    cwd:work,env,encoding:'utf8',timeout:150000,maxBuffer:5*1024*1024
   });
   expect(vite.status,[vite.stdout?.slice(-5000),vite.stderr?.slice(-5000),vite.error?.message].filter(Boolean).join('\n')).toBe(0);
   const assets=path.join(work,'dist','assets'),names=readdirSync(assets);
   const select=(re:RegExp)=>names.filter(n=>re.test(n)).sort();
   const mainCss=select(/^index-.*\.css$/);
   const pollenCss=select(/^PollenForecast-.*\.css$/);
   const pollenJs=select(/^PollenForecast-.*\.js$/);
   expect(mainCss).toHaveLength(1);
   expect(pollenCss).toHaveLength(1);
   expect(pollenJs).toHaveLength(1);
   const css=readFileSync(path.join(assets,mainCss[0]));
   const pollen=readFileSync(path.join(assets,pollenCss[0]));
   // Vite may emit multiple index-named chunks: match the established
   // script's budget semantics by measuring the LARGEST index JS file.
   const js=select(/^index-.*\.js$/);
   expect(js.length).toBeGreaterThanOrEqual(1);
   const jsSize=Math.max(...js.map(name=>statSync(path.join(assets,name)).size));
   const html=readFileSync(path.join(work,'dist','index.html'),'utf8');
   expect(html).toContain('rel="mid-offline"');
   expect(html).toContain(pollenCss[0]);
   expect(html).toContain(pollenJs[0]);
   expect(css.length).toBeLessThan(1_759_965);
   expect(css.length).toBeLessThanOrEqual(1_760_000);
   expect(jsSize).toBeLessThanOrEqual(1_500_000);
   expect(gzipSync(css,{level:9}).length).toBeLessThanOrEqual(320_000);
   expect(brotliCompressSync(css,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length).toBeLessThanOrEqual(225_000);
   const budget=spawnSync(process.execPath,['scripts/test-bundle-budget-098594.mjs'],{
    cwd:work,env,encoding:'utf8',timeout:15000
   });
   expect(budget.status,[budget.stdout,budget.stderr,budget.error?.message].filter(Boolean).join('\n')).toBe(0);
   console.info('MID production CSS pilot: '+JSON.stringify({
    source:'Exact candidate SHA, NODE_ENV=production, no VITE_*',
    initialCssRawBytes:css.length,initialCssGzip9Bytes:gzipSync(css,{level:9}).length,
    initialCssBrotli6Bytes:brotliCompressSync(css,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length,
    pollenDeferredCssBytes:pollen.length,mainJsRawBytes:jsSize,
    comparedToPreviousEagerCssBytes:1_759_965,savedRawBytes:1_759_965-css.length
   }));
  }finally{
   spawnSync('git',['worktree','remove','--force',work],{cwd,encoding:'utf8',timeout:20000});
   rmSync(home,{recursive:true,force:true});
  }
 },190000);
});
