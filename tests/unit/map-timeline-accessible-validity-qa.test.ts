import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import MapTimelineControls,{MapTimelineRange} from '../../src/MapTimelineControls';

const noop=()=>{};
const slider=(props:Partial<Parameters<typeof MapTimelineRange>[0]>={})=>renderToStaticMarkup(
 createElement(MapTimelineRange,{
  className:'map-timeline-range',markerClassName:'map-timeline-markers',
  index:2,count:5,canAnimate:true,onSeek:noop,
  rangeLabel:'Kartenzeitschritt wählen',countLabel:null,...props
 })
);

describe('MID Karten: semantische, quellgetreue Timeline ohne zweite Zeitpille',()=>{
 it('announces actual model time and phase instead of the index, preserving native slider semantics',()=>{
  const html=slider({
   valueText:'in 30 min · 15.11., 17:45 Uhr · Modellprognose',
   markers:[{key:'o',phase:'observation'},{key:'n',phase:'nowcast'},{key:'f',phase:'forecast'}]
  });
  expect(html).toContain('type="range"');
  expect(html).toContain('min="0"');
  expect(html).toContain('max="4"');
  expect(html).toContain('value="2"');
  expect(html).toContain('aria-label="Kartenzeitschritt wählen"');
  expect(html).toContain('aria-valuetext="in 30 min · 15.11., 17:45 Uhr · Modellprognose"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toContain('role="slider"'); // Keep native input accessibility and Home/End support.
 });
 it('does not invent a valid time when none was provided',()=>{
  const html=slider({index:0,count:0,canAnimate:false});
  expect(html).toContain('disabled=""');
  expect(html).not.toContain('aria-valuetext=');
  expect(html).toContain('max="0"');
 });
 it('the existing single visible time gets machine-readable UTC datetime',()=>{
  const html=renderToStaticMarkup(createElement(MapTimelineControls,{
   className:'composite-timeline-controls',transportClassName:'timeline-transport',
   stepButtonClassName:'step',playButtonClassName:'play',speedClassName:'speed',
   rangeClassName:'range',markerClassName:'markers',timeClassName:'time',
   liveButtonClassName:'live',index:1,count:3,playing:false,canAnimate:true,
   liveActive:false,playbackSeconds:2.4,onPlaybackSecondsChange:noop,
   onPrevious:noop,onToggle:noop,onNext:noop,onSeek:noop,onLive:noop,
   rangeLabel:'Kartenzeit wählen',
   rangeValueText:'15.11.2026, 13:15 Uhr · Modellprognose',
   timeISO:'2026-11-15T12:15:00.000Z',
   countLabel:null,valueLabel:'in 15 min',detailLabel:'15.11., 13:15 Uhr',
   playLabel:'Abspielen',pauseLabel:'Pausieren'
  }));
  expect(html).toContain('aria-valuetext="15.11.2026, 13:15 Uhr · Modellprognose"');
  expect(html).toContain('2026-11-15T12:15:00.000Z');
  expect((html.match(/<time /g)||[])).toHaveLength(1);
  expect(html).not.toContain('composite-map-absolute-clock');
 });
 it('both independent map consumers wire a real source-validity value into the shared slider',()=>{
  const composite=readFileSync('src/RadarPanel.tsx','utf8');
  const model=readFileSync('src/WeatherMapsPanel.tsx','utf8');
  const shared=readFileSync('src/MapTimelineControls.tsx','utf8');
  expect(composite).toContain('rangeLabel="Kartenzeitschritt wählen"');
  expect(composite).toContain('rangeValueText={selectedFrame?');
  expect(composite).toContain('timeISO={selectedFrame?new Date(targetMs).toISOString():undefined}');
  expect(composite).toContain("selectedFrame.phase==='forecast'?'Modellprognose'");
  expect(model).toContain('rangeValueText={selectedTime?');
  expect(model).toContain('valueText={selectedTime?'); // Explicit MapTimelineRange override
  expect(model).toContain('timeISO={selectedTime||undefined}');
  expect(shared).toContain('aria-valuetext={valueText}');
  expect(shared).toContain('<time dateTime={timeISO}');
  expect(composite).not.toContain('composite-map-absolute-clock');
 });
});
