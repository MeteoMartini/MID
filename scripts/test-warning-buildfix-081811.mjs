import {readFile} from 'node:fs/promises';

const [warnings,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
if(warnings.includes('function levelFromThresholds('))failures.push('Ungenutzter Helper levelFromThresholds ist noch vorhanden.');
if(warnings.includes('function windClassification('))failures.push('Ungenutzter Helper windClassification ist noch vorhanden.');
for(const token of ['function windClassifications(kmh:number)','windClasses=windClassifications(gustKmh)','windSignals=windClasses.map'])if(!warnings.includes(token))failures.push(`Aktive Mehrstufen-Windlogik fehlt: ${token}`);
if(!pkg.includes('test:warning-buildfix'))failures.push('Package-Testskript fehlt.');
if(!baseline.includes('scripts/test-warning-buildfix-081811.mjs'))failures.push('Baseline-Testeintrag fehlt.');
if(failures.length){console.error('Warnungs-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Warnungs-Buildfix geprüft: ungenutzte Alt-Helper entfernt, aktive Mehrstufenlogik bleibt erhalten.');
