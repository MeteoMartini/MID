import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const phase=readFileSync(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const px=readFileSync(new URL('../src/Px250Overlay.tsx',import.meta.url),'utf8');
const opera=readFileSync(new URL('../src/OperaRasterOverlay.tsx',import.meta.url),'utf8');
const tables=readFileSync(new URL('../src/radarColorTables.ts',import.meta.url),'utf8');
const symbols=readFileSync(new URL('../src/precipitationTypeSymbols.ts',import.meta.url),'utf8');

assert.match(tables,/export type RadarColorTableId='dwd-standard'/,'normal radar must expose only the fixed standard palette');
assert.match(tables,/wmsStyle:''/,'DWD 1-km WMS must use the native default style');
assert.doesNotMatch(tables,/dwd-starkregen|nexrad-classic|eccc-14|eumetnet-spectrum/,'alternate radar palettes must be removed');
assert.match(tables,/readRadarColorTableSetting\(\):RadarColorTableId\{return DEFAULT_RADAR_COLOR_TABLE\}/,'legacy palette setting must collapse to standard');
assert.doesNotMatch(app,/Farbtabelle für 1-km- und 250-m-Radar|radar-palette-settings-grid|radarColorPreview|writeRadarColorTableSetting/,'radar palette selection must be absent from settings');

assert.match(panel,/const radarColorTableId:RadarColorTableId=DEFAULT_RADAR_COLOR_TABLE/,'composite radar must always use the standard table');
assert.match(panel,/styles:dwdRadarStyle/,'DWD WMS style parameter must remain explicit');
assert.match(panel,/LazyPx250Overlay[^>]+colorTable=\{radarColorTableId\}/,'250-m raster must receive the fixed standard palette');
assert.match(panel,/LazyOperaRasterOverlay[^>]+colorTable=\{radarColorTableId\}/,'local OPERA raster must receive the fixed standard palette');
assert.match(panel,/Radarfarben',value:showRadar\?'jeweilige Standardfarben':'—'/,'technical info must state fixed standard colours');
assert.match(px,/radarRateColor\(rate,colorTable\)/,'250-m raster standard colours must be applied in local rendering');
assert.match(opera,/radarDbzColor\(dbz,colorTable\)/,'OPERA fallback standard colours must be applied in local rendering');

assert.match(phase,/HtmlMarker/,'precipitation type must now be rendered as symbols, not a colour table');
assert.doesNotMatch(phase,/colorTable\?:RadarColorTableId|GeoJsonLayers|fill-color/,'precipitation-type overlay must be independent of radar palettes and polygon fills');
for(const phaseName of ["phase==='mixed'","phase==='snow'","phase==='snow-grains'","phase==='graupel'","phase==='hail'"])assert.match(symbols,new RegExp(phaseName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`meteorological SVG phase missing: ${phaseName}`);
assert.match(symbols,/else content='<g fill="none" stroke="currentColor"/,'freezing precipitation swirl symbol missing');
assert.doesNotMatch(tables,/\{phase:'rain',label:'Regen'.*symbol/,'pure rain must not get an extra phase symbol');

assert.match(panel,/showRadar&&!highResolution&&activeSource==='dwd'&&dwdRenderBlend\.map/,'1-km DWD radar render path missing');
assert.match(panel,/showPxAtTime&&pxMeta\?\.available&&<Suspense fallback=\{null\}><LazyPx250Overlay/,'250-m radar render path missing');
console.log('ok - palette chooser removed; each radar path uses its fixed standard colours and phase symbols are separate');
