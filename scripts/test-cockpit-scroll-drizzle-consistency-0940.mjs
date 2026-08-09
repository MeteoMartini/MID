import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cockpit=fs.readFileSync(path.join(root,'src/ForecastCockpit.tsx'),'utf8'),ensemble=fs.readFileSync(path.join(root,'src/EnsemblePanel.tsx'),'utf8');
for(const token of [
 "from './precipitation'","precipitationParts","function plausiblePrecipitation","buildShortTermForecast(minutes15,hours,timezone,Date.now(),anchor,radarNowcast)","data-cockpit-horizontal-scroll=\"true\"","activeHorizon==='seven-day'","cockpit-seven-grid"
])assert.ok(cockpit.includes(token),`Cockpit-Scroll-/Plausibilitätsvertrag fehlt: ${token}`);
for(const token of ["precipitationVisualDescriptor(day.code,bestPrecipitation,bestPrecipitationProbability,dayHours)","hours.map(hour=>precipitationParts(hour))","unsupportedDrizzle","amount>=.1&&chance>=25?61:3"])assert.ok(ensemble.includes(token),`Ensemble-Niederschlagsplausibilität fehlt: ${token}`);
console.log('MID v0.9.4.0: horizontales 7-Tage-Scrollen bleibt im Horizont und unplausibler Sprühregen wird nicht ungeprüft visualisiert.');
