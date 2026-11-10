import {describe,it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,readdirSync,rmSync,statSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {availableUnifiedParameters,groupedUnifiedParameters,unifiedSources,UNIFIED_MAP_PARAMETERS} from '../../src/unifiedMapCatalog';
import type {NativeIndex,NativeFrameRef} from '../../src/nativeModelFields';

const run='2026-11-09T06:00:00Z',time='2026-11-09T07:00:00Z';
const makeRef=(intervalHours=1):NativeFrameRef=>({
 hour:1,time,file:'field-001.json',sha256:'f'.repeat(64),bytes:300,intervalHours,
});
const index=():NativeIndex=>({schema:'mid.icon-d2.fields.v1',run,products:{
 precipitation:{unit:'mm/1 h',frames:[makeRef()]},
 temperature:{unit:'°C',frames:[makeRef()]},
 gust:{unit:'km/h',frames:[makeRef()]},
}});

describe('seasonal WXCharts-inspired cards stay inside the original MID map selector',()=>{
 it('executes the actual C17 map source/parameter regressions on this PR head',()=>{
  // Run the existing source/selector/WMS/provenance contract as a real Node process.
  // Browser viewports run only in the separate mandatory Source-Gate browser matrix.
  // No weakening or removal of the existing GITHUB_ACTIONS=true browser branches.
  const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
  const output=execFileSync(process.execPath,['scripts/test-unified-map-layers-0985167.mjs'],{
   cwd:repoRoot,encoding:'utf8',timeout:120_000,maxBuffer:4*1024*1024,
   env:{...process.env,GITHUB_ACTIONS:'false'},
  });
  expect(output).toContain('MID-C17 unified map: scientific model/parameter matrix');
 },120_000);
 const isMapAudit=process.env.GITHUB_ACTIONS==='true'&&
  process.env.GITHUB_EVENT_NAME==='pull_request'&&
  process.env.GITHUB_HEAD_REF==='chatgpt/v0.9.85.454-seasonal-interval-qa';
 (isMapAudit?it:it.skip)('verifies both seasonal SVG exports on a real 390px Chromium MapLibre view',()=>{
  const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
  const result=spawnSync(process.execPath,['scripts/verify-unified-map-browser-0985167.mjs'],{
   cwd:repoRoot,encoding:'utf8',timeout:460_000,maxBuffer:12*1024*1024,
   env:{...process.env,GITHUB_ACTIONS:'false',MID_MAP_QA_PILOT_CASE:'390/light/next'},
  });
  if(result.error||result.status!==0)throw new Error('Seasonal Chromium integration failed: '+String(result.error||'')+
   '\\n'+String(result.stdout||'').slice(-5200)+'\\n'+String(result.stderr||'').slice(-4200));
  expect(result.stdout).toContain('1 real-map viewport/theme cases passed');
 },480_000);

 (isMapAudit?it:it.skip)('probes the real production Vite bundle and the unchanged size budgets, draft #741 only',()=>{
  // Explicit non-release QA: all generated files stay outside the repository.
  // Never run this additional resource-intensive probe on unrelated PRs or local tests.
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const scratch=mkdtempSync(join(tmpdir(),'mid-seasonal-qa-build-'));
  const checkout=join(scratch,'source');
  let checkedOut=false;
  // Vitest sets NODE_ENV=test; forwarding it would build React's development
  // graph and overstate MID's real production main-JS size by hundreds of kB.
  const buildEnv:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production'};
  for(const key of ['VITEST','VITEST_WORKER_ID','VITEST_POOL_ID'])delete buildEnv[key];
  const run=(args:string[],timeout:number,cwd=root)=>{
   const result=spawnSync(process.execPath,args,{
    cwd,encoding:'utf8',timeout,maxBuffer:12*1024*1024,
    env:buildEnv,
   });
   if(result.error||result.status!==0&&args[0]!=='scripts/check-build-budget.mjs')
    throw new Error('Nur lokaler QA-Build fehlgeschlagen: '+args.join(' ')+'\\n'+String(result.error||'')+
     '\\n'+String(result.stdout||'').slice(-2200)+'\\n'+String(result.stderr||'').slice(-2200));
   return result;
  };
  try{
   // Detached scratch checkout preserves Vite's canonical dist/ path while
   // leaving the PR worktree, protected branches and tracked assets untouched.
   const added=spawnSync('git',['worktree','add','--detach',checkout,'HEAD'],{
    cwd:root,encoding:'utf8',timeout:45_000,maxBuffer:2*1024*1024,
   });
   if(added.status!==0||added.error)throw new Error('QA worktree checkout failed: '+String(added.stderr||added.error));
   checkedOut=true;
   symlinkSync(join(root,'node_modules'),join(checkout,'node_modules'),'dir');
   run([join(root,'node_modules/vite/bin/vite.js'),'build'],420_000,checkout);
   const output=join(checkout,'dist');
   const names=readdirSync(join(output,'assets'));
   const js=names.filter(name=>/^index-.*\.js$/.test(name));
   const css=names.filter(name=>/^index-.*\.css$/.test(name));
   expect(js.length,'Der Haupt-JS-Einstieg muss existieren').toBeGreaterThan(0);
   expect(css.length,'Das Haupt-CSS muss existieren').toBeGreaterThan(0);
   // MID's unchanged test-bundle-budget contract SUMS every index-*.js chunk
   // and uses the largest index-*.css asset; never undercount split output.
   const jsBytes=js.reduce((sum,name)=>sum+statSync(join(output,'assets',name)).size,0);
   const cssBytes=Math.max(...css.map(name=>statSync(join(output,'assets',name)).size));
   console.log('[MID #741 source bundle] JS '+js.map(name=>name+':'+statSync(join(output,'assets',name)).size).join(', ')+
    '; CSS '+css.map(name=>name+':'+statSync(join(output,'assets',name)).size).join(', '));
   const budgetResult=run(['scripts/check-build-budget.mjs',output],150_000,checkout);
   const report=JSON.parse(readFileSync(join(checkout,'artifacts','build-budget.json'),'utf8')) as {
    schema:number;ok:boolean;totals:Record<string,number>;failures:string[];
   };
   console.log('[MID #741 isolation only] Vite candidate main JS '+jsBytes+
    '/1500000 B; main CSS '+cssBytes+'/1760000 B; full budget '+(report.ok?'PASS':'BLOCKED')+
    '; '+report.failures.join(' | '));
   expect(jsBytes,'Main-JS-Rohbudget unverändert').toBeLessThanOrEqual(1_500_000);
   expect(cssBytes,'Main-CSS-Rohbudget unverändert').toBeLessThanOrEqual(1_760_000);
   expect(report.schema).toBe(2);
   expect(budgetResult.status===0).toBe(report.ok);
   expect(report.failures,'Kein bestehendes hartes Budget wird für die Kartenfreigabe ignoriert').toEqual([]);
  }finally{
   if(checkedOut){
    rmSync(join(checkout,'node_modules'),{force:true});
    const removed=spawnSync('git',['worktree','remove','--force',checkout],{
     cwd:root,encoding:'utf8',timeout:45_000,maxBuffer:2*1024*1024,
    });
    if(removed.status!==0)console.warn('Temporären QA-Worktree nicht sauber entfernt: '+String(removed.stderr).slice(-400));
   }
   rmSync(scratch,{recursive:true,force:true});
  }
 },570_000);
 it('offers both exact-source seasonal products in the existing grouped parameter picker',()=>{
  const available=availableUnifiedParameters(index(),false,false);
  expect(available.filter(x=>['winter-berge','sommer-gewitter'].includes(x.id)).map(x=>x.id))
   .toEqual(['winter-berge','sommer-gewitter']);
  const group=groupedUnifiedParameters(available).find(x=>x.label==='Komposit & Synoptik');
  expect(group?.parameters.map(x=>x.id)).toContain('winter-berge');
  expect(group?.parameters.map(x=>x.id)).toContain('sommer-gewitter');
  expect(UNIFIED_MAP_PARAMETERS.find(x=>x.id==='winter-berge')?.detail).toContain('keine Schneefall');
  expect(UNIFIED_MAP_PARAMETERS.find(x=>x.id==='sommer-gewitter')?.detail).toContain('keine Gewitterdiagnose');
 });
 it('only lists an original ICON-D2 source for each real same-run pair',()=>{
  expect(unifiedSources('winter-berge',index(),false,false)).toEqual([
   {id:'icon-d2',label:'DWD ICON-D2 · geprüfte Felder'},
  ]);
  expect(unifiedSources('sommer-gewitter',index(),false,false)).toEqual([
   {id:'icon-d2',label:'DWD ICON-D2 · geprüfte Felder'},
  ]);
  const v2=index();v2.schema='mid.icon-d2.native-fields.v2';v2.modelId='icon-d2';
  expect(unifiedSources('winter-berge',v2,false,false)).toEqual([]);
  v2.productionApproved=true;
  v2.products.temperature!.frames=[makeRef(0)];v2.products.gust!.frames=[makeRef(0)];
  expect(availableUnifiedParameters(v2,false,false).filter(p=>p.id==='winter-berge'||p.id==='sommer-gewitter').map(p=>p.id)).toEqual(['winter-berge','sommer-gewitter']);
  const badLead=index();badLead.products.gust!.frames=[{...makeRef(0),hour:2}];
  expect(unifiedSources('sommer-gewitter',badLead,false,false)).toEqual([]);
 });
 it('hides unqualified winter and summer composites independently',()=>{
  const missing=index();delete missing.products.temperature;
  expect(availableUnifiedParameters(missing,false,false).some(x=>x.id==='winter-berge')).toBe(false);
  expect(availableUnifiedParameters(missing,false,false).some(x=>x.id==='sommer-gewitter')).toBe(true);
  expect(unifiedSources('winter-berge',missing,false,false)).toEqual([]);
  const invalid=index();invalid.products.precipitation!.frames=[makeRef(3)];
  expect(availableUnifiedParameters(invalid,false,false).some(x=>x.id==='sommer-gewitter')).toBe(false);
  expect(availableUnifiedParameters(invalid,false,false).some(x=>x.id==='winter-berge')).toBe(false);
 });
 it('never offers a seasonal pair solely from the RUC model when D2 is unavailable',()=>{
  const ruc=index();ruc.schema='mid.ruc.map-fields.v1';ruc.modelId='icon-d2-ruc';
  const result=availableUnifiedParameters(null,false,false,ruc);
  expect(result.some(x=>x.id==='winter-berge'||x.id==='sommer-gewitter')).toBe(false);
  expect(unifiedSources('sommer-gewitter',null,false,false,ruc)).toEqual([]);
 });
});
