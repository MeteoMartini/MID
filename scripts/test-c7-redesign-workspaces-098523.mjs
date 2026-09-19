import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,main,styles,hierarchy,pkg]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC7Redesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18HierarchyRedesign.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);

assert.ok(main.includes("import './midC7Redesign.css';"),'Die C7-Overrides müssen nach den bestehenden Designschichten geladen werden.');
assert.ok(main.includes("import './midC18HierarchyRedesign.css';"),'Der MID-18-Hierarchie-Layer muss geladen werden.');
assert.ok(main.indexOf("import './midC18HierarchyRedesign.css';")>main.indexOf("import './midC9SmartphoneGate.css';"),'Der MID-18-Hierarchie-Layer muss nach dem C9-Schutzlayer laden.');
assert.ok(app.includes("data-modern-workspace={modernPrimarySection(activeNavSection==='place'||activeNavSection===''?'current':activeNavSection)}"),'Die Shell muss den aktiven MID-Next-Arbeitsbereich semantisch auszeichnen.');
assert.ok(app.includes("localStorage.getItem('mid:current-metrics-open')==='1'"),'Die Aktuell-Ansicht muss standardmäßig kompakt starten und eine explizite Detailwahl speichern.');
for(const token of [
 "@media (min-width:851px)",
 "transform:none!important",
 "left:max(12px,calc((100vw - 1540px)/2 + 12px))!important",
 "data-modern-workspace='forecast'",
 "data-modern-workspace='plan'",
 "@media (max-width:850px)",
 "transform:translate3d(0,0,0)!important",
 "prefers-reduced-motion:reduce"
])assert.ok(styles.includes(token),`C7-Redesign-Regel fehlt: ${token}`);
for(const token of [
 ".forecast-cockpit.modern-workspace",
 ".meteogram-card.open",
 ".radarmap",
 ".warnings-responsive-shell",
 ".official-warnings",
 ".water-overview",
 "@media(max-width:620px)"
])assert.ok(hierarchy.includes(token),`MID-18-Hierarchie-Regel fehlt: ${token}`);
assert.ok(JSON.parse(pkg).scripts['test:c7-redesign-workspaces'],'Der C7-Regressionstest muss einzeln ausführbar bleiben.');
console.log('MID-C7/MID18: Shell, fokussierte Arbeitsbereiche und Hierarchie-Layer für Forecast, Meteogramm, Radar, Warnungen und Wasser geprüft.');
