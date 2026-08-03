import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const [ensemble,cockpit,synoptic]=await Promise.all([
  readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
  readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
  readFile(new URL('src/SynopticPanel.tsx',root),'utf8'),
]);

assert(!/\bquartileFill\s*=/.test(ensemble),'EnsemblePanel darf keine ungenutzte quartileFill-Deklaration enthalten.');
assert(!/function\s+weatherFamily\s*\(/.test(cockpit),'ForecastCockpit darf die ungenutzte weatherFamily-Hilfsfunktion nicht enthalten.');
assert(/function\s+mapBounds\(location:Location,candidates:SynopticModelCandidate\[\],stations:SynopticStationPlot\[\]\)/.test(synoptic),'mapBounds muss ohne ungenutzten frame-Parameter deklariert sein.');
assert(!/mapBounds\(location,frame,/.test(synoptic),'mapBounds darf nicht mehr mit dem entfernten frame-Parameter aufgerufen werden.');
console.log('MID v0.9.4.1 Buildfix geprüft: keine ungenutzten quartileFill-, weatherFamily- oder mapBounds-frame-Deklarationen.');
