import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const mapCore=await readFile(new URL('../src/MapLibreCore.tsx',import.meta.url),'utf8');
const weather=await readFile(new URL('../src/weather.ts',import.meta.url),'utf8');
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));

assert.ok(!mapCore.includes('maplibregl.Anchor'),'MapLibre darf keinen nicht exportierten Anchor-Typ verwenden.');
assert.ok(mapCore.includes('maplibregl.PositionAnchor'),'Marker müssen den von MapLibre 5.24 exportierten PositionAnchor-Typ verwenden.');
assert.ok(mapCore.includes('as maplibregl.AddLayerObject'),'Dynamische GeoJSON-Layer müssen vor addLayer auf MapLibres diskriminierten AddLayerObject-Vertrag verengt werden.');
assert.ok(weather.includes('pb:[number[],number[],number[],number[]]'),'Mean/Spread-Fallback muss vier 6-h-Niederschlagsfenster führen.');
assert.ok(weather.includes('Math.floor(hour/6)'),'Mean/Spread-Fallback muss Stunden den vier 6-h-Fenstern zuordnen.');
assert.ok(weather.includes('precipitationWindows=row.pb.map'),'Mean/Spread-Fallback muss precipitationWindows für MemberDay materialisieren.');
assert.ok(!weather.includes('precipitation:row.p.reduce((sum,value)=>sum+value,0),sunshineDuration:NaN,wind:NaN,gust:NaN})'),'Kein MemberDay-Fallback darf precipitationWindows auslassen.');
assert.ok(pkg.scripts?.['test:maplibre-precip-buildfix'],'Direkter Buildfix-Test fehlt in package.json.');
assert.ok(baseline.regressionTests?.includes('scripts/test-maplibre-precip-buildfix-09393.mjs'),'Buildfix-Regression fehlt in MID_BASELINE.json.');
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-maplibre-precip-buildfix-09393.mjs'),'Buildfix muss als Pflichtregression geschützt sein.');
console.log('MID v0.9.39.3: MapLibre-Typen und 6-h-Niederschlagsfenster im Mean/Spread-Fallback buildfest geprüft.');
