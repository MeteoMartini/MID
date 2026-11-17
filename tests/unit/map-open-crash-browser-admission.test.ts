import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {describe,expect,it} from 'vitest';

const src=readFileSync('scripts/fixtures/surroundings-real-map-open-recovery-browser.tsx','utf8');
const runner=readFileSync('scripts/verify-surroundings-map-open-recovery-browser-0985487.mjs','utf8');

describe('MID Kartenöffnen: real React/Chromium evidence admission (not browser execution)',()=>{
 it('compiles full real-component Chromium fixture and deterministic Playwright runner',()=>{
  expect(()=>transformSync(src,{loader:'tsx',target:'es2022',jsx:'automatic'})).not.toThrow();
  expect(()=>transformSync(runner,{loader:'js',target:'node22'})).not.toThrow();
  expect(runner).toContain("playwright@1.56.1");
  expect(runner).toContain("MID_REAL_MAP_OPEN_CRASH_CONTAINMENT_BROWSER");
 });
 it('mounts original CurrentSurroundings and actual heavy MapWorkspacePanel on user click',()=>{
  expect(src).toContain("import CurrentSurroundings from '../../src/CurrentSurroundings'");
  expect(src).toContain("import MapWorkspacePanel from '../../src/MapWorkspacePanel'");
  expect(src).toContain('<CurrentSurroundings lat={50.82} lon={7.14}');
  expect(src).toContain('<MapWorkspacePanel lat={request.lat} lon={request.lon}');
  expect(runner).toContain("getByRole('button',{name:'Karte öffnen',exact:true})");
  expect(runner).toContain('.composite-maplibre canvas');
  expect(runner).toContain("document.querySelectorAll('.maplibregl-map').length===1");
 });
 it('exercises actual React error boundary recovery, never claims native iOS validation',()=>{
  expect(src).toContain("import {MapWorkspaceErrorBoundary} from '../../src/MapWorkspaceErrorBoundary'");
  expect(src).toContain('throw new Error(\'SYNTHETIC_MAP_QA_RENDER_FAILURE\')');
  expect(runner).toContain("getByRole('alert',{name:'Kartenansicht konnte nicht dargestellt werden'})");
  expect(runner).toContain("getByRole('button',{name:'Karte erneut versuchen'})");
  expect(runner).toContain("nativeIos:false");
  expect(runner).toContain("fullAppState:false");
  expect(runner).toContain("weatherNetwork:false");
 });
});
