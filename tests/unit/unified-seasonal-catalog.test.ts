import {describe,it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
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
