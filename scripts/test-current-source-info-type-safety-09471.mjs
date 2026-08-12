import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));

assert.equal(pkg.version,'0.9.47.1','Buildfix muss als v0.9.47.1 ausgeliefert werden');
assert.equal(baseline.releaseVersion,'0.9.47.1','Baseline muss mit v0.9.47.1 synchron sein');
assert.match(app,/type StationFieldSource,type ThunderstormNowcast/,'StationFieldSource muss explizit importiert sein');
assert.match(app,/fieldSourceRows=\(fields:StationAnalysisField\[\]\):StationFieldSource\[\]=>\{const seen=new Set<string>\(\),rows:StationFieldSource\[\]=\[\]/,'Quellenzeilen müssen garantiert ein Array zurückgeben');
assert.doesNotMatch(app,/NonNullable<Station\['fieldSources'\]>\[StationAnalysisField\]/,'Optionaler Partial-Record-Index darf nicht erneut als Arraytyp verwendet werden');
assert.match(app,/const rows=fieldSourceRows\(fields\);if\(rows\.length\)/,'sourceFor muss mit dem garantierten Array arbeiten');
assert.match(app,/rows:fieldSourceRows\(group\.fields\)/,'Info-Gruppen müssen den gleichen garantierten Arraypfad verwenden');
console.log('v0.9.47.1: Messquellenanzeige ist gegen TS18048/optionale rows abgesichert.');
