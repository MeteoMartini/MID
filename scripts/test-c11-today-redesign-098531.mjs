import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,shortTerm,app]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC11TodayRedesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC10CurrentRedesign.css';\nimport './midC11TodayRedesign.css';"),'C11 muss nach der aktuellen C10-Hierarchie geladen werden.');
assert.ok(app.includes("label:'Heute'"),'Die Hauptnavigation muss Heute weiterhin auf den kanonischen Kurzfristbereich führen.');
assert.ok(shortTerm.includes('className="short-term-matrix"'),'Heute braucht die gemeinsame Zeitmatrix.');
assert.ok(shortTerm.includes('className="short-term-signature"'),'Der Wetterfaden muss Teil des 24-h-Arbeitsraums bleiben.');
assert.ok(shortTerm.includes('className="short-term-detail"'),'Die gewählte Zeit muss weiterhin vollständige Details anbieten.');
for(const token of [
 '.short-term-forecast>.short-term-header',
 '.short-term-signature',
 '.short-term-matrix>header',
 '.short-term-strip>button.active',
 'content:"Zeitlupe"',
 'position:fixed!important',
 'bottom:calc(88px + env(safe-area-inset-bottom))',
 '@media(max-width:430px)',
 '@media(max-width:360px)'
])assert.ok(styles.includes(token),`C11-Konzeptregel fehlt: ${token}`);
assert.ok(!styles.includes('display:none!important;\n  }\n  html[data-mid-design=\'next\'] .short-term-detail'),'Zeitdetails dürfen auf Mobilgeräten nicht ausgeblendet werden.');
console.log('MID-C11: Heute als zusammenhängender 24-h-Zeitarbeitsraum, Zeitlupe und mobile Safe-Area geprüft.');
