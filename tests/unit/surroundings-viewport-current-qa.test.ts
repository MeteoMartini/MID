import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {planSurroundingsViewportRaster} from '../../src/surroundingsViewportRaster';
import {summarizeSurroundingsOperaCoverage} from '../../src/surroundingsOperaCoverage';

const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
const capture=readFileSync('src/SurroundingsViewportCapture.tsx','utf8');
const observer=readFileSync('src/surroundingsViewportObserver.ts','utf8');

describe('MID Karten 1.17 #853: current Stable-bound viewport wiring',()=>{
 it('observes the post-fit camera and keeps original focus/detail handoff unchanged',()=>{
  expect(ui).toContain('<MapFitBounds south={south} west={west} north={north} east={east} padding={8} maxZoom={7}/>');
  expect(ui).toContain('<SurroundingsViewportCapture onChange={plan=>setRasterState({lat,lon,plan})}/>');
  expect(ui.indexOf('<SurroundingsViewportCapture')).toBeGreaterThan(ui.indexOf('<MapFitBounds'));
  expect(ui).toContain('onOpen(mode===\'cloud\'?cloudTarget:mode===\'radar\'?displayTime:undefined,{west,south,east,north})');
  expect(observer).toContain('map.getBounds()');
  expect(observer).toContain('map.getContainer()');
  expect(observer).toContain("map.on('resize',schedule)");
  expect(observer).toContain("map.on('moveend',schedule)");
  expect(capture).toContain('observeSurroundingsViewportRaster');
 });
 it('uses one exact viewport footprint and pixel budget for WMS, quads and OPERA',()=>{
  expect(ui).toContain('const bounds=rasterPlan?.bbox??\'\';');
  expect(ui).toContain('const rasterPlan=rasterState?.lat===lat&&rasterState.lon===lon?rasterState.plan:undefined;');
  expect(ui).toContain('const operaRequestKey=JSON.stringify([lat,lon,bounds,rasterPlan?.width,rasterPlan?.height]);');
  expect(ui).toContain('bbox:plan.bbox,width:String(plan.width),height:String(plan.height)');
  expect(ui).toContain("imageUrl('dwd',rvLayer,target,radarWmsPlan)");
  expect(ui).toContain('imageUrl(satellite.provider,satellite.layer,satelliteTime,geographicWmsPlan)');
  expect(ui).toContain('key={`surroundings-radar:${operaRequestKey}`}');
  expect(ui).toContain('key={`surroundings-clouds:${operaRequestKey}`}');
  expect(ui).toContain('bounds={mapBounds}');
  expect(ui).toContain('canvas.width=Math.max(16,Math.ceil(admittedRasterPlan.width/2));');
  expect(ui).toContain('canvas.height=Math.max(16,Math.ceil(admittedRasterPlan.height/2));');
  expect(ui).not.toContain("bbox:bounds,width:'512'");
  const plan=planSurroundingsViewportRaster({west:4,south:50,east:10,north:51.5},{width:1024,height:285});
  expect(plan).toBeDefined();
  expect(plan!.width*plan!.height).toBeLessThanOrEqual(512*256);
 });
 it('keeps OPERA phase on Mercator rows and counts valid coverage rather than a Boolean',()=>{
  expect(ui).toContain('const rowLatitudes=Array.from({length:canvas.height}');
  expect(ui).toContain('mercatorLatitudeAtImageFraction(north,south,(y+.5)/canvas.height)');
  expect(ui).toContain('if(point.covered)validPixels++;');
  expect(ui).toContain('summarizeSurroundingsOperaCoverage(validPixels,canvas.width*canvas.height)');
  expect(ui).toContain("if(!coverage||coverage.kind==='none')return;");
  expect(ui).toContain('lat:rowLatitudes[Math.floor(y)]');
  expect(ui).not.toContain('covered ||= point.covered');
  expect(ui).not.toContain('lat:north-y*(north-south)/canvas.height');
  expect(summarizeSurroundingsOperaCoverage(1,32768)?.kind).toBe('partial');
  expect(summarizeSurroundingsOperaCoverage(0,32768)?.kind).toBe('none');
 });
 it('revokes invalid map geometries and does not infer dry weather from NoData',()=>{
  expect(ui).toContain("if(!proxy||!plan)return '';");
  expect(ui).toContain("if(!needsOpera||!rasterPlan)return;");
  expect(ui).toContain('if(controller.signal.aborted)return;');
  expect(ui).toContain('Teilabdeckung ${displayedOpera.coverage.percentageLabel} gültige Rasterzellen');
  expect(ui).toContain('Radar-/Satellitenausschnitt geometrisch nicht verfügbar; keine Wetterdaten als 0 interpretiert.');
  expect(planSurroundingsViewportRaster({west:170,south:40,east:-170,north:42},{width:390,height:220})).toBeUndefined();
 });
 it('uses source-advertised native Mercator WMS only for DWD RV; satellite projection remains gated',()=>{
  // Official DWD RV GetCapabilities advertises EPSG:3857 and native GetMap PNG.
  // No blanket EPSG:3857 attribution to EUMETSAT or another satellite layer.
  expect(ui).toContain("version:'1.1.1',srs:plan.srs");
  expect(ui).toContain("planSurroundingsMercatorWmsRaster(rasterPlan)");
  expect(ui).toContain("const radarWmsPlan=useMemo(");
  expect(ui).toContain("const geographicWmsPlan=useMemo(");
  expect(ui).toContain("srs:'EPSG:4326' as const");
  expect(ui).toContain('const admittedRasterPlan=radarWmsPlan;');
  expect(ui).toContain("imageUrl('dwd',rvLayer,target,radarWmsPlan)");
  expect(ui).toContain('imageUrl(satellite.provider,satellite.layer,satelliteTime,geographicWmsPlan)');
  expect(ui).not.toContain("version:'1.1.1',srs:'EPSG:4326'");
 });
});
