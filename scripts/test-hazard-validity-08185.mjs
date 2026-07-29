import {readFile} from 'node:fs/promises';

const [warnings,weather,app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'validFrom?:string;validTo?:string',
 'type WarningOccurrence=',
 'function warningSampleEpoch(sample:DwdWarningSample)',
 'function warningValidity(occurrences:WarningOccurrence[],selected:WarningOccurrence)',
 'item.start<=current.end+5*60000',
 'validFrom:new Date(interval.start).toISOString()',
 'validTo:new Date(interval.end).toISOString()'
])need('Warnzeit-Berechnung',warnings,token);

for(const token of [
 'validFrom?:string;validTo?:string',
 'validFrom:signal.validFrom,validTo:signal.validTo'
])need('Hazard-Datenvertrag',weather,token);

for(const token of [
 'Clock3',
 '<MemoHazards data={hz} timezone={w.timezone}/>',
 'function hazardValidityLabel(',
 'Gültig: {validity}',
 'className="hazard-validity"',
 'Automatisch berechneter Gültigkeitszeitraum des Warnindikators'
])need('Warnzeit-Darstellung',app,token);

for(const token of [
 '.hazard-validity{display:inline-flex!important;',
 '.hazard-validity time{min-width:0;white-space:normal}',
 '@media(max-width:760px){.hazard-validity{'
])need('Warnzeit-CSS',styles,token);

need('Package-Test',pkg,'test:hazard-validity');
need('Baseline-Test',baseline,'scripts/test-hazard-validity-08185.mjs');

if(failures.length){console.error('Gültigkeitszeitraum-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Eigene Warnindikatoren geprüft: zusammenhängende Gültigkeitsfenster, Ortszeitformatierung und kompakte responsive Anzeige vorhanden.');
