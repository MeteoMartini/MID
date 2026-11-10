import {spawnSync} from 'node:child_process';
import {readdirSync,statSync,mkdtempSync,symlinkSync,rmSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {describe,it,expect} from 'vitest';

// TEMPORARY SHA-pinned, isolated production-mode build comparison.
// Both builds run only in disposable detached Git worktrees. The checkout
// used by GitHub CI is never built or dirtied; tracked dist remains immutable.
// Synthetic URL-only VITE_* settings NEVER prove the real installer config.
const root=fileURLToPath(new URL('../..',import.meta.url));
const stableSha='ba4901932c33e584167c31c310fb11601e77b6df';
const plainEnv={...process.env,NODE_ENV:'production',FORCE_COLOR:'0'};
for(const k of Object.keys(plainEnv))if(k.startsWith('VITE_'))delete plainEnv[k];
const syntheticEnv={...plainEnv,
 VITE_METAR_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_ALERT_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_RADAR_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_WORKER_SAME_ORIGIN_PATH:'/api/mid-worker',
 VITE_WORKER_FALLBACK_URLS:'',
 VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN:'',
 VITE_POSTHOG_PROJECT_TOKEN:'',
 VITE_POSTHOG_HOST:'',
};
function run(command:string,args:string[],cwd=root,env=plainEnv,timeout=130_000){
 const x=spawnSync(command,args,{cwd,env,timeout,encoding:'utf8',maxBuffer:12*1024*1024});
 return{status:x.status,error:x.error?.message||x.signal||'',output:[x.stdout,x.stderr].filter(Boolean).join('\n')};
}
function must(command:string,args:string[],cwd=root,env=plainEnv,timeout=130_000){
 const out=run(command,args,cwd,env,timeout);
 expect(out.status,command+' '+args.join(' ')+' failure: '+(out.error||out.output.slice(-5500))).toBe(0);
 return out.output;
}
function build(dir:string,env:NodeJS.ProcessEnv){
 must('npm',['run','verify:vite'],dir,env);
 const assets=join(dir,'dist','assets');expect(existsSync(assets)).toBe(true);
 const names=readdirSync(assets);
 const indexJs=names.filter(n=>/^index-.*\.js$/.test(n)).map(name=>({name,bytes:statSync(join(assets,name)).size}));
 const indexCss=names.filter(n=>/^index-.*\.css$/.test(n)).map(name=>({name,bytes:statSync(join(assets,name)).size}));
 expect(indexJs.length).toBeGreaterThan(0);expect(indexCss.length).toBeGreaterThan(0);
 const sizes={js:indexJs.reduce((n,a)=>n+a.bytes,0),css:Math.max(...indexCss.map(x=>x.bytes))};
 const gate=run(process.execPath,['scripts/test-bundle-budget-098594.mjs'],dir,env);
 return{...sizes,indexJs,indexCss,gatePassed:gate.status===0,gateMessage:gate.output.trim().slice(0,300)};
}
describe('MID 18.2.84 temporary production-mode Stable-vs-Draft build A/B',()=>{
 it('isolates both actual production Vite builds without touching CI checkout',()=>{
  const rootTemp=mkdtempSync(join(tmpdir(),'mid-general-prod-qa-')),stable=join(rootTemp,'stable'),candidate=join(rootTemp,'candidate');
  const created:string[]=[];
  try{
   if(run('git',['cat-file','-e',stableSha+'^{commit}']).status!==0)
    must('git',['fetch','--no-tags','--depth=1','origin','mid-stable']);
   expect(must('git',['rev-parse',stableSha]).trim()).toBe(stableSha);
   must('git',['worktree','add','--detach',stable,stableSha]);created.push(stable);
   must('git',['worktree','add','--detach',candidate,'HEAD']);created.push(candidate);
   for(const dir of created)symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir');
   const stablePlain=build(stable,plainEnv),candidatePlain=build(candidate,plainEnv);
   const stableSynthetic=build(stable,syntheticEnv),candidateSynthetic=build(candidate,syntheticEnv);
   console.log('[MID-BUILD-PRODUCTION-AB] '+JSON.stringify({
     stableSha,mode:'explicit NODE_ENV=production',environment:'no-env and synthetic nonsecret VITE endpoints',
     plain:{stable:stablePlain,candidate:candidatePlain,deltaJS:candidatePlain.js-stablePlain.js},
     synthetic:{stable:stableSynthetic,candidate:candidateSynthetic,deltaJS:candidateSynthetic.js-stableSynthetic.js},
   }));
   // Diagnostic rule only; successful synthetic build is NOT an Installer gate.
   expect(candidatePlain.js).toBeLessThanOrEqual(1_500_000);
   expect(candidatePlain.css).toBeLessThanOrEqual(1_760_000);
   expect(candidateSynthetic.js).toBeLessThanOrEqual(1_500_000);
   expect(candidateSynthetic.css).toBeLessThanOrEqual(1_760_000);
  }finally{
   for(const dir of created.reverse())run('git',['worktree','remove','--force',dir]);
   rmSync(rootTemp,{recursive:true,force:true});
  }
 },420_000);
});
