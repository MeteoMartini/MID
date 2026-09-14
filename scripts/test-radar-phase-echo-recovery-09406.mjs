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
assert.match(phase,/phase==='hail'\?15/,'hail must retain the strongest radar-echo threshold');
assert.match(phase,/phase==='graupel-hail'\?12/,'neutral graupel-or-hail must use its own conservative echo threshold');
assert.match(phase,/phase==='graupel'\?9/,'graupel must retain its dedicated radar-echo threshold');
assert.match(phase,/\['snow-grains','snow-stars','ice-crystals','ice-pellets'\]\.includes\(phase\)\?4/,'WMO 76–79 solid phases must retain the low-echo threshold appropriate for weak solid precipitation');
assert.match(phase,/phase==='freezing'\?9:phase==='snow'\?6:7/,'freezing precipitation must require a stronger radar echo than snow after the conservative phase hardening');
assert.match(phase,/typed==='freezing'&&\(!coldSupport\(temperature,wetBulb\)\|\|\(Number\.isFinite\(temperature\)&&temperature>2\.5\)\|\|\(Number\.isFinite\(wetBulb\)&&wetBulb>\.8\)\)/,'freezing symbols must additionally be protected by cold air and wet-bulb support');
assert.match(phase,/\(typed==='snow'\|\|typed==='mixed'\).*temperature>4.*wetBulb>1\.5/,'snow or mixed symbols must be suppressed in clearly warm thermodynamic conditions');
assert.match(phase,/distanceKm\(existing,item\)<spacing/,'phase symbols must be spatially thinned');
assert.match(phase,/HtmlMarker/,'phase overlay must render point symbols');
assert.match(phase,/opacity:\$\{safeOpacity\.toFixed\(2\)\}/,'user opacity must control phase symbols');
assert.doesNotMatch(phase,/GeoJsonLayers|fill-opacity|Polygon/,'old filled phase polygons must stay removed');
assert.match(panel,/disabled=\{!showRadar\}/,'precipitation type must be unavailable without a radar observation underneath');
assert.match(panel,/setShowPrecipitationType\(value=>!value\)/,'precipitation type control must remain independently switchable');
assert.match(panel,/precipitationTypeOpacity/,'phase opacity slider must remain available below the image');
assert.match(styles,/\.radar-phase-symbol>span,\.radar-phase-symbol-shape\{display:block;width:19px;height:15px/,'phase symbols must remain compact enough to preserve radar gradations');
console.log('ok - non-liquid precipitation is rendered as small semi-transparent symbols over the selected radar');
