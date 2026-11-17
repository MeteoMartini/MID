import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {MapWorkspaceErrorBoundary} from '../../src/MapWorkspaceErrorBoundary';
import {readFileSync} from 'node:fs';

describe('MID map open: contained React failure and local retry',()=>{
 it('retains descendant content until an actual React error is reported',()=>{
  const boundary=new MapWorkspaceErrorBoundary({children:<p>Originalkarte</p>,onRetry:()=>{}});
  expect(renderToStaticMarkup(boundary.render())).toContain('Originalkarte');
  expect(MapWorkspaceErrorBoundary.getDerivedStateFromError()).toEqual({error:true});
 });
 it('renders an accessible local fallback rather than blanking the weather application',()=>{
  const retry=vi.fn();
  const boundary=new MapWorkspaceErrorBoundary({children:<p>Map</p>,onRetry:retry});
  boundary.state={error:true};
  const fallback=renderToStaticMarkup(boundary.render());
  expect(fallback).toContain('role="alert"');
  expect(fallback).toContain('Kartenansicht vorübergehend nicht verfügbar');
  expect(fallback).toContain('Karte erneut versuchen');
  expect(fallback).not.toContain('Originalkarte');
 });
 it('bounds locally saved render diagnostics and handles blocked session storage',()=>{
  const boundary=new MapWorkspaceErrorBoundary({children:<p/>,onRetry:()=>{}});
  const setItem=vi.fn();
  vi.stubGlobal('sessionStorage',{setItem});
  boundary.componentDidCatch(new Error('x'.repeat(400)),{componentStack:'y'.repeat(2500)} as any);
  expect(setItem).toHaveBeenCalledOnce();
  const [key,raw]=setItem.mock.calls[0] as [string,string];
  const record=JSON.parse(raw);
  expect(key).toBe('mid:map:last-render-error');
  expect(record.message).toHaveLength(280);
  expect(record.component).toHaveLength(1200);
  vi.stubGlobal('sessionStorage',{setItem:()=>{throw Error('blocked')}});
  expect(()=>boundary.componentDidCatch(new Error('test'),{componentStack:''} as any)).not.toThrow();
  vi.unstubAllGlobals();
 });
 it('mounts one boundary around both MapWorkspace descendants and remounts only subtree on retry',()=>{
  const src=readFileSync('src/MapWorkspacePanel.tsx','utf8');
  expect(src).toContain('MapWorkspaceErrorBoundary');
  expect(src).toContain('key={`${props.lat}:${props.lon}:${retryRevision}`}');
  expect(src).toContain('onRetry={()=>setRetryRevision(value=>value+1)}');
  expect(src.indexOf('<MapWorkspaceErrorBoundary')).toBeLessThan(src.indexOf('<MemoLazyUnifiedWeatherMap'));
  expect(src.indexOf('<GeoSphereIncaNowcast')).toBeLessThan(src.indexOf('</MapWorkspaceErrorBoundary>'));
  expect(src).toContain('observationRequest?:');
 });
 it('keeps real app handoff and duplicate-tap suppression while old full-gate fixes remain mandatory',()=>{
  const c=readFileSync('src/CurrentSurroundings.tsx','utf8');
  const app=readFileSync('src/App.tsx','utf8');
  expect(c).toContain('disabled={openingMap}');
  expect(c).toContain('aria-busy={openingMap}');
  expect(c).toContain('setMapOpenError(');
  expect(c).toContain('onOpen(mode===');
  expect(app).toContain('setSurroundingsMapRequest(request);navigateToDashboardSection(\'composite\')');
  expect(c).toContain('current-surroundings-map-open-error');
 });
});
