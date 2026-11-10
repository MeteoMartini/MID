import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

const read=(file:string)=>readFileSync(file,'utf8');
const manifest=JSON.parse(read('src/styles-src/presentation-order.json')) as {sources:string[]};

describe('MID #344 Pollen CSS split: lossless source QA; browser parity separately required',()=>{
 it('keeps the real lazy component, pollen-only CSS and other eager sources intact',()=>{
  const app=read('src/App.tsx'),component=read('src/PollenForecast.tsx');
  expect(app).toContain("lazy(()=>import('./PollenForecast').then(module=>({default:module.PollenForecast})))");
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
 it('independently regenerates the 69-source cascade without changing the immutable golden',()=>{
  const code=[
   "import assert from 'node:assert/strict';",
   "import {readFileSync} from 'node:fs';",
   "import {pathToFileURL} from 'node:url';",
   "import {activeCssSources,loadCssCascade,consolidateCssCascade,renderConsolidatedCss} from './scripts/lib/cssCascade.mjs';",
   "const root=pathToFileURL(process.cwd()+'/');",
   "assert.equal(activeCssSources(root).length,69);",
   "const entries=loadCssCascade(root);",
   "consolidateCssCascade(entries);",
   "assert.equal(renderConsolidatedCss(entries),readFileSync('src/midPresentation.css','utf8'));",
   "console.log('Canonical lazy-pollen CSS source cascade 69/69 exact, no browser claimed.');"
  ].join('\n');
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{
   encoding:'utf8',timeout:30000,env:{...process.env,NODE_ENV:'production'}
  });
  expect(r.status,[r.stdout,r.stderr,r.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(r.stdout).toContain('69/69 exact');
  const original=read('scripts/test-module-css-consolidation-0985170.mjs');
  expect(original).toContain("originalEntries.splice(historicPollenIndex,0");
  expect(original).toContain("cssCascadeFingerprint(originalEntries),baseline.cssCascadeSha256");
  expect(original).toContain("if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-module-css-browser-0985170.mjs']");
  // Mandatory Browser/pixel gate is deliberately NOT simulated or marked green.
 });
});
