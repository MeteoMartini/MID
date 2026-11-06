import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const radar=readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const phase=readFileSync(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const symbols=readFileSync(new URL('../src/precipitationTypeSymbols.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles-src/20-ensemble-composite.css',import.meta.url),'utf8');

assert.ok(radar.includes("filtered=binomialContour(cleaned,isoheight?3:1)")&&radar.includes("basePasses=isoheight?3:1"),'500-hPa-Isohypsen müssen stärker als Isobaren geglättet werden.');
assert.ok(radar.includes('modelData.wms.isobars.layer')&&!radar.includes("(['isobars','isoheights'] as const)"),'Der stufige DWD-WMS-Isohypsenstil darf nicht mehr sichtbar gerendert werden; WMS bleibt auf Isobaren beschränkt.');
assert.ok(radar.includes('<IsoheightCanvasFallback levels={vectorIsoheightFrame.isoheights}')&&radar.includes('<IsoheightLabels levels={vectorIsoheightFrame.isoheights}'),'Isohypsen müssen als geglättete Gold-/Amber-Canvas-Linien mit gpdm-Labels gerendert werden.');
assert.ok(radar.includes('candidate.score>=68')&&radar.includes("candidate.confidence!=='low'")&&radar.includes('zone.score>=58'),'Fronttypisierung muss schwache bzw. unsichere Kandidaten aus der Kartendarstellung fernhalten.');
assert.ok(!radar.includes('<SynopticFrontCanvasFallback worker=')&&!radar.includes('<MemoCompositeFronts worker='),'Alte doppelte Front-Layer dürfen nicht zusätzlich über die regionale Frontalzone gelegt werden.');

assert.ok(phase.includes('function coldSupport(')&&phase.includes("typed==='freezing'&&(!coldSupport"),'Gefrierende Radarphase braucht eine belastbare Kaltluft-/Feuchtkugelstützung.');
assert.ok(phase.includes("phase==='freezing'?9"),'Gefrierende Phasensymbole brauchen eine höhere Mindestreflektivität als zuvor.');
// .437 user contract: original weather contours replace the former decorative drop+star.
assert.ok(symbols.includes('freezing:66')&&symbols.includes('SYNOP_WEATHER_PATHS')&&symbols.includes('fill="#fff"'),'Gefrierende Radarphase braucht die originale WMO-66-Kontur auf deckendem Plättchen.');

assert.ok(css.includes('MID v0.9.84.100 · Desktop-Wetterpiktogramme ohne vertikale Sky-Plate-Randstriche'),'Desktop-Piktogramm-Fix muss dokumentiert sein.');
assert.ok(css.includes('.cockpit-day-weather-pair .mid-weather-skyplate>rect')&&css.includes('stroke:none!important'),'Die vertikalen Sky-Plate-Randstriche müssen in der Desktop-Tagesansicht entfernt sein.');

console.log('Synoptik-/Phasen-/Desktop-Piktogramm-Cleanup: OK');
