import {readFileSync} from 'node:fs';
import {matchesSurroundingsCloudRequest} from '../../src/surroundingsCloudOriginalGuard';
import {describe,expect,it} from 'vitest';
import {
 radarOriginalForStep,nearestVerifiedOriginal,sourceOriginalTimes,
 surroundingsRadarTarget,selectVerifiedSurroundingsRadarFrame,selectVerifiedSurroundingsOperaFrame,SURROUNDINGS_RADAR_MIN_STEP,SURROUNDINGS_RADAR_MAX_STEP
} from '../../src/surroundingsRadarTimeline';

const now=Date.parse('2026-11-15T12:07:00Z');
const observed=new Date(now-5*60000).toISOString(),future=new Date(now+15*60000).toISOString();
const catalog={dwdRadar:[observed],dwdRadarNowcast:[future]};

describe('Umfeld Rad/Sat: 15-min selector uses only admitted ORIGINAL source timestamps',()=>{
 it('moves in exactly 15-minute steps relative to the real clock, including UTC DST',()=>{
  expect(SURROUNDINGS_RADAR_MIN_STEP).toBe(-3);
  expect(SURROUNDINGS_RADAR_MAX_STEP).toBe(8);
  expect(surroundingsRadarTarget(now,1)-surroundingsRadarTarget(now,0)).toBe(900000);
  expect(surroundingsRadarTarget(now,-1)-surroundingsRadarTarget(now,0)).toBe(-900000);
  expect(surroundingsRadarTarget(Date.parse('2026-10-25T01:55:00Z'),1)).toBe(Date.parse('2026-10-25T02:10:00Z'));
  for(const step of [-4,9,NaN,1.2])expect(Number.isNaN(surroundingsRadarTarget(now,step))).toBe(true);
 });
 it('selects true recent radar observations and independent nowcast, never invents frames',()=>{
  expect(radarOriginalForStep(catalog,now,0)).toEqual({time:now-5*60000,kind:'Beobachtung'});
  expect(radarOriginalForStep(catalog,now,1)).toEqual({time:now+15*60000,kind:'Nowcast'});
  expect(radarOriginalForStep(catalog,now,2)).toBeUndefined();
  expect(radarOriginalForStep(catalog,now,-1)).toBeUndefined();
  expect(radarOriginalForStep(catalog,now,1,false)).toBeUndefined();
  expect(radarOriginalForStep(undefined,now,1)).toBeUndefined();
 });
 it('rejects missing/foreign original, time outside tolerance and future observations',()=>{
  expect(nearestVerifiedOriginal([now-9*60000],now,now)).toBeUndefined();
  expect(nearestVerifiedOriginal([now+3*60000],now,now)).toBeUndefined();
  expect(nearestVerifiedOriginal([now-2*60000],now,now)).toBe(now-2*60000);
  expect(nearestVerifiedOriginal([now-2*60000],now+15*60000,now,true)).toBeUndefined();
  expect(nearestVerifiedOriginal([now+15*60000],now+15*60000,now,true)).toBe(now+15*60000);
 });
 it('rejects radar frames from the wrong location/bbox, time, source or phase during scrubbing',()=>{
  const wms='https://example.invalid/wms?layers=radar&bbox=7,50,8,51&time=2026-11-15T12%3A02%3A00Z';
  const data={url:wms,time:now-5*60000,kind:'Beobachtung' as const};
  const expected={time:data.time,kind:'Beobachtung' as const};
  expect(selectVerifiedSurroundingsRadarFrame(data,wms,expected)).toBe(data);
  expect(selectVerifiedSurroundingsRadarFrame(data,wms.replace('bbox=7,50,8,51','bbox=8,50,9,51'),expected)).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(data,wms.replace('layers=radar','layers=nowcast'),expected)).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(data,wms,{...expected,time:expected.time+900000})).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(data,wms,{...expected,kind:'Nowcast'})).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(data,'',expected)).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(data,wms,undefined)).toBeUndefined();
  expect(selectVerifiedSurroundingsRadarFrame(undefined,wms,expected)).toBeUndefined();
 });
 it('OPERA fallback never reuses observations or phase from a foreign location',()=>{
  const url='data:image/png;base64,aa';
  const frame={url,time:now-2*60_000,requestKey:JSON.stringify([50.7,7.1,'7,50,8,51'])};
  expect(selectVerifiedSurroundingsOperaFrame(frame,frame.requestKey,now)).toBe(frame);
  expect(selectVerifiedSurroundingsOperaFrame(frame,JSON.stringify([50.8,7.1,'7,50,8,51']),now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame(frame,JSON.stringify([50.7,7.1,'8,50,9,51']),now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame(frame,'',now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame({...frame,time:now-46*60_000},frame.requestKey,now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame({...frame,time:now+91_000},frame.requestKey,now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame({...frame,url:'invalid'},frame.requestKey,now)).toBeUndefined();
  expect(selectVerifiedSurroundingsOperaFrame(undefined,frame.requestKey,now)).toBeUndefined();
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).toContain('selectVerifiedSurroundingsOperaFrame(opera,operaRequestKey,now)');
  expect(ui).toContain('phaseImage?.requestKey===operaRequestKey');
  // Original source identity is still required; the enriched payload also carries real coverage.
  expect(ui).toContain('setOpera({url:canvas.toDataURL(),time,requestKey:operaRequestKey,coverage})');
  expect(ui).toContain('const coverage=summarizeSurroundingsOperaCoverage(validPixels,canvas.width*canvas.height)');
  expect(ui).toContain("if(!coverage||coverage.kind==='none')return;");
  expect(ui).toContain('setPhaseImage({url:phase.colors.size?canvas.toDataURL():undefined,time,requestKey:operaRequestKey})');
 });
 it('normalises original source times in seconds/milliseconds/ISO, without rounding validity',()=>{
  const input=[new Date(now-5*60000).toISOString(),(now-5*60000)/1000,now-5*60000,'not-a-time'];
  expect(sourceOriginalTimes(input)).toEqual([now-5*60000]);
 });
 it('UI persists mode; both modes display +/-15 and only exact WMS source files',()=>{
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).toContain("useDisplayPreference('CurrentSurroundings.mode','cloud',displayChoice('cloud','radar'))");
  expect(ui).toContain("mode==='radar'&&<>");
  expect(ui).toContain('Radar und Satellit 15 Minuten zurück');
  expect(ui).toContain('Radar und Satellit 15 Minuten vor');
  expect(ui).toContain('onChange={event=>setRadarStep(');
  expect(ui).toContain('radarOriginalForStep(catalog,now,radarStep,dwdArea)');
  expect(ui).toContain("radarStep>0?undefined:nearestVerifiedOriginal(satellite?.times,radarTarget,now)");
  expect(ui).toContain('selectVerifiedSurroundingsRadarFrame(loaded,radar,radarOriginal)');
  expect(ui).toContain('displayedOpera=needsOpera');
  expect(ui).not.toContain('Radar-Nowcast-Termin');
 });
 it('cloud originals never survive an unmatched quarter-hour, location or missing provenance',()=>{
  const valid=Date.parse('2026-11-15T12:15:00Z');
  const image={validTime:new Date(valid).toISOString(),requestLatitude:50.7800,requestLongitude:7.1100};
  expect(matchesSurroundingsCloudRequest(image,50.7800,7.1100,valid)).toBe(true);
  expect(matchesSurroundingsCloudRequest(image,50.7800,7.1100,valid+900000)).toBe(false);
  expect(matchesSurroundingsCloudRequest(image,50.7801,7.1100,valid)).toBe(false);
  expect(matchesSurroundingsCloudRequest(image,50.7800,7.1101,valid)).toBe(false);
  expect(matchesSurroundingsCloudRequest({validTime:image.validTime},50.7800,7.1100,valid)).toBe(false);
  expect(matchesSurroundingsCloudRequest({...image,validTime:'invalid'},50.7800,7.1100,valid)).toBe(false);
  expect(matchesSurroundingsCloudRequest(image,50.7800,7.1100,NaN)).toBe(false);
 });
 it('Cloud/SigWx runtime never constructs a pseudo 15-minute interpolated image',()=>{
  const cloud=readFileSync('src/currentSurroundingsCloudImage.ts','utf8');
  const loader=cloud.slice(cloud.indexOf('export async function loadVerifiedSurroundingsCloud('),cloud.indexOf('export function useSurroundingsCloudImage('));
  expect(loader).toContain('if(Date.parse(ref.time)!==now)continue;');
  expect(loader).toContain('Date.parse(ref.time)===now&&weatherRefs.some(');
  expect(loader).not.toContain('interpolateVerifiedSurroundingsCloud(');
  expect(loader).not.toContain('const blend=');
  expect(cloud).toContain('previous.image&&Date.parse(previous.image.validTime)===target');
  expect(cloud).toContain('matchesSurroundingsCloudRequest(result.image,lat,lon,target)');
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).not.toContain("cloudForecast.image.temporalMethod==='cloud-linear'");
 });
});
