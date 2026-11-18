/** MID Design113: actual shared loading state, including long localized place names. */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {ModuleLoadingState} from '../../src/ModuleLoadingState';

const noBreak='KartenproduktUndSeineHochaufloesendenNiederschlagsUndKonvektionsDarstellungen'.repeat(3);
const label='Lade ' + noBreak + ' …';

describe('MID Design113 shared loading-state reflow',()=>{
 it.each(['chart','map'] as const)('preserves the complete long %s label inside a shrinkable grid cell',kind=>{
  const html=renderToStaticMarkup(createElement(ModuleLoadingState,{label,kind}));
  expect(html).toContain(label);
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('grid-template-columns:minmax(0,1fr)');
  expect(html).toContain('overflow-wrap:anywhere');
  expect(html).toContain('min-width:0');
  expect(html).toContain('max-width:100%');
  expect(html).toContain('data-loading-kind="'+kind+'"');
 });
 it('keeps only the actual status text accessible; decoration is hidden, not synthetic weather',()=>{
  const html=renderToStaticMarkup(createElement(ModuleLoadingState,{label:'Saisonmodelle werden geladen …'}));
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('Saisonmodelle werden geladen …');
  expect(html).not.toContain('role="progressbar"');
  expect(html).not.toContain('°C');
  expect(html).not.toContain('mm/h');
  expect(html).not.toContain('animation:');
 });
 it('retains the existing reserved map-height CSS ownership, not app-wide overrides',()=>{
  const html=renderToStaticMarkup(createElement(ModuleLoadingState,{label:'Kartenprodukt wird geladen …',kind:'map',className:'lazy-placeholder map-workspace-loading'}));
  expect(html).toContain('module-loading-state inner lazy-placeholder map-workspace-loading');
  expect(html).toContain('box-sizing:border-box');
  expect(html).toContain('data-loading-kind="map"');
  expect(html).toContain('aria-hidden="true"');
 });
 it('escapes untrusted status strings without truncating or creating user content markup',()=>{
  const source='<img src=x onerror=alert(1)> Kartenladezustand';
  const html=renderToStaticMarkup(createElement(ModuleLoadingState,{label:source}));
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
  expect(html).not.toContain('onerror=alert(1)>');
 });
 it('validates the optional browser runner syntax and the real component fixture without pretending to execute Chromium',()=>{
  const source=readFileSync(fileURLToPath(new URL('../../tests/visual/design113-loading-reflow-qa.tsx',import.meta.url)),'utf8');
  const runnerPath=fileURLToPath(new URL('../../scripts/qa/verifyDesign113LoadingReflowBrowser.mjs',import.meta.url));
  const runner=readFileSync(runnerPath,'utf8');
  execFileSync(process.execPath,['--check',runnerPath],{timeout:10000,stdio:'pipe'});
  expect(source).toContain("import {ModuleLoadingState} from '../../src/ModuleLoadingState'");
  expect(source).toContain('data-kind="chart"');
  expect(source).toContain('data-kind="map"');
  expect(runner).toContain('evidence.cases.length,28');
  expect(runner).toContain('report.ready=true'.replace('report','evidence'));
  expect(runner).not.toContain('process.exit(0)');
  expect(runner).not.toContain('test.skip');
 });
});
