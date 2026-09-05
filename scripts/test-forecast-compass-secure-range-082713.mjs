import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
for(const name of ['EnsemblePanel.tsx','ForecastCockpit.tsx']){const source=read(name);assert.ok(source.includes('ForecastConfidenceOverview'));assert.ok(source.includes('agreementWindows(assessments)'));assert.ok(!source.includes('secureThreshold=72'));}
const shared=read('ForecastConfidence.tsx');
for(const token of ['Gemeinsam konsistente Zeiträume','Erwartete Entwicklung','Bewertung verschlechtert sich','Datenlücken unterbrechen jedes Fenster'])assert.ok(shared.includes(token));
console.log('Shared multiparameter calendar windows replace unvalidated 72-point cutoff.');
