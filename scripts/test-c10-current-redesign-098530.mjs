import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,app]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC10CurrentRedesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC8VisibleRedesign.css';\nimport './midC10CurrentRedesign.css';"),'C10 muss nach der C8-Kompositionsschicht geladen werden.');
assert.ok(app.includes('className="place"'),'Der Ortskopf muss als eigener Kontext vor den Wettermodulen erhalten bleiben.');
assert.ok(app.includes('className="current-weather-facts"'),'Die aktuelle Wetterbühne muss ihre integrierte Datenleiste behalten.');
for(const token of [
 '.place>.place-nowcards',
 '#mid-section-current',
 '.current-weather-facts>.visibility',
 '.current-weather-facts>.pressure',
 '.hero.current-compact+.metrics>article:nth-child(1)',
 '.hero.current-compact+.metrics>article:nth-child(6)',
 'padding-bottom:calc(116px + env(safe-area-inset-bottom))',
 'margin-bottom:calc(96px + env(safe-area-inset-bottom))',
 '@media(max-width:430px)',
 '@media(max-width:360px)'
])assert.ok(styles.includes(token),`C10-Konzeptregel fehlt: ${token}`);
assert.ok(styles.includes('Exactly four core parameters'),'Die Primärhierarchie muss auf vier Kernparameter begrenzt sein.');
assert.ok(styles.includes('Core values are not'),'Doppelte Kernwerte dürfen im Detailraster nicht erneut gleichrangig erscheinen.');
console.log('MID-C10: kompakter Ortskopf, vier Kernparameter, entdoppelter Detailbereich und Mobile-Safe-Area geprüft.');
