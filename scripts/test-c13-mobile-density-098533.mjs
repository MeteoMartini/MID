import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,touch,app,pkg,publicChangelog]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC13MobileDensity.css',import.meta.url),'utf8'),
 readFile(new URL('../src/midC13MobileTouch.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);
const releaseVersion=String(JSON.parse(pkg).version||'');

assert.ok(main.includes("import './midC12ForecastRedesign.css';\nimport './midC13MobileDensity.css';\nimport './midC13MobileTouch.css';"),'C13 und sein Touch-Schutz müssen nach C12 geladen werden.');
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
for(const token of [
 'min-width:38px!important',
 'min-height:38px!important',
 'min-height:36px!important',
 'nth-last-child(1){display:grid!important}',
 'nth-last-child(2){display:grid!important}'
])assert.ok(touch.includes(token),`C13 darf kompakte Controls nicht unbedienbar machen: ${token}`);
assert.match(releaseVersion,/^0\.9\.85\.\d+$/,'C13 muss innerhalb der 0.9.85-Releasefolge erhalten bleiben.');
assert.ok(publicChangelog.startsWith(`# MID v${releaseVersion}`),`Der ausgelieferte nichttechnische Changelog muss mit der aktuellen Releaseversion v${releaseVersion} beginnen.`);
assert.ok(publicChangelog.includes('# MID v0.9.85.33'),'Der dokumentierte C13-Schritt v0.9.85.33 darf in späteren Releases nicht verloren gehen.');

console.log(`MID-C13: kompakter Kopf, Ortsreihenfolge, echte Zusatzwert-Klappung, de-kachelte Aktuell-Ansicht und Touchflächen auch unter v${releaseVersion} geprüft.`);
