import {existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const obsolete='scripts/test-scenario-settings-regime-0820.mjs';
assert.equal(existsSync(new URL(`../${obsolete}`,import.meta.url)),false,`Veraltete Release-Datei darf nicht enthalten sein: ${obsolete}`);
const current=readFileSync(new URL('./test-scenario-regime-settings-0820.mjs',import.meta.url),'utf8');
assert.match(current,/Robuste Filterung isolierter Niederschlagsausreißer|familyOutliers/,'Aktueller Szenario-/Regime-Test fehlt oder ist unvollständig.');
console.log('Release-Sauberkeit geprüft: kein veralteter Szenario-/Regime-Test, aktueller v0.8.2-Test vorhanden.');
