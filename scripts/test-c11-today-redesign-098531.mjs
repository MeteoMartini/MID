import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,shortTerm]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC11TodayRedesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC10CurrentRedesign.css';\nimport './midC11TodayRedesign.css';"),'C11 muss nach dem Aktuell-Redesign geladen werden.');
for(const token of [
 'className="card short-term-forecast"',
 'className="short-term-signature"',
 'className="short-term-matrix"',
 'className="short-term-strip"',
 'id="short-term-selected-detail"',
 'DwdPrecipitationTypeRadar'
])assert.ok(shortTerm.includes(token),`Heute-Grundstruktur fehlt: ${token}`);
for(const token of [
 '.short-term-forecast>.short-term-header',
 '.short-term-signature',
 '.short-term-matrix>header',
 '.short-term-strip>button.active',
 '.short-term-detail',
 'position:fixed!important',
 'env(safe-area-inset-bottom)',
 '@media(max-width:430px)',
 '@media(max-width:360px)',
 'orientation:landscape',
 'prefers-reduced-motion'
])assert.ok(styles.includes(token),`C11-Konzeptregel fehlt: ${token}`);
assert.ok(styles.includes('Selected time is a low detail sheet'),'Zeitdetail muss bewusst als niedrige Detailtiefe umgesetzt sein.');
assert.ok(styles.includes('one instrument, not two stacked cards'),'Wetterfaden und Zeitmatrix müssen als gemeinsames Instrument gestaltet sein.');
console.log('MID-C11: Heute als durchgehende 24-h-Zeitachse, selektives Zeitdetail und mobile Safe-Area geprüft.');
