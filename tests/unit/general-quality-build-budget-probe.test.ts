import {spawnSync} from 'node:child_process';
import {existsSync,readdirSync,statSync,mkdtempSync,symlinkSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {describe,it,expect} from 'vitest';

// TEMPORARY SHA-pinned READ-ONLY diagnostic. Compare promoted Stable and this
// Draft on exactly the same Node/Vite runner, with the same non-secret profiles.
// No actual production tokens, URLs, endpoints or secrets are obtained.
const root=fileURLToPath(new URL('../..',import.meta.url));
const stableSha='ba4901932c33e584167c31c310fb11601e77b6df';
const viteKeys=Object.keys(process.env).filter(k=>k.startsWith('VITE_'));
const envBase={...process.env,FORCE_COLOR:'0'};
for(const k of viteKeys)delete envBase[k];
const envSynthetic={...envBase,
 VITE_METAR_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_ALERT_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_RADAR_PROXY_URL:'https://qa-worker.invalid/api/mid-worker',
 VITE_WORKER_SAME_ORIGIN_PATH:'/api/mid-worker',
 VITE_WORKER_FALLBACK_URLS:'',
 VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN:'',
 VITE_POSTHOG_PROJECT_TOKEN:'',
 VITE_POSTHOG_HOST:'',
};
function run(cmd:string,args:string[],cwd=root,env=envBase,timeout=140_000){
 const r=spawnSync(cmd,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:20*1024*1024});
 return {status:r.status,error:r.error?.message||r.signal||'',output:[r.stdout,r.stderr].filter(Boolean).join('\n')};
}
function requireRun(cmd:string,args:string[],cwd=root,env=envBase,timeout=140_000){
 const r=run(cmd,args,cwd,env,timeout);
 expect(r.status,cmd+' '+args.join(' ')+' failed: '+(r.error||r.output.slice(-6500))).toBe(0);
 return r.output;
}
function inspect(cwd:string){
 const assets=join(cwd,'dist','assets');
 expect(existsSync(assets),'Vite dist/assets must actually exist').toBe(true);
 const files=readdirSync(assets);
 const js=files.filter(name=>/^index-.*\.js$/.test(name)).map(name=>({name,bytes:statSync(join(assets,name)).size}));
 const css=files.filter(name=>/^index-.*\.css$/.test(name)).map(name=>({name,bytes:statSync(join(assets,name)).size}));
 expect(js.length,'main JS not emitted').toBeGreaterThan(0);
 expect(css.length,'main CSS not emitted').toBeGreaterThan(0);
 return{js:js.reduce((n,a)=>n+a.bytes,0),css:Math.max(...css.map(x=>x.bytes)),indexJs:js,indexCss:css};
}
function build(cwd:string,env:NodeJS.ProcessEnv){
 requireRun('npm',['run','verify:vite'],cwd,env,140_000);
 return inspect(cwd);
}
describe('MID diagnostic: Stable/source bundle under identical Vite environments',()=>{
 it('isolates source delta from missing Installer VITE_* configuration',()=>{
  const temp=mkdtempSync(join(tmpdir(),'mid-general-bundle-ab-')),stablePath=join(temp,'stable');
  let worktree=false;
  try{
   if(run('git',['cat-file','-e',stableSha+'^{commit}']).status!==0){
    requireRun('git',['fetch','--no-tags','--depth=1','origin','mid-stable']);
   }
   expect(requireRun('git',['rev-parse',stableSha]).trim()).toBe(stableSha);
   requireRun('git',['worktree','add','--detach',stablePath,stableSha]);
   worktree=true;
   symlinkSync(join(root,'node_modules'),join(stablePath,'node_modules'),'dir');
   const noEnvStable=build(stablePath,envBase),noEnvDraft=build(root,envBase);
   const configuredStable=build(stablePath,envSynthetic),configuredDraft=build(root,envSynthetic);
   console.log('[MID-BUILD-AB] '+JSON.stringify({stableSha,profiles:{
    noEnv:{stable:noEnvStable,draft:noEnvDraft,deltaJS:noEnvDraft.js-noEnvStable.js,deltaCSS:noEnvDraft.css-noEnvStable.css},
    syntheticNonSecret:{stable:configuredStable,draft:configuredDraft,deltaJS:configuredDraft.js-configuredStable.js,deltaCSS:configuredDraft.css-configuredStable.css}
   }}));
   const budget=run(process.execPath,['scripts/test-bundle-budget-098594.mjs'],root,envSynthetic);
   console.log('[MID-BUILD-AB] Synthetic raw gate: '+budget.output.trim().slice(0,1200)+' exit='+budget.status);
   // Do not assert Installer parity: actual VITE_* repo variables are not exposed
   // in this unit workflow. This is a diagnostic A/B, never a release gate.
   expect(Number.isFinite(noEnvDraft.js)&&Number.isFinite(configuredDraft.js)).toBe(true);
  }finally{
   if(worktree)run('git',['worktree','remove','--force',stablePath]);
   rmSync(temp,{recursive:true,force:true});
  }
 },420_000);
});
