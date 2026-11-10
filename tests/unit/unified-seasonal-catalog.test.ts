import {describe,it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,readdirSync,rmSync,statSync} from 'node:fs';
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
 (isMapAudit?it:it.skip)('probes the real production Vite bundle and the unchanged size budgets, draft #741 only',()=>{
  // Explicit non-release QA: all generated files stay outside the repository.
  // Never run this additional resource-intensive probe on unrelated PRs or local tests.
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const output=mkdtempSync(join(tmpdir(),'mid-seasonal-qa-build-'));
  const run=(args:string[],timeout:number)=>{
   const result=spawnSync(process.execPath,args,{
    cwd:root,encoding:'utf8',timeout,maxBuffer:12*1024*1024,
    env:{...process.env},
   });
   if(result.error||result.status!==0&&args[0]!=='scripts/check-build-budget.mjs')
    throw new Error('Nur lokaler QA-Build fehlgeschlagen: '+args.join(' ')+'\\n'+String(result.error||'')+
     '\\n'+String(result.stdout||'').slice(-2200)+'\\n'+String(result.stderr||'').slice(-2200));
   return result;
  };
  try{
   run(['--max-old-space-size=4096','node_modules/vite/bin/vite.js','build','--outDir',output,'--emptyOutDir'],420_000);
   const names=readdirSync(join(output,'assets'));
   const js=names.filter(name=>/^index-.*\.js$/.test(name));
   const css=names.filter(name=>/^index-.*\.css$/.test(name));
   expect(js).toHaveLength(1);
   expect(css).toHaveLength(1);
   const jsBytes=statSync(join(output,'assets',js[0])).size;
   const cssBytes=statSync(join(output,'assets',css[0])).size;
   const budgetResult=run(['scripts/check-build-budget.mjs',output],150_000);
   const report=JSON.parse(readFileSync(join(root,'artifacts','build-budget.json'),'utf8')) as {
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
  }finally{rmSync(output,{recursive:true,force:true})}
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
