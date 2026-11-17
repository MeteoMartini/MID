import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {describe,expect,it} from 'vitest';

const app=readFileSync('src/App.tsx','utf8');
const surroundings=readFileSync('src/CurrentSurroundings.tsx','utf8');
const css=readFileSync('src/CurrentSurroundings.css','utf8');
const mapLibre=readFileSync('src/MapLibreCore.tsx','utf8');

describe('MID Karten 1.14 · GPU-Eigentümer beim Umfeld→Großkarte-Übergang (Quellvertrag, KEINE Browser-QA)',()=>{
 it('compiles both production React TSX sources',()=>{
  for(const source of [app,surroundings])expect(()=>transformSync(source,{loader:'tsx',target:'es2022',jsx:'automatic'})).not.toThrow();
 });
 it('passes a real map workspace ownership state from the App into the existing compact component',()=>{
  expect(app).toContain("mapPaused={activeNavSection==='composite'&&dashboardModuleSettings.enabled.composite}");
  expect(surroundings).toContain('mapPaused?:boolean');
  expect(surroundings).toContain('timezone={timezone} mapPaused={mapPaused}');
  expect(surroundings).toContain('onOpen={(time,bounds)=>onOpen(');
 });
 it('unmounts the complete compact MapLibre subtree, rather than hiding the GPU canvas with CSS',()=>{
  expect(surroundings).toContain('{mapPaused?<p className="current-surroundings-map-paused"');
  expect(surroundings).toContain(':<MidMapLibre');
  expect(surroundings).toContain('</MidMapLibre>}');
  expect(css).toContain('.current-surroundings-map-paused{');
  expect(css).not.toMatch(/\.current-surroundings-maplibre\s*\{[^}]*display\s*:\s*none/);
  expect(mapLibre).toContain('map.remove()');
 });
 it('retains the current-place display mode, time readout and weather provenance outside the GPU subtree',()=>{
  expect(surroundings).toContain("useDisplayPreference('CurrentSurroundings.mode'");
  expect(surroundings).toContain('current-surroundings-data-status');
  expect(surroundings).toContain('Quellen und Datenstand');
  expect(surroundings).toContain('MID-Kartenbasis und Temperaturen');
 });
});
