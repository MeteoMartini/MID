import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-ui-design-system-095343.mjs';
const [styles,primitive,app,eventPlanner,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/UiPrimitives.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_UI_ARCHITECTURE_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
for(const token of ['--mid-space-1:','--mid-radius-control:','--mid-radius-panel:','--mid-radius-card:','--mid-radius-pill:','--mid-text-micro:','--mid-text-xs:','--mid-status-good:','--mid-status-watch:','--mid-status-caution:','--mid-status-info:'])assert.ok(styles.includes(token),`Designsystem-Token fehlt: ${token}`);
for(const token of ['var(--mid-radius-pill)','var(--mid-text-micro)','var(--mid-status-good)','var(--mid-status-watch)','var(--mid-status-caution)'])assert.ok(styles.includes(token),`Gemeinsames UI-Token wird nicht genutzt: ${token}`);
assert.ok(primitive.includes('export function MidDisclosure'),'Gemeinsames Disclosure-Primitiv fehlt.');
assert.ok(primitive.includes('data-mid-ui="disclosure"'),'Disclosure-Primitiv besitzt keinen gemeinsamen UI-Vertrag.');
assert.ok(app.includes('<MidDisclosure className="advanced-feature-group"'),'Erweiterte Einstellungen nutzen das gemeinsame Disclosure-Primitiv nicht.');
assert.ok(eventPlanner.includes('<MidDisclosure className="event-detail-disclosure"'),'Event-Detailansicht nutzt das gemeinsame Disclosure-Primitiv nicht.');
assert.ok(eventPlanner.includes('<MidDisclosure className="event-model-disclosure"'),'Event-Modellstand nutzt das gemeinsame Disclosure-Primitiv nicht.');
assert.ok(eventPlanner.includes('<details className="event-center-card-disclosure">'),'Geschützte progressive Event-Kurzkarte wurde unzulässig strukturell ersetzt.');
for(const token of ['Designsystem','Semantische Statusfarben','Typografie-Tokens','Disclosure'])assert.ok(contract.includes(token),`UI-Vertrag schützt Designsystem-Aspekt nicht: ${token}`);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: Designsystem-Tokens, Statusfarben, Typografie und Disclosure-Primitiv appweit geschützt.`);
