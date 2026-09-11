import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
assert.ok(panel.includes('ensemble-hazard-compact-row'));
assert.ok(panel.includes('function ensembleHazardDetail(')&&panel.includes("filter((value):value is string=>Boolean(value)).join(' · ')"),'Hazard-Richtung und Ensemblekontext müssen über einen typsicheren String-Array-Helfer verbunden werden.');
assert.ok(!panel.includes("detail:[formatDwdWarningDirection(signal),ensembleHazardContext"),'Fragile Inline-Verkettung darf nicht zurückkehren.');
assert.ok(!panel.includes("ensembleHazardDetail(signal,x,x.date,unit,warningEnsemble??undefined).filter"),'Der typsichere Hazard-Detail-Helfer liefert bereits einen String und darf nicht erneut als Array gefiltert werden.');

assert.ok(panel.includes('hazard.detail&&<InfoHint'));
assert.ok(!panel.includes('hazard.detail&&<small>{hazard.detail}</small>'));
assert.ok(css.includes('/* MID v0.9.84.49 · kompakte 14d-MID-Hinweise */'));
assert.ok(css.includes('.ensemble-hazard-tooltip>.ensemble-hazard-compact-row'));
console.log('Compact 14d MID hazard overlay contract: OK');
