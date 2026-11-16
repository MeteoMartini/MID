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
