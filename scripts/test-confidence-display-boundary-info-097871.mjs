import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL(`../${relative}`,import.meta.url),'utf8');
const app=read('src/App.tsx'),cockpit=read('src/ForecastCockpit.tsx'),ensemble=read('src/EnsemblePanel.tsx'),display=read('src/confidenceDisplay.tsx'),confidence=read('src/ForecastConfidence.tsx'),ensembleSource=read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),workerSource=read('worker-src/00-core-observations.js'),styles=read('src/styles-src/30-modern.css');

for(const token of ["export type ConfidenceDisplayMode='signal'|'traffic-light'|'text'","return value==='traffic-light'||value==='text'||value==='signal'?value:'signal'",'confidence-signal-bars','confidence-traffic-dots'])assert.ok(display.includes(token),`Konfidenz-Darstellung fehlt: ${token}`);
for(const token of ["confidenceDisplayMode:'signal'",'normalizeConfidenceDisplayMode(parsed?.confidenceDisplayMode)',"confidenceDisplayMode:'traffic-light'","confidenceDisplayMode:'text'",'confidenceDisplayMode={forecastDisplaySettings.confidenceDisplayMode}'])assert.ok(app.includes(token),`Konfidenz-Einstellung/Wiring fehlt: ${token}`);
assert.ok(cockpit.includes('mode={confidenceDisplayMode}'),'14d-Cockpit übernimmt Darstellungsoption nicht.');
assert.ok(ensemble.includes('mode={confidenceDisplayMode}'),'Ensemble-Konsistenzanzeige übernimmt Darstellungsoption nicht.');
assert.ok(confidence.includes('<AppInfoHint label="Parameter und weitere Zeiträume"'),'Parameter/Zeitfenster liegen nicht hinter dem Info-Button.');
assert.ok(!confidence.includes('<summary style={{minHeight:40,cursor:\'pointer\'}}>Parameter und weitere Zeiträume</summary>'),'Breiter Parameter-Disclosure ist weiterhin sichtbar.');
for(const token of ['Math.min(15,Math.ceil(forecastDays))','Math.min(15,model.maxDays)','Math.min(15,definition.maxDays)'])assert.ok(ensembleSource.includes(token),`15-Tage-Randabruf fehlt: ${token}`);
assert.ok(workerSource.includes("Math.min(15,Math.ceil(number(url.searchParams.get('forecast_days'))||14))"),'Worker-Proxy schneidet den 15. Ensemble-Randtag noch ab.');
for(const token of ['MID v0.9.78.72 · wählbare, kompakte Konfidenzdarstellung','settings-confidence-preview.signal','.cockpit-consistency-pill.mode-signal','.confidence-traffic-dots'])assert.ok(styles.includes(token),`CSS-Vertrag fehlt: ${token}`);
console.log('MID v0.9.78.72+: Konfidenzdarstellung, Info-Button und 15-Tage-Randabruf geprüft.');
