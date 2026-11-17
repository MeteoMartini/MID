import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {buildAvailableCompositeTimeline} from '../../src/CompositeTimeline';
import {radarOriginalForStep,selectVerifiedSurroundingsRadarFrame} from '../../src/surroundingsRadarTimeline';
import type {CompositeProductTimes} from '../../src/CompositeData';

const read=(name:string)=>readFileSync(name,'utf8');
const point=(stamp:string)=>Date.parse(stamp);
const now=point('2026-11-17T06:17:00Z');
const observed=point('2026-11-17T06:15:00Z');
const observedOlder=point('2026-11-17T06:10:00Z');
const future=point('2026-11-17T06:30:00Z');
const catalog:CompositeProductTimes={
 satelliteDay:[],satelliteIr:[],satellitePrecip:[],mtgLightning:[],dwdLightning:[],
 dwdRadar:[new Date(observedOlder).toISOString(),observed/1000],
 dwdRadarNowcast:[new Date(future).toISOString()]
};

describe('MID: Wetter im Umfeld ↔ voller Kartenbereich (bidirektionale Fachparität)',()=>{
 it('keeps the future obligation binding on every agent, explicitly for both directions',()=>{
  const agents=read('AGENTS.md');
  const policy=read('docs/implementation/MID_MAP_SURFACE_BIDIRECTIONAL_PARITY_2026_11_17.md');
  expect(agents).toContain('## Bidirectional weather map parity');
  expect(agents).toContain('Every change to ');
  expect(agents).toContain('MUST assess **both** Wetter im Umfeld and the full Kartenbereich in **both directions**');
  expect(agents).toContain('cross-surface impact matrix');
  expect(agents).toContain('tests/unit/map-surface-bidirectional-parity.test.ts');
  expect(policy).toContain('## Abnahmematrix');
  expect(policy).toContain('## Release-feste Definition of Done');
  expect(policy).toContain('Wetter im Umfeld und großer Kartenbereich');
  expect(policy).toContain('noch offen');
 });
 it('resolves the SAME source-confirmed radar observations and nowcast in both time models',()=>{
  const frames=buildAvailableCompositeTimeline(now/1000,{
   source:'DWD',phaseSources:{observation:'DWD · Beobachtung',nowcast:'DWD · Nowcast'},
   observations:[observedOlder/1000,observed/1000],nowcasts:[future/1000]
  },45,120);
  expect(frames.map(x=>x.time)).toEqual([observedOlder/1000,observed/1000,future/1000]);
  expect(frames.map(x=>x.phase)).toEqual(['observation','observation','nowcast']);
  expect(frames.some(f=>f.time===now/1000)).toBe(false);
  expect(radarOriginalForStep(catalog,now,0)).toEqual({time:observed,kind:'Beobachtung'});
  expect(radarOriginalForStep(catalog,now,1)).toBeUndefined(); // 06:20Z has no original: NoData, not an invented nowcast
  expect(radarOriginalForStep(catalog,now,3)).toEqual({time:future,kind:'Nowcast'}); // 06:30Z is the genuine DWD-RV original
  expect(radarOriginalForStep({...catalog,dwdRadarNowcast:[]},now,1)).toBeUndefined();
 });
 it('rejects an old map request identity even if its WMS pixels were valid',()=>{
  const prev={url:'https://example.invalid/wms?TIME=2026-11-17T06%3A15%3A00Z',time:observed,kind:'Beobachtung' as const};
  expect(selectVerifiedSurroundingsRadarFrame(prev,prev.url,{time:observed,kind:'Beobachtung'})).toEqual(prev);
  expect(selectVerifiedSurroundingsRadarFrame(prev,prev.url,{time:future,kind:'Nowcast'})).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(prev,prev.url+'&bbox=wrong',{time:observed,kind:'Beobachtung'})).toBeUndefined();
 });
 it('regresses BOTH renderer readiness barriers while allowing different renderer technologies',()=>{
  const surrounds=read('src/CurrentSurroundings.tsx');
  const map=read('src/RadarPanel.tsx');
  const quad=read('src/MapLibreCore.tsx');
  expect(surrounds).toContain('radarOriginalForStep(catalog,now,radarStep,dwdArea)');
  expect(surrounds).toContain('selectVerifiedSurroundingsRadarFrame(loaded,radar,radarOriginal)');
  expect(surrounds).toContain('<ImageQuadLayer');
  expect(surrounds).toContain('loadCompositeTimes(lat,lon,controller.signal)');
  expect(quad).toContain("map.on('render',readiness)");
  expect(quad).toContain('map.isSourceLoaded(source)');
  expect(quad).toContain('prefers-reduced-motion: reduce');
  expect(map).toContain('buildAvailableCompositeTimeline(referenceSeconds,timelineContract');
  expect(map).toContain('retainLoadedRadarStand(');
  expect(map).toContain('<WMSTileLayer');
  expect(map).toContain('markRadarFrameLoaded(frame.time)');
  expect(map).toContain('loadedSatelliteFrames.has(requestedSatelliteKey)');
 });
 it('keeps cloud original cadence and phase identity separate from radar/satellite UI',()=>{
  const surrounds=read('src/CurrentSurroundings.tsx');
  const model=read('src/currentSurroundingsCloudImage.ts');
  const master=read('src/RadarPanel.tsx');
  expect(surrounds).toContain('surroundingsQuarterHourTarget(now,cloudStep)');
  expect(surrounds).toContain("mode==='cloud'");
  expect(master).toContain("selectedFrame?.phase==='nowcast'");
  expect(master).toContain('satelliteTimeline');
  expect(model).toContain('matchesSurroundingsCloudRequest(result.image,lat,lon,target)');
  expect(model).toContain('Date.parse(ref.time)===now&&weatherRefs.some(');
 });
});
