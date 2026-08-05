import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,styles,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);

for(const token of [
 'function strongestDailyHazards(items:DailyHazardBadge[],limit=3)',
 'const strongestStage=Math.max(...items.map(item=>item.stageRank))',
 'items.filter(item=>item.stageRank===strongestStage)',
 'hz:strongestDailyHazards(dailyHazards(d,hours,elevation??0,unit,1))',
 'widgetWidth=Math.max(420,128+n*88)'
])assert.ok(app.includes(token),`Widget-/Hazard-Vertrag fehlt: ${token}`);
assert.ok(!app.includes('hz:dailyHazards(d,hours,elevation??0,unit,1).slice(0,3)'), 'Das Widget zeigt weiterhin einfach die ersten drei statt nur der höchsten Hazard-Stufe.');

for(const token of [
 '/* MID v0.9.16.1 · kollisionsfreie 14-Tage-Karten und besser lesbares Export-Widget */',
 '.cockpit-fourteen-card>header{display:grid;grid-template-columns:minmax(0,1fr) max-content',
 'white-space:nowrap',
 '@media(max-width:900px)',
 '.cockpit-fourteen-grid{grid-template-columns:repeat(14,minmax(178px,1fr))',
 '.cockpit-fourteen-row>.cockpit-anomaly-track,.cockpit-fourteen-row>.cockpit-rain-track,.cockpit-fourteen-row>.cockpit-wind-track{grid-column:1/-1;grid-row:2',
 '.weatherwidget.modern.compact>header strong{font-size:21px}',
 '.weatherwidget.modern.compact .widgetlabel{min-height:2.55em;font-size:10px',
 '.weatherwidget.modern.compact .widgetmeta span{padding:4px 5px;border-radius:9px;font-size:9px',
 '.weatherwidget.modern.compact .widgethazards span{padding:4px 5px;font-size:8.5px'
])assert.ok(styles.includes(token),`Responsive-/Widget-CSS fehlt: ${token}`);

assert.equal(pkg.version,'0.9.16.1','Paketversion ist nicht v0.9.16.1.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.equal(pkg.scripts?.['test:cockpit-landscape-widget'],'node scripts/test-cockpit-landscape-widget-09161.mjs','Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes('scripts/test-cockpit-landscape-widget-09161.mjs'),'Baseline schützt die neue Regression nicht.');

console.log('MID v0.9.16.1 Cockpit-Landscape-/Widget-Regression bestanden.');
