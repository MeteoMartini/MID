import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {shouldPreloadEnsembleVisual,isMapRevisitIntent} from '../../src/visualPreloadIntent';

describe('MID Design 1.5: heavy visual modules must respect user intent',()=>{
 it('does not eagerly load ensemble renderer just because data/Weather Twin defaults may need ensembles',()=>{
  expect(shouldPreloadEnsembleVisual({})).toBe(false);
  expect(shouldPreloadEnsembleVisual({presentationMode:'standard'})).toBe(false);
  expect(shouldPreloadEnsembleVisual({presentationMode:null,ensembleModuleOpen:'0',activeHorizon:'seven-day'})).toBe(false);
 });
 it('preserves direct visual preferences and chosen horizon',()=>{
  for(const intent of [
   {presentationMode:'cockpit-tabs'},{presentationMode:'cockpit-ribbons'},
   {activeHorizon:'fourteen-day'},{ensembleModuleOpen:'1'}
  ])expect(shouldPreloadEnsembleVisual(intent)).toBe(true);
 });
 it('does not treat malformed or unrelated user preferences as permission to allocate a chart',()=>{
  for(const value of [null,undefined,0,1,{},[],true,'false','1 ','FOURTEEN-DAY']){
   expect(shouldPreloadEnsembleVisual({presentationMode:value,activeHorizon:value,ensembleModuleOpen:value})).toBe(false);
  }
 });
 it('restricts idle map prewarm to a prior map visit, never general dashboard, search or climate',()=>{
  expect(isMapRevisitIntent('composite')).toBe(true);
  expect(isMapRevisitIntent('weather-maps')).toBe(true);
  for(const section of [undefined,null,'current','forecast','ensemble','climate','settings','composite ','weather'])expect(isMapRevisitIntent(section)).toBe(false);
 });
 it('keeps meteorological ensemble requests and user-intent loading independent',()=>{
  const src=readFileSync(new URL('../../src/startupPreload.ts',import.meta.url),'utf8');
  expect(src).toContain('const ensemble=wantsStartupEnsemble()');
  expect(src).toContain('const ensembleRequest=ensemble?startupRequest(');
  expect(src).toContain("if(ensemble&&wantsStartupEnsembleInterface())jobs.push(import('./EnsemblePanel'))");
  expect(src).toContain("if(last==='composite')jobs.push(import('./RadarPanel'))");
  expect(src).toContain('function preloadInterfaceChunks(ensemble:boolean,constrained:boolean){if(constrained)return Promise.resolve();');
  expect(src).toContain('Promise.race([forecastRequest.promise,stationRequest.promise,radarRequest.promise,delay(700)]).then(()=>preloadInterfaceChunks(ensemble,constrained))');
 });
 it('preserves map navigation/viewport/keyboard/touch warmup independent of idle choice',()=>{
  const src=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
  expect(src).toContain('onPointerEnter={warm} onFocus={warm} onPointerDown={warm}');
  expect(src).toContain('onVisible={warmCompositePanel}');
  expect(src).toContain("priorMapIntent:priorMapIntent()");
  expect(src).toContain("isMapRevisitIntent(localStorage.getItem(LAST_DASHBOARD_SECTION_KEY))");
 });
});

// The performance job runs the module-only Chromium trace against its exact
// Vite production dist. No browser metric is allowed to substitute for CWV.
describe('MID QA read-only real module-import evidence integration',()=>{
 it('uses existing performance build and a SHA-scoped Chromium-only probe',()=>{
  const budget=readFileSync(new URL('../../scripts/test-bundle-budget-098594.mjs',import.meta.url),'utf8');
  const browser=readFileSync(new URL('../../scripts/measure-map-prefetch-browser-0985489.mjs',import.meta.url),'utf8');
  expect(budget).toContain("process.env.GITHUB_ACTIONS==='true'");
  expect(budget).toContain("process.env.MID_EXPECTED_SOURCE_SHA");
  expect(budget).toContain("process.env.GITHUB_HEAD_REF");
  expect(budget).toContain("await import('./measure-map-prefetch-browser-0985489.mjs')");
  expect(browser).toContain("await verifyStartupBuildIdentity(root,identity)");
  expect(browser).toContain("assert.equal(identity.sourceGitSha,expected");
  expect(browser).toContain("Network.loadingFinished");
  expect(browser).toContain("HeapProfiler.collectGarbage");
  expect(browser).toContain("Runtime.getHeapUsage");
  expect(browser).toContain("module-only");
 });
});
