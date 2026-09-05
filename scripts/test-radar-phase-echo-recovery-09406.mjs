import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [phase,panel,styles]=await Promise.all([
 readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
assert.match(phase,/function cellEchoSummary\(/,'phase overlay must sample radar echoes');
assert.match(phase,/samplesPerAxis=3/,'phase overlay must sample several radar points inside each model cell');
assert.match(phase,/function radarBackedThermalPhase\(/,'conservative radar-backed thermal recovery must remain');
assert.match(phase,/asSymbolPhase\(phase\.phase\)/,'only explicitly released non-liquid precipitation phases may become symbols');
assert.match(phase,/phase\.confidence==='eingeschränkt'\)continue/,'restricted-confidence phase must stay hidden');
assert.match(phase,/function phaseMinimumDbz\(phase:SymbolPhase\)\{return phase==='hail'\?15:phase==='graupel'\?9:phase==='snow-grains'\?4:\(phase==='snow'\|\|phase==='freezing'\?5:7\)\}/,'echo thresholds for non-liquid symbols must remain protected');
assert.match(phase,/distanceKm\(existing,item\)<spacing/,'phase symbols must be spatially thinned');
assert.match(phase,/HtmlMarker/,'phase overlay must render point symbols');
assert.match(phase,/opacity:\$\{safeOpacity\.toFixed\(2\)\}/,'user opacity must control phase symbols');
assert.doesNotMatch(phase,/GeoJsonLayers|fill-opacity|Polygon/,'old filled phase polygons must stay removed');
assert.match(panel,/disabled=\{!showRadar\}/,'precipitation type must be unavailable without a radar observation underneath');
assert.match(panel,/setShowPrecipitationType\(value=>!value\)/,'precipitation type control must remain independently switchable');
assert.match(panel,/precipitationTypeOpacity/,'phase opacity slider must remain available below the image');
assert.match(styles,/\.radar-phase-symbol>span,\.radar-phase-symbol-shape\{display:block;width:19px;height:15px/,'phase symbols must remain compact enough to preserve radar gradations');
console.log('ok - non-liquid precipitation is rendered as small semi-transparent symbols over the selected radar');
