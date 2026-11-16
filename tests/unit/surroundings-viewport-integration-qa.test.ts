import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {planSurroundingsViewportRaster} from '../../src/surroundingsViewportRaster';

const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
const capture=readFileSync('src/SurroundingsViewportCapture.tsx','utf8');
const observer=readFileSync('src/surroundingsViewportObserver.ts','utf8');
const radarSelector=readFileSync('src/surroundingsRadarTimeline.ts','utf8');

describe('MID #853: full-viewport Rad/Sat integration without source or time fabrication',()=>{
 it('mounts a capture after the initial finite camera fit and reads real camera bounds',()=>{
  expect(ui).toContain('<MapFitBounds south={south} west={west} north={north} east={east} padding={8} maxZoom={7}/>');
  expect(ui).toContain('<SurroundingsViewportCapture onChange={plan=>setRasterState({lat,lon,plan})}/>');
  expect(ui.indexOf('<SurroundingsViewportCapture')).toBeGreaterThan(ui.indexOf('<MapFitBounds south='));
  expect(capture).toContain('observeSurroundingsViewportRaster(map,plan=>changeRef.current(plan)');
  expect(observer).toContain('map.getBounds()');
  expect(observer).toContain('map.getContainer()');
  expect(observer).toContain("map.on('moveend',schedule)");
  expect(observer).toContain("map.on('resize',schedule)");
  expect(observer).toContain("map.off('moveend',schedule)");
  expect(observer).toContain("map.off('resize',schedule)");
 });

 it('never uses the narrow focus BBOX as a weather-image BBOX',()=>{
  expect(ui).toContain("const bounds=rasterPlan?.bbox??'';");
  expect(ui).toContain("const rasterPlan=rasterState?.lat===lat&&rasterState.lon===lon?rasterState.plan:undefined;");
  expect(ui).toContain("imageUrl('dwd',rvLayer,target,rasterPlan)");
  expect(ui).toContain("imageUrl(satellite.provider,satellite.layer,satelliteTime,rasterPlan)");
  expect(ui).toContain("if(!proxy||!plan)return '';");
  expect(ui).toContain("bbox:plan.bbox,width:String(plan.width),height:String(plan.height)");
  expect(ui).not.toContain("bbox:bounds,width:'512',height:'256'");
  expect(ui).not.toContain("imageUrl('dwd',rvLayer,target,bounds)");
 });

 it('shares precisely the same lat/lon footprint for image quads and OPERA pixel sampling',()=>{
  expect(ui).toContain('const mapBounds=useMemo(()=>rasterPlan?');
  expect(ui).toContain('rasterPlan.bounds.south,rasterPlan.bounds.west');
  expect(ui).toContain('rasterPlan.bounds.north,rasterPlan.bounds.east');
  expect(ui).toContain("mode==='radar'&&visibleClouds&&mapBounds&&<ImageQuadLayer");
  expect(ui).toContain("mode==='radar'&&mapBounds&&(displayedOpera??displayedRadar)&&<ImageQuadLayer");
  expect(ui).toContain("const {west,south,east,north}=admittedRasterPlan.bounds;");
  expect(ui).toContain('const admittedRasterPlan=rasterPlan;');
  expect(ui).toContain('canvas.width=Math.max(16,Math.ceil(admittedRasterPlan.width/2));');
  expect(ui).toContain('canvas.height=Math.max(16,Math.ceil(admittedRasterPlan.height/2));');
  expect(ui).toContain('lat:north-y*(north-south)/canvas.height');
  expect(ui).toContain('lng:west+x*(east-west)/canvas.width');
 });

 it('unmounts a stale geographical image on resize before the new footprint is ready',()=>{
  // ImageQuadLayer fades old frames while a new URL loads. That fade is
  // legitimate for a same-footprint time update, not for a different BBOX.
  expect(ui).toContain('key={`surroundings-clouds:${operaRequestKey}`}');
  expect(ui).toContain('key={`surroundings-radar:${operaRequestKey}`}');
  expect(ui).toContain('const operaRequestKey=JSON.stringify([lat,lon,bounds,rasterPlan?.width,rasterPlan?.height]);');
  expect(ui).toContain("mode==='radar'&&visibleClouds&&mapBounds&&<ImageQuadLayer");
  expect(ui).toContain("mode==='radar'&&mapBounds&&(displayedOpera??displayedRadar)&&<ImageQuadLayer");
  // The key must not incorporate selected radar/satellite time: normal
  // same-footprint updates should continue to use the existing smooth fade.
  expect(ui).not.toContain('key={`surroundings-radar:${radarTarget}');
 });

 it('keeps the unchanged selected-location focus and independent original times',()=>{
  expect(ui).toContain('const east=west+2.8,north=south+1.3;');
  expect(ui).toContain("onOpen(mode==='cloud'?cloudTarget:mode==='radar'?displayTime:undefined,{west,south,east,north})");
  expect(ui).toContain('radarOriginalForStep(catalog,now,radarStep,dwdArea)');
  expect(ui).toContain('nearestVerifiedOriginal(satellite?.times,radarTarget,now)');
  expect(ui).toContain('selectVerifiedSurroundingsRadarFrame(loaded,radar,radarOriginal)');
  expect(ui).toContain('selectVerifiedSurroundingsOperaFrame(opera,operaRequestKey,now)');
  expect(ui).toContain('phaseImage?.requestKey===operaRequestKey');
  expect(radarSelector).toContain('selectVerifiedSurroundingsRadarFrame');
 });

 it('revokes old/future/incompatible OPERA frames when geometry changes',()=>{
  expect(ui).toContain('const operaRequestKey=JSON.stringify([lat,lon,bounds,rasterPlan?.width,rasterPlan?.height]);');
  expect(ui).toContain('if(!needsOpera||!rasterPlan)return;');
  expect(ui).toContain('const controller=new AbortController();');
  expect(ui).toContain('if(controller.signal.aborted)return;');
  expect(ui).toContain('setOpera({url:canvas.toDataURL(),time,requestKey:operaRequestKey})');
  expect(ui).toContain('setPhaseImage({url:phase.colors.size?canvas.toDataURL():undefined,time,requestKey:operaRequestKey})');
 });

 it('distinguishes invalid or unsupported map geometry from a dry observation',()=>{
  expect(ui).toContain('!rasterPlan?\'Radar-/Satelliten-Ausschnitt geometrisch nicht verfügbar; keine Wetterdaten als 0 interpretiert.\'');
  expect(ui).toContain("const needsOpera=mode==='radar'&&radarAtNow&&Boolean(rasterPlan)");
  const plan=planSurroundingsViewportRaster({west:170,south:40,east:-170,north:42},{width:390,height:220});
  expect(plan).toBeUndefined();
  const germany=planSurroundingsViewportRaster({west:5.7,south:50.17,east:8.5,north:51.47},{width:390,height:220});
  expect(germany).toBeDefined();
  expect(germany!.bbox.split(',').length).toBe(4);
  expect(germany!.width).toBeGreaterThan(16);
  expect(germany!.height).toBeGreaterThan(16);
 });
});