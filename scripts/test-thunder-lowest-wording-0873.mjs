import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const src=readFileSync(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8');
assert.doesNotMatch(src,/Einfaches Gewitter/,'Niedrigste Gewitterstufe darf nicht als „Einfaches Gewitter“ bezeichnet werden');
assert.match(src,/level===2\?'Starkes Gewitter':'Gewitter'/,'Niedrigste Gewitterstufe muss schlicht „Gewitter“ heißen');
console.log('Gewitter-Wording geprüft: niedrigste Stufe lautet nur „Gewitter“.');
