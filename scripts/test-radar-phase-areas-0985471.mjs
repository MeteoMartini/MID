import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const overlay=await readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const panel=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
for(const [name,pattern] of [
 ['Original-OPERA-Echopixel',/operaRasterPoint\(raster,lat,lng\)/],
 ['Keine Farbe in Radar-NoData',/if\(dbz===undefined\)continue/],
 ['Deckkraft aus Radarintensität',/radarDbzColor\(dbz\)\[3\]/],
 ['Missing-Phase sichtbar',/PRECIPITATION_TYPE_COLORS\.uncertain/],
 ['Keine synthetische Regenphase',/phase\.modelEvidence&&phase\.phase==='rain'&&phase\.confidence!=='eingeschränkt'/],
 ['Flächenfarbe nur nach Phasen-Evidenz',/colors\.set\(index,PRECIPITATION_TYPE_COLORS\[family\]\)/],
 ['Unsichere Phasen nicht klassifizieren',/phase\.confidence==='eingeschränkt'\)continue/],
 ['Leistungsbegrenzte Darstellung',/Math\.min\(480,Math\.ceil\(width\/2\)\)/],
 ['Einheitlicher Canvas-Renderer',/CanvasOverlay id="radar-phase-area"/],
 ['Symbole bleiben erhalten',/HtmlMarker key=\{item\.id\}/]
])assert.match(overlay,pattern,name);
assert.match(panel,/radarModelPhaseRenderable=showRadar&&showPrecipitationType&&!future/,'Keine Beobachtungsphase im Zukunftsradar');
assert.match(panel,/showArea=\{!highResolution&&activeSource==='opera'\}/,'Fläche nur bei echtem OPERA-Raster');
console.log('OPERA-Phasenflächen: Quellen-, NoData-, Zukunfts- und Darstellungsgates verifiziert; Browserpixel sind ein separates Gate.');
