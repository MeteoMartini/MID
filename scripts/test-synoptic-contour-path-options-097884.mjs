import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [radar,styles]=await Promise.all([readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8')]);
assert.ok(radar.includes('function smoothContourPath('),'MID-eigene Konturglättung fehlt.');
assert.ok(radar.includes('chaikinContour('),'Chaikin-Glättung der Modelllinien fehlt.');
assert.ok(radar.includes('function binomialContour('),'Vorgelagerte, begrenzte Binomialglättung gegen Rastertreppen fehlt.');
assert.ok(radar.includes("binomialContour(cleaned,type==='isoheights'?2:1)"),'Isohypsen müssen stärker als Isobaren geglättet werden, ohne Windy-artige Überglättung.');
assert.ok(!radar.includes('smoothFactor:'),'Nicht unterstütztes Leaflet/PathOptions-Feld smoothFactor darf nicht verwendet werden.');
assert.ok(radar.includes("lineCap:'round'"),'Runde Linienenden müssen erhalten bleiben.');
assert.ok(radar.includes("lineJoin:'round'"),'Runde Linienübergänge müssen erhalten bleiben.');
assert.ok(radar.includes("(['isobars','isoheights'] as const)"),'Native DWD-Isobaren und 500-hPa-Isohypsen müssen gemeinsam über den WMS-Pfad gerendert werden.');
assert.ok(radar.includes('type="isoheights"')&&radar.includes('IsoheightCanvasFallback'),'Geglättete MID-Isohypsen müssen als robuster Vector-/Canvas-Fallback erhalten bleiben.');
assert.ok(styles.includes('.composite-line-toolbar,')&&styles.includes('.composite-advanced-fields>label:nth-of-type(3){display:none!important}'),'Nicht belastbare Linienfarbwahl muss aus der Bedienung entfernt sein.');
console.log('Synoptik nutzt native DWD-Isobaren/Isohypsen sowie binomial und per Chaikin geglättete MID-Fallbacks.');
