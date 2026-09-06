import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const radar=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
assert.ok(radar.includes('function smoothContourPath('),'MID-eigene Konturglättung fehlt.');
assert.ok(radar.includes('chaikinContour('),'Chaikin-Glättung der Modelllinien fehlt.');
assert.ok(!radar.includes('smoothFactor:'),'Nicht unterstütztes Leaflet/PathOptions-Feld smoothFactor darf nicht verwendet werden.');
assert.ok(radar.includes("lineCap:'round'"),'Runde Linienenden müssen erhalten bleiben.');
assert.ok(radar.includes("lineJoin:'round'"),'Runde Linienübergänge müssen erhalten bleiben.');
assert.ok(radar.includes("modelLineTone!=='auto'"),'Manuelle Linienfarbwahl muss erhalten bleiben.');
assert.ok(radar.includes('isobarLineColor')&&radar.includes('isoheightLineColor'),'Getrennte Farben für Isobaren/Isohypsen müssen erhalten bleiben.');
console.log('MID v0.9.78.84: Synoptik-PathOptions sind typkonform; eigene Linienglättung und Farbauswahl bleiben erhalten.');
