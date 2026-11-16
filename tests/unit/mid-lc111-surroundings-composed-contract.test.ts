import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

// Combined-source invariant: the independent specialty PRs each passed in
// isolation but an earlier hunk merge dropped valid UI/fixture assertions.
// This is a static composition guard, not a provider or real-device test.
const component=readFileSync('src/CurrentSurroundings.tsx','utf8');
const browser=readFileSync('scripts/verify-unified-map-browser-0985167.mjs','utf8');

describe('MID LC 1.11 – cloud-original and Rad/Sat viewport coexistence',()=>{
 it('preserves existing cloud/SigWx original-reference display and #853 viewport state',()=>{
  expect(component).toContain('id="surroundings-original-reference-cloud-weather"');
  expect(component).toContain('cloudForecast.reference?<><strong>Referenzbild');
  expect(component).toContain('SurroundingsViewportCapture onChange={plan=>setRasterState');
  expect(component).toContain("mode==='radar'&&visibleClouds&&mapBounds&&");
  expect(component).toContain("mode==='radar'&&mapBounds&&(displayedOpera??displayedRadar)");
 });
 it('does not erase satellite spectrum provenance or OPERA partial coverage',()=>{
  expect(component).toContain('selectSurroundingsSatelliteOriginal(catalog,radarTarget,now,radarStep)');
  expect(component).toContain("satelliteOriginal?.spectrum==='IR'?'Infrarot (IR)':'RGB'");
  expect(component).toContain('summarizeSurroundingsOperaCoverage(validPixels,canvas.width*canvas.height)');
  expect(component).toContain("if(!coverage||coverage.kind==='none')return;");
  expect(component).toContain("displayedOpera.coverage.kind==='partial'");
 });
 it('retains both original map-open/flag checks and the real mock raster pixel evidence',()=>{
  expect(browser).toContain('await verifyDesktopModelFlags();await verifySurroundingsOpenMap();await verifyHomeEndControlledSeek();');
  expect(browser).toContain('async function assertSurroundingsViewportPixels(');
  expect(browser).toContain('await assertSurroundingsViewportPixels(page,requests,width,theme)');
  expect(browser).toContain('const magentaWms=Buffer.from(');
  expect(browser).toContain("if(mode==='composite-wms')return route.fulfill({body:magentaWms,contentType:'image/png'});");
  expect(browser).toContain("satelliteRgbProduct:{provider:'eumetsat'");
  expect(browser).toContain("satelliteIrProduct:{provider:'eumetsat'");
  expect(browser).toContain('[320,390,430,834,844,1024,1440].includes(width)');
 });
});
