import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {describe,expect,it} from 'vitest';

const app=readFileSync('src/App.tsx','utf8');
const surroundings=readFileSync('src/CurrentSurroundings.tsx','utf8');
const workspace=readFileSync('src/MapWorkspacePanel.tsx','utf8');
const workspaceCss=readFileSync('src/MapWorkspace.css','utf8');
const css=readFileSync('src/CurrentSurroundings.css','utf8');
const mapLibre=readFileSync('src/MapLibreCore.tsx','utf8');
const fixture=readFileSync('scripts/fixtures/map-gpu-owner-bidirectional-browser.tsx','utf8');
const runner=readFileSync('scripts/verify-map-gpu-owner-bidirectional-browser-0985487.mjs','utf8');

describe('MID Karten 1.14 · bidirektionaler GPU-Eigentümer für Umfeld-/Großkarte (Quellvertrag, KEINE Browser-QA)',()=>{
 it('compiles both production React TSX sources',()=>{
  for(const source of [app,surroundings,workspace])expect(()=>transformSync(source,{loader:'tsx',target:'es2022',jsx:'automatic'})).not.toThrow();
 });
 it('passes a real map workspace ownership state from the App into the existing compact component',()=>{
  expect(app).toContain("const mapRenderOwner=choosePrimaryMapOwner(activeNavSection,dashboardModuleSettings.enabled.current,dashboardModuleSettings.enabled.composite)");
  expect(app).toContain("mapPaused={mapRenderOwner!=='compact'}");
  expect(app).toContain("gpuPaused={mapRenderOwner!=='workspace'}");
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
  expect(mapLibre).toContain("map.on('style.load',handleRestoredStyle)");
  expect(mapLibre).toContain("map.off('style.load',handleRestoredStyle)");
  expect(mapLibre).toContain("addEventListener('webglcontextrestored',handleContextRestored)");
  expect(mapLibre).toContain("removeEventListener('webglcontextrestored',handleContextRestored)");
 });
 it('unmounts the expensive FULL map subtree when the compact preview or another section is active',()=>{
  expect(workspace).toContain('gpuPaused?:boolean');
  expect(workspace).toContain('props.gpuPaused?<p className="map-workspace-paused"');
  expect(workspace).toContain('<MemoLazyUnifiedWeatherMap {...props} requestedProductId={requestedProductId}/>');
  expect(workspace).toContain('<GeoSphereIncaNowcast lat={props.lat} lon={props.lon} timezone={props.timezone}/>');
  expect(workspaceCss).toContain('.map-workspace-paused{');
 });
 it('admits real Chromium fixture with simultaneously mounted compact/full components',()=>{
  for(const [source,loader] of [[fixture,'tsx'],[runner,'js']] as const)
   expect(()=>transformSync(source,{loader,target:'es2022',jsx:'automatic'})).not.toThrow();
  expect(fixture).toContain('<CurrentSurroundings lat={50.82} lon={7.14}');
  expect(fixture).toContain('<MapWorkspacePanel lat={50.82} lon={7.14}');
  expect(fixture).toContain("mapPaused={owner!=='compact'}");
  expect(fixture).toContain("gpuPaused={owner!=='workspace'}");
  expect(runner).toContain("document.querySelectorAll('.maplibregl-map')");
  expect(runner).toContain('for(const width of [320,390,430,834,1024,1440])');
  expect(runner).toContain('nativeIos:false');
  expect(runner).toContain('extension.loseContext()');
  expect(runner).toContain('window.__midQaContextExtension.restoreContext()');
  expect(runner).toContain('midLayersRemountedAfterStyleLoad:true');
 });
 it('retains the current-place display mode, time readout and weather provenance outside the GPU subtree',()=>{
  expect(surroundings).toContain("useDisplayPreference('CurrentSurroundings.mode'");
  expect(surroundings).toContain('current-surroundings-data-status');
  expect(surroundings).toContain("useSurroundingsCloudImage(mode==='cloud'&&!mapPaused");
  expect(surroundings).toContain("if(mode!=='radar'||mapPaused)return;");
  expect(surroundings).toContain("if(mapPaused||mode!=='radar'||!radar||target===undefined)return;");
  expect(surroundings).toContain("const needsOpera=!mapPaused&&mode==='radar'");
  expect(surroundings).toContain("if(mapPaused||(mode==='radar'&&!radarAtNow)");
  expect(surroundings).toContain("const temperatureGrid=mapPaused||mode==='radar'");
  expect(surroundings).toContain('Kartendaten im Hintergrund pausiert · keine Aussage zur Datenverfügbarkeit');
  expect(surroundings).toContain("},[lat,lon,mode,mapPaused])");
  expect(surroundings).toContain("},[mapPaused])");
  expect(surroundings).toContain('Quellen und Datenstand');
  expect(surroundings).toContain('MID-Kartenbasis und Temperaturen');
 });
});