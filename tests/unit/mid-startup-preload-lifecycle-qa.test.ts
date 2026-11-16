import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

// Real startup module under test; only external meteorological I/O is mocked.
// No alternative forecast algorithm or network path is introduced.
const calls=vi.hoisted(()=>({
 forecast:vi.fn(async()=>({source:'fixture'})),
 station:vi.fn(async()=>({source:'fixture'})),
 radar:vi.fn(async()=>({source:'fixture'})),
 ensembles:vi.fn(async()=>({source:'fixture'})),
 radarImports:0,
}));
vi.mock('../../src/weather',()=>({
 forecast:calls.forecast,
 station:calls.station,
 radarNowcast:calls.radar,
 ensembles:calls.ensembles,
}));
vi.mock('../../src/RadarPanel',()=>{
 calls.radarImports+=1;
 return {default:()=>null};
});

describe('MID Design 1.6 – bounded startup promise lifetime',()=>{
 const home={name:'Rheidt',latitude:50.805,longitude:7.12,timezone:'Europe/Berlin'};
 const other={name:'Bonn',latitude:50.735,longitude:7.1,timezone:'Europe/Berlin'};
 let selected=home;
 let lastSection:string|null=null;

 beforeEach(()=>{
  vi.resetModules();
  vi.useFakeTimers({now:new Date('2026-11-16T10:00:00Z')});
  calls.forecast.mockClear();
  calls.station.mockClear();
  calls.radar.mockClear();
  calls.ensembles.mockClear();
  calls.radarImports=0;
  selected=home;
  lastSection=null;
  vi.stubGlobal('window',{setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout});
  vi.stubGlobal('navigator',{onLine:true,connection:{saveData:false,effectiveType:'4g'}});
  vi.stubGlobal('localStorage',{getItem:(key:string)=>
   key==='mid:lastLocation'?JSON.stringify(selected):
   key==='mid:last-dashboard-section:v1'?lastSection:null});
 });
 afterEach(()=>{
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
 });

 it('reuses the existing forecast until 45 seconds and then releases its resolved promise',async()=>{
  const api=await import('../../src/startupPreload');
  const first=api.beginStartupDashboardPreload();
  expect(first).not.toBeNull();
  expect(api.startupForecastForLocation(home)).toBe(first?.promise);
  await vi.advanceTimersByTimeAsync(44_999);
  expect(api.beginStartupDashboardPreload()).toBe(first);
  expect(api.startupForecastForLocation(home)).toBe(first?.promise);
  await vi.advanceTimersByTimeAsync(1);
  expect(api.startupForecastForLocation(home)).toBeNull();
  const replacement=api.beginStartupDashboardPreload();
  expect(replacement).not.toBe(first);
  expect(api.startupForecastForLocation(home)).toBe(replacement?.promise);
  expect(calls.forecast).toHaveBeenCalledTimes(2);
 });

 it('an expired old location cannot release the active new location lease',async()=>{
  const api=await import('../../src/startupPreload');
  const first=api.beginStartupDashboardPreload();
  expect(first).not.toBeNull();
  await vi.advanceTimersByTimeAsync(10_000);
  selected=other;
  const second=api.beginStartupDashboardPreload();
  expect(second).not.toBe(first);
  await vi.advanceTimersByTimeAsync(35_000);
  expect(api.startupForecastForLocation(other)).toBe(second?.promise);
  await vi.advanceTimersByTimeAsync(10_000);
  expect(api.startupForecastForLocation(other)).toBeNull();
 });

 it('does not import a previously selected map renderer after startup was aborted',async()=>{
  lastSection='composite';
  const api=await import('../../src/startupPreload');
  const first=api.beginStartupDashboardPreload();
  expect(first).not.toBeNull();
  first?.abort();
  await vi.advanceTimersByTimeAsync(1_000);
  await first?.interfacePromise;
  expect(calls.radarImports).toBe(0);
  // Aborting a visual warmup never suppresses the already requested weather data.
  expect(calls.forecast).toHaveBeenCalledTimes(1);
 });
});
