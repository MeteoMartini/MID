import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const cockpit=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const modern=readFileSync(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');

assert.ok(app.includes("{id:'90m',label:'Kurzfrist',module:'short-term'}"),'Obere Horizontleiste braucht einen gemeinsamen Kurzfrist-Einstieg.');
assert.ok(!app.includes("{id:'24h',label:'24 h',module:'short-term'}"),'24 h darf nicht mehr als separater Horizont neben 90 min stehen.');
assert.ok(app.includes("return value==='24h'?'90m'"),'Alte gespeicherte 24-h-Auswahl muss verlustfrei auf Kurzfrist migrieren.');
assert.ok(cockpit.includes('Nächste 90 Minuten')&&cockpit.includes('24-h-Wetterprofil'),'Kurzfrist muss 90-Minuten- und 24-h-Inhalt in derselben Arbeitsansicht enthalten.');

for(const token of [
 '/* MID v0.9.84.98 · einheitlicher Kurzfrist-Horizont und fertiges Planen-Design auf Desktop/Tablet/Mobil */',
 '.navigation-bottom-tabs .modern-planner-hub{',
 '.navigation-bottom-tabs .modern-planner-actions>button{',
 'appearance:none;',
 'grid-template-columns:42px minmax(0,1fr) 18px;',
 '.navigation-bottom-tabs .dashboard-planner-section.modern-planner-section>.dashboard-planner-section-head{display:none}',
 '.navigation-bottom-tabs .modern-more-quick-actions{',
 '.navigation-bottom-tabs .modern-forecast-horizons{grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-columns:auto;overflow-x:visible}'
]) assert.ok(modern.includes(token),`Planen-/Kurzfrist-Designvertrag fehlt: ${token}`);
assert.ok(styles.includes('MID v0.9.84.98 · einheitlicher Kurzfrist-Horizont'),'Styles-Aggregat enthält den neuen Desktop-/Planen-Vertrag nicht.');

console.log('Kurzfrist zusammengeführt; Planen-Hub, Planerbereich und Mehr-Schnellzugriffe sind auf Desktop/Tablet/Mobil durchgehend gestaltet.');
