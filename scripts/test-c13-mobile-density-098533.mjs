import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,app,pkg]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC13MobileDensity.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC12ForecastRedesign.css';\nimport './midC13MobileDensity.css';"),'C13 muss nach C12 geladen werden.');
assert.ok(app.includes('className="metrics" hidden={!metricsOpen}'),'Aktuell muss seine bestehende Mehr/Weniger-Semantik behalten.');
assert.ok(styles.includes(".mid-page-grid>.place{order:-2!important}"),'Orts-/Warnkontext muss vor Aktuell stehen.');
assert.ok(styles.includes(".dashboard-section-anchor[data-dashboard-section='current']{order:-1!important}"),'Aktuell muss direkt nach dem Ortskontext stehen.');
assert.ok(styles.includes('.hero.current-compact+.metrics[hidden]{display:none!important}'),'Geschlossene Zusatzwerte müssen tatsächlich verborgen sein.');
assert.ok(styles.includes('.hero.current-compact+.metrics:not([hidden]){\n display:block!important;'),'Geöffnete Zusatzwerte müssen eine fortlaufende Detailfläche statt eines Kachelrasters sein.');
assert.ok(styles.includes('border-bottom:1px solid color-mix(in srgb,var(--c8-line) 72%,transparent)!important'),'Detailwerte müssen als ruhige Zeilen getrennt sein.');
assert.ok(styles.includes('position:relative!important;\n  top:auto!important'),'Der große mobile Kopf darf nicht als Vollflächen-Sticky im Viewport verbleiben.');
for(const token of [
 "grid-template-areas:'brand actions' 'search search' 'favorites favorites'!important",
 'width:30px!important;\n  height:30px!important',
 'height:36px!important',
 'min-height:30px!important',
 '.place-title-row h1{font-size:17px!important',
 'font-size:50px!important',
 'min-height:48px!important',
 'height:42px!important',
 'min-height:50px!important',
 'env(safe-area-inset-bottom)',
 '@media(max-width:850px)',
 '@media(max-width:430px)',
 '@media(max-width:360px)',
 '@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`C13-Dichte-/Responsive-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('background:transparent!important;\n  box-shadow:none!important'),'Nowcast-/Detailflächen müssen verschachtelte Kartenoptik abbauen.');
assert.ok(!styles.includes('filter:blur('),'Fachliche Wetterflächen dürfen nicht dekorativ weichgezeichnet werden.');
assert.equal(JSON.parse(pkg).version,'0.9.85.33','C13 muss als v0.9.85.33 veröffentlicht werden.');

console.log('MID-C13: mobiler Kopf, Ortsreihenfolge, echte Zusatzwert-Klappung und de-kachelte Aktuell-Ansicht geprüft.');
