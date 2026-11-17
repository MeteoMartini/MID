import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {describe,expect,it} from 'vitest';
import {mapTemporalWmsZoomPolicy} from '../../src/mapTemporalWmsZoomPolicy';

const runner=readFileSync('scripts/verify-map-native-wms-zoom-browser-0985487.mjs','utf8');
const fixture=readFileSync('scripts/fixtures/map-native-wms-zoom-browser.tsx','utf8');

describe('MapLibre native WMS zoom real-browser QA admission (not a browser execution)',()=>{
 it('parses a real pinned-Playwright runner and a real Vite TSX/React fixture',()=>{
  expect(()=>transformSync(runner,{loader:'js',target:'node22'})).not.toThrow();
  expect(()=>transformSync(fixture,{loader:'tsx',target:'es2022',jsx:'automatic'})).not.toThrow();
  expect(runner).toContain("execFileSync('npm',['exec','--yes','--package=playwright@1.56.1'");
  expect(runner).toContain('pw.chromium.launch(');
  expect(runner).toContain("createServer({server:{host:'127.0.0.1'");
  expect(runner).toContain('MID_MAPLIBRE_NATIVE_WMS_ZOOM_BROWSER');
 });
 it('checks exact MapLibre source INSTANCE identities during and after zoom, not only DOM text',()=>{
  expect(fixture).toContain("import {MidMapLibre,ImageQuadLayer,useMidMap} from '../../src/MapLibreCore'");
  expect(fixture).toContain("import {WMSTileLayer,useMapEvents} from '../../src/MapLibreLegacyCompat'");
  expect(fixture).toContain('useMapEvents({zoomstart:onStart,zoomend:onEnd})');
  expect(fixture).toContain('map?.easeTo(');
  expect(runner).toContain('map.getSource(id)===window.__midZoomOriginalWms');
  expect(runner).toContain('map.getSource(id)===window.__midZoomOriginalQuad');
  expect(runner).toContain("await waitReady(page)");
  expect(runner).toContain('map.isSourceLoaded(id)');
  expect(runner).toContain("new URL(url).searchParams.get('time')===TEST_OBS");
  expect(runner).toContain('originalTimePreserved:true');
 });
 it('separates real-source continuity from mandatory mutable latest refresh and synthetic weather pixels',()=>{
  expect(runner).toContain("latestRefreshed:true");
  expect(runner).toContain('assert.ok(replaced');
  expect(runner).toContain("mutable.wmsUrls[0].includes('revision=2')");
  expect(runner).toContain("assert.ok(when===null||when===TEST_OBS||when===TEST_FUTURE");
  expect(runner).toContain("X-MID-QA-Source");
  expect(runner).toContain('synthetic:true');
  expect(runner).toContain("for(const width of [390,1024])");
  expect(runner).toContain("for(const theme of ['light','dark'])");
  expect(runner).toContain("assert.deepEqual(errors,[]");
  expect(mapTemporalWmsZoomPolicy('2026-11-17T06:15:00.000Z',false,3)).toEqual({retainDuringZoom:true,revision:0});
  expect(mapTemporalWmsZoomPolicy(undefined,true,3)).toEqual({retainDuringZoom:false,revision:3});
 });
 it('proves actual MID renderer is MapLibre raster source and not Leaflet',()=>{
  const core=readFileSync('src/MapLibreCore.tsx','utf8');
  const compat=readFileSync('src/MapLibreLegacyCompat.tsx','utf8');
  expect(core).toContain("map.addSource(sourceId,{type:'raster',tiles:[retryUrl]");
  expect(core).toContain("map.on('sourcedata',idleHandler)");
  expect(core).toContain('map.isSourceLoaded(sourceId)');
  expect(compat).toContain("<WmsTileLayer id={id} baseUrl={url}");
  expect(compat).not.toContain("from 'react-leaflet'");
 });
});
