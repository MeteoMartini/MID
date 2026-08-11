import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const source=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');

// The 1-km DWD radar keeps the proven time-aware render path from v0.9.40.2.
assert(!source.includes('dwdLatestOnly='),'The temporary latest-only 1-km radar rewrite must not return.');
assert(source.includes("showRadar&&!highResolution&&activeSource==='dwd'&&dwdRenderBlend.map"),'1-km DWD radar must keep its timed frame blend.');
assert(source.includes("time:iso,tiled:true"),'1-km DWD radar must keep requesting the selected real radar time.');

// The precipitation-type legend remains independent from the normal radar palette.
assert(source.includes('PRECIPITATION_TYPE_LEGEND.map'),'Precipitation-type legend must use the fixed meteorological phase palette.');
assert(!source.includes('PrecipitationTypeLegend colorTable='),'Precipitation-type legend must not receive the selectable normal-radar colour table.');

console.log('test-composite-radar-legend-buildfix-09403: ok');
