import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,styles,aggregate]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8')
]);

assert.ok(app.includes('<main className="mid-page-grid">'),'Die MID-Hauptansicht muss das gemeinsame Seitenraster verwenden.');
for(const token of [
 "/* MID-C3 · Schritt 2: ein gemeinsames Seitenraster für alle Arbeitsräume.",
 "html[data-mid-design='next'] .mid-page-grid{",
 ".mid-page-grid>.place{",
 ".mid-page-grid>.dashboard-section-anchor,.mid-page-grid>.dashboard-planner-section{",
 "[data-dashboard-section='current']{order:-1}",
 ".app>footer{display:flex;align-items:center;",
 '@media(min-width:851px)',
 '@media(max-width:850px)'
])assert.ok(styles.includes(token),`Seitenraster-Vertrag fehlt: ${token}`);
assert.ok(aggregate.includes('/* MID-C3 · Schritt 2: ein gemeinsames Seitenraster für alle Arbeitsräume.'),'Das Styles-Aggregat enthält das gemeinsame Seitenraster nicht.');
console.log('MID-C3 Schritt 2: gemeinsames Seitenraster für Ortskopf, Kernaussage, Datenmodule und Quellenabschluss geprüft.');
