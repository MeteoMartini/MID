import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

const read=(file:string)=>readFileSync(file,'utf8');
const manifest=JSON.parse(read('src/styles-src/presentation-order.json')) as {sources:string[]};

describe('MID #344 pollen CSS split: lossless CSS owner and golden cascade',()=>{
 it('owns pollen CSS in the existing lazy module and preserves every other eager source',()=>{
  const app=read('src/App.tsx'),component=read('src/PollenForecast.tsx');
  expect(app).toContain("lazy(()=>import('./PollenForecast'))");
  expect(component.startsWith("import './midPollen.css';\n")).toBe(true);
  expect(manifest.sources).not.toContain('src/midPollen.css');
  expect(manifest.sources).toHaveLength(69);
  expect(new Set(manifest.sources).size).toBe(manifest.sources.length);
  const generated=read('src/midPresentation.css'),pollen=read('src/midPollen.css');
  expect(generated).not.toContain('/* MID Pollenflug');
  expect(generated).not.toContain('.pollen-forecast');
  expect(pollen).toContain('min-height:44px');
  expect(pollen).toContain(':root[data-theme="high-contrast"]');
  const vite=read('vite.config.ts');
  expect(vite).toContain('cssCodeSplit:true');
  expect(vite).toContain('metadata?.importedCss');
  expect(vite).toContain('pollenRoots');
 });
 it('runs the full immutable CSS golden/cascade test, not a relaxed checksum',()=>{
  const run=spawnSync(process.execPath,['scripts/test-module-css-consolidation-0985170.mjs'],{
   encoding:'utf8',timeout:100000,env:{...process.env,NODE_ENV:'production'}
  });
  expect(run.status,[run.stdout,run.stderr,run.error?.message].filter(Boolean).join('\n')).toBe(0);
 });
});
