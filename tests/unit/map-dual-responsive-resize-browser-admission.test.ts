import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {describe,expect,it} from 'vitest';

const runner=readFileSync('scripts/verify-dual-map-responsive-resize-browser-0985487.mjs','utf8');
const fixture=readFileSync('scripts/fixtures/map-dual-responsive-resize-browser.tsx','utf8');

describe('MID dual map real responsive/RAF browser admission — not execution',()=>{
 it('parses executable Vite Playwright runner and real React 19 map fixture',()=>{
  expect(()=>transformSync(runner,{loader:'js',target:'node22'})).not.toThrow();
  expect(()=>transformSync(fixture,{loader:'tsx',target:'es2022',jsx:'automatic'})).not.toThrow();
  expect(runner).toContain("execFileSync('npm',['exec','--yes','--package=playwright@1.56.1'");
  expect(runner).toContain('pw.chromium.launch(');
  expect(runner).toContain('MID_DUAL_MAP_RESPONSIVE_RESIZE_BROWSER');
 });
 it('tests two actual independent MID MapLibre instances in responsive grid, not CSS-only pseudo-maps',()=>{
  expect(fixture).toContain("import {MidMapLibre,useMidMap} from '../../src/MapLibreCore'");
  expect(fixture).toContain('MapLibreMap.prototype.resize=function(');
  expect(fixture).toContain('<MidMapLibre center={[50.82,7.14]} zoom={8}');
  expect(fixture).toContain('<MidMapLibre center={[50.82,7.14]} zoom={7}');
  expect(runner).toContain("for(const width of [320,390,430,834,1024,1440])");
  expect(runner).toContain("for(const theme of ['light','dark'])");
  expect(runner).toContain("await page.waitForFunction(()=>");
  expect(runner).toContain("await page.getByRole('button',{name:'Karten umschalten'}).click()");
 });
 it('refuses a false success: tests actual resize count, GL dimensions, map identity and no extra resize events',()=>{
  expect(runner).toContain("for(let i=0;i<75;i++)window.dispatchEvent(new Event('resize'))");
  expect(runner).toContain('noChange[id].resizeCalls,initial[id].resizeCalls');
  expect(runner).toContain("big.style.width='84%';big.style.height='320px'");
  expect(runner).toContain("small.style.width='72%';small.style.height='240px'");
  expect(runner).toContain('canvas.width');
  expect(runner).toContain('maps[id]===initial[id]');
  expect(runner).toContain("assert.deepEqual(errors,[]");
  expect(runner).toContain("await ready(page)");
  expect(runner).toContain("weatherData:'none-synthetic-map-shells'");
 });
 it('keeps default MID WMS and GPU renderer in productive component untouched',()=>{
  const core=readFileSync('src/MapLibreCore.tsx','utf8');
  expect(core).toContain('export function ImageQuadLayer');
  expect(core).toContain('export function WmsTileLayer');
  expect(core).toContain("trackResize:false");
  expect(core).toContain("resizeCoalescer.dispose()");
  expect(core).toContain("window.requestAnimationFrame(callback)");
 });
});
