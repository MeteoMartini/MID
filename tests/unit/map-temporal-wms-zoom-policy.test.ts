import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {mapTemporalWmsZoomPolicy} from '../../src/mapTemporalWmsZoomPolicy';

const now='2026-11-17T06:10:00.000Z';
const frame='2026-11-17T06:15:00Z';
const revision=(source:string,stamp:string,r:number)=>
 source+'?time='+encodeURIComponent(stamp)+'&_mid_revision='+mapTemporalWmsZoomPolicy(stamp,false,r).revision;

describe('MID native MapLibre WMS zoom retention: bidirectional weather maps',()=>{
 it('keeps the exact UTC observation WMS URL stable across zoom revisions',()=>{
  const p1=mapTemporalWmsZoomPolicy(now,false,0);
  const p2=mapTemporalWmsZoomPolicy(now,false,7);
  expect(p1).toEqual({retainDuringZoom:true,revision:0});
  expect(p2).toEqual(p1);
  expect(revision('https://example.invalid/wms',now,0)).toBe(revision('https://example.invalid/wms',now,7));
 });
 it('retains a genuine future DWD radar nowcast but never reclassifies the source time',()=>{
  expect(mapTemporalWmsZoomPolicy(frame,false,10)).toEqual({retainDuringZoom:true,revision:0});
  expect(revision('https://example.invalid/wms',frame,11)).not.toBe(revision('https://example.invalid/wms',now,11));
 });
 it('makes latest/untimed snapshots refresh after zoom, never mislabels them as a dated original',()=>{
  expect(mapTemporalWmsZoomPolicy(now,true,5)).toEqual({retainDuringZoom:false,revision:5});
  expect(mapTemporalWmsZoomPolicy(undefined,false,4)).toEqual({retainDuringZoom:false,revision:4});
  expect(mapTemporalWmsZoomPolicy('latest',false,4)).toEqual({retainDuringZoom:false,revision:4});
  expect(mapTemporalWmsZoomPolicy('2026-11-17T06:15:00+01:00',false,4)).toEqual({retainDuringZoom:false,revision:4});
  expect(mapTemporalWmsZoomPolicy('2026-11-17T06:15:00',false,4)).toEqual({retainDuringZoom:false,revision:4});
  expect(mapTemporalWmsZoomPolicy('2026-11-17T06:15:00.000Z',false,4).retainDuringZoom).toBe(true);
 });
 it('fails safe for NaN, negative, fractional revision counters',()=>{
  expect(mapTemporalWmsZoomPolicy('latest',true,-5).revision).toBe(0);
  expect(mapTemporalWmsZoomPolicy('latest',true,Number.NaN).revision).toBe(0);
  expect(mapTemporalWmsZoomPolicy('latest',true,Number.POSITIVE_INFINITY).revision).toBe(0);
  expect(mapTemporalWmsZoomPolicy('latest',true,1.5).revision).toBe(0);
 });
 it('guards the actual primary radar and timed satellite render paths, not unrelated layers',()=>{
  const panel=readFileSync('src/RadarPanel.tsx','utf8');
  expect(panel).toContain("mapTemporalWmsZoomPolicy(iso,false,tileRevision)");
  expect(panel).toContain("if(rasterZooming&&!zoomPolicy.retainDuringZoom)return null");
  expect(panel).toContain("dwd-radar:");
  expect(panel).toContain("zoomPolicy.revision");
  expect(panel).toContain("rasterVersionUrl(dwdProxy,zoomPolicy.revision,iso)");
  expect(panel).toContain("(!rasterZooming||satelliteZoomPolicy.retainDuringZoom)");
  expect(panel).toContain("rasterVersionUrl(satelliteProxy,satelliteZoomPolicy.revision,key)");
  expect(panel).toContain("satelliteProduct?.latestOnly?tileRevision:0");
  expect(panel).toContain("{!rasterZooming&&showWarningsAtTime");
  expect(panel).toContain("{!rasterZooming&&visibleModelLines");
  expect(panel).toContain("satelliteUntimed=Boolean(satelliteProduct?.latestOnly)");
 });
 it('verifies this map is actually MapLibre, not a Leaflet WMSTileLayer',()=>{
  const compat=readFileSync('src/MapLibreLegacyCompat.tsx','utf8');
  const map=readFileSync('src/MapLibreCore.tsx','utf8');
  expect(compat).toContain("import {GeoJsonLayers,HtmlMarker,MidMapLibre,RasterTileLayer,VectorTileLayers,WmsTileLayer");
  expect(compat).toContain("<WmsTileLayer id={id} baseUrl={url}");
  expect(map).toContain("map.addSource(sourceId,{type:'raster',tiles:[retryUrl]");
  expect(map).toContain("map.isSourceLoaded(sourceId)");
  expect(map).toContain("map.on('sourcedata',idleHandler)");
  expect(map).toContain("map.on('idle',idleHandler)");
 });
});
