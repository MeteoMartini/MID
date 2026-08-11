import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const phase=readFileSync(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const px=readFileSync(new URL('../src/Px250Overlay.tsx',import.meta.url),'utf8');
const opera=readFileSync(new URL('../src/OperaRasterOverlay.tsx',import.meta.url),'utf8');
const tables=readFileSync(new URL('../src/radarColorTables.ts',import.meta.url),'utf8');

assert.match(tables,/id:'dwd-standard'/,'DWD standard radar table missing');
assert.match(tables,/id:'dwd-starkregen'/,'DWD Starkregen table missing');
assert.match(tables,/wmsStyle:'Starkregen'/,'official DWD Starkregen WMS style must be used for 1-km radar');
assert.match(tables,/PRECIPITATION_TYPE_COLORS/,'fixed precipitation-type palette missing');
assert.match(tables,/export type RadarPhase='rain'\|'mixed'\|'snow'\|'freezing'\|'uncertain'/,'typed precipitation-phase union must be exported for the model-radar renderer');

assert.match(app,/Farbtabelle für 1-km- und 250-m-Radar/,'global settings section for normal radar palette missing');
assert.match(app,/radar-palette-settings-grid/,'settings preview grid missing');
assert.match(app,/backgroundImage:radarColorPreview\(item\.id\)/,'small settings colour preview missing');
assert.match(app,/writeRadarColorTableSetting\(value\)/,'settings must persist and publish radar palette change');
assert.doesNotMatch(app,/Niederschlagsart-Farbtabelle/,'precipitation-type palette must not be user-selectable');

assert.match(panel,/styles:dwdRadarStyle/,'1-km DWD WMS must use selected supported WMS style');
assert.match(panel,/dwdRenderLayer=dwdRadarStyle\?'dwd:Radar_rv_product_1x1km_ger':dwdLayer/,'Starkregen style must use the documented RV layer');
assert.match(panel,/LazyPx250Overlay[^>]+colorTable=\{radarColorTableId\}/,'250-m radar must receive selected colour table');
assert.match(panel,/LazyOperaRasterOverlay[^>]+colorTable=\{radarColorTableId\}/,'1-km local OPERA fallback must receive selected colour table');
assert.match(panel,/LazyRadarModelPrecipTypeOverlay[^>]+opacity=\{precipitationTypeOpacity\/100\} onStatus=/,'precipitation-type overlay must not receive normal-radar colour table');
assert.match(panel,/PRECIPITATION_TYPE_LEGEND\.map/,'precipitation-type legend must use fixed meteorological colours');

assert.match(px,/radarRateColor\(rate,colorTable\)/,'250-m raster must actually render selected palette');
assert.match(opera,/radarDbzColor\(dbz,colorTable\)/,'1-km OPERA raster must actually render selected palette');
assert.match(phase,/PRECIPITATION_TYPE_COLORS\[phase\.phase\]/,'precipitation-type polygons must use fixed phase colours');
assert.doesNotMatch(phase,/colorTable\?:RadarColorTableId/,'precipitation-type overlay must not expose palette selection');

// 1-km and 250-m render paths remain present; the temporary latest-only rewrite is deliberately absent.
assert.doesNotMatch(panel,/dwdLatestOnly=/,'temporary latest-only 1-km rewrite must stay reverted');
assert.match(panel,/showRadar&&!highResolution&&activeSource==='dwd'&&dwdRenderBlend\.map/,'1-km DWD radar render path missing');
assert.match(panel,/showPxAtTime&&pxMeta\?\.available&&<Suspense fallback=\{null\}><LazyPx250Overlay/,'250-m radar render path missing');

console.log('ok - radar colour-table scope, fixed phase palette and 1-km/250-m guards verified');
