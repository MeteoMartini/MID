import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const start=source.indexOf('<span className="hour-tooltip-precipitation">');
assert.notEqual(start,-1,'Niederschlagskachel der Stunden-Detailansicht fehlt.');
const end=source.indexOf('</span><span><small>Taupunkt / Feuchte</small>',start);
assert.notEqual(end,-1,'Niederschlagskachel konnte nicht vollständig abgegrenzt werden.');
const block=source.slice(start,end);
assert.match(block,/Gewitterrisiko \{Math\.round\(currentThunderRisk\.percent\)\} %/,'Gewitterrisiko muss ganzzahlig in der Niederschlagskachel sichtbar sein.');
assert.doesNotMatch(block,/\{currentPrecip\.label\}/,'Die bereits im Stundenkopf sichtbare Niederschlagsart darf in der Niederschlagskachel nicht wiederholt werden.');
assert.match(block,/\{currentThunderRisk&&<em/,'Die Zusatzzeile darf nur bei vorhandenem Gewitterrisiko erscheinen.');
console.log('Detail-Niederschlagskachel: keine doppelte Niederschlagsart, Gewitterrisiko sichtbar.');
