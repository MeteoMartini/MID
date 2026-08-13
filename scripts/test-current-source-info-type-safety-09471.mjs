import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));

assert.equal(baseline.releaseVersion,pkg.version,'Baseline muss mit der Paketversion synchron sein');
const versionParts=pkg.version.split('.').map(Number);
assert.ok(versionParts.length===4&&versionParts.every(Number.isFinite),'MID-Version muss vierteilig numerisch sein');
const [major,minor,feature,maintenance]=versionParts;
assert.ok(major>0||minor>9||(minor===9&&(feature>47||(feature===47&&maintenance>=1))),'TS18048-Schutz darf nicht vor v0.9.47.1 liegen');
assert.match(app,/type StationFieldSource,type ThunderstormNowcast/,'StationFieldSource muss explizit importiert sein');
assert.match(app,/fieldSourceRows=\(fields:StationAnalysisField\[\]\):StationFieldSource\[\]=>\{const seen=new Set<string>\(\),rows:StationFieldSource\[\]=\[\]/,'Quellenzeilen müssen garantiert ein Array zurückgeben');
assert.doesNotMatch(app,/NonNullable<Station\['fieldSources'\]>\[StationAnalysisField\]/,'Optionaler Partial-Record-Index darf nicht erneut als Arraytyp verwendet werden');
assert.match(app,/const rows=fieldSourceRows\(fields\);if\(rows\.length\)/,'sourceFor muss mit dem garantierten Array arbeiten');
assert.match(app,/rows:fieldSourceRows\(group\.fields\)/,'Info-Gruppen müssen den gleichen garantierten Arraypfad verwenden');
console.log(`${pkg.version}: Messquellenanzeige ist gegen TS18048/optionale rows abgesichert.`);
