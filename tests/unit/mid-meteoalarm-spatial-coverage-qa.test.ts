import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const source=readFileSync('worker-src/00-core-observations.js','utf8');
const aggregate=readFileSync('worker/metar-proxy.js','utf8');
const top=readFileSync('worker.js','utf8');
const begin=source.indexOf('async function officialAlerts(');
const end=source.indexOf('const METEOALARM_EDR_COLLECTION=',begin);
const official=source.slice(begin,end);
describe('MID #411: no blanket point-verified claim for official BBox-only warnings',()=>{
 it('keeps worker source and production mirrors identical',()=>{
  expect(begin).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(begin);
  expect(aggregate.startsWith(source)).toBe(true);
  expect(top).toBe(aggregate);
 });
 it('does not certify all European warning zones from a spatially mixed fallback',()=>{
  expect(official).toContain('Ortszuordnung je Warnung prüfen');
  expect(official).not.toContain('koordinatengeprüft');
  expect(official).toContain('pointContext.selection');
  expect(official).toContain("'official-map-polygon'");
  expect(official).toContain("'local-name-plus-bbox'");
  expect(official).toContain("'smallest-bbox-per-hazard-fallback'");
  expect(official).toContain('areaResolutionError:pointContextError||pointContext?.geometryError');
 });
 it('does not change official CAP messages, valid time, severity or dedupe',()=>{
  expect(source).toContain('function localAreaMatch(');
  expect(source).toContain('function alertShouldReplace(');
  expect(source).toContain('function dedupeAlerts(');
  expect(source).toContain('async function meteoalarmPointGeometry(');
  expect(official).toContain('alerts=dedupeAlerts([...capAlerts,...pointAlerts])');
 });
});
