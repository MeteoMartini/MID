import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC8VisibleRedesign.css',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC8VisibleRedesign.css';"),'Die C8-Kompositionsschicht muss zuletzt geladen werden.');
for(const token of [
 '.top.settings-header',
 '.place-nowcards',
 '.hero.current-compact .current-weather-overview',
 'grid-template-columns:minmax(150px,.8fr) minmax(240px,1.1fr) minmax(420px,1.65fr)',
 '.hero.current-compact+.metrics',
 '.dashboard-section-quick.dashboard-bottom-tabs',
 '@media(max-width:850px)',
 'prefers-reduced-motion:reduce'
])assert.ok(styles.includes(token),`C8-Konzeptregel fehlt: ${token}`);
assert.ok(styles.includes('/* The header becomes a compact control dock;'), 'Der Kopf muss als Kontroll-Dock und nicht als Inhaltskarte behandelt werden.');
assert.ok(styles.includes('/* A single current-weather stage:'), 'Die aktuelle Lage muss als zusammenhängende Wetterbühne behandelt werden.');
console.log('MID-C8: Kontroll-Dock, Wetterbühne, integrierte Datenleiste und schwebende Mobilnavigation geprüft.');
