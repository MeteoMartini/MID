import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,fixes,app,dwd,timeline,pkg,publicChangelog]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC14ViewportFixes.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/CompositeTimeline.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);
const version=String(JSON.parse(pkg).version||'');

const legacyIndex=main.indexOf("import './v078';");
for(const file of ['midC7Redesign.css','midC8VisibleRedesign.css','midC10CurrentRedesign.css','midC11TodayRedesign.css','midC12ForecastRedesign.css','midC13MobileDensity.css','midC13MobileTouch.css','midC14MapWorkspace.css','midC14ViewportFixes.css']){
 const index=main.indexOf(`import './${file}';`);
 assert.ok(index>legacyIndex,`${file} muss nach v078 geladen werden, damit Alt-CSS das Redesign nicht zurücküberschreibt.`);
}
assert.ok(main.indexOf("import './midC14ViewportFixes.css';")>main.indexOf("import './midC14MapWorkspace.css';"),'Die Screenshot-/Viewport-Fixes müssen als letzte Redesign-Schicht geladen werden.');

for(const token of [
 '.imprint-backdrop',
 '.imprint-dialog>header',
 'position:sticky!important',
 'max-height:calc(100dvh',
 '.imprint-dialog>.imprint-content',
 'overflow-y:auto!important',
 '.dwd-precip-type-radar__viewport-shell',
 'contain:layout paint!important',
 '.dwd-precip-type-radar__original-viewport',
 'overflow:auto!important',
 '.app.navigation-bottom-tabs>main',
 'overflow-x:clip',
 '.current-weather-facts>.visibility{display:none!important}',
 'grid-template-columns:repeat(2,minmax(0,1fr))!important',
 '@media(max-width:850px)',
 '@media(max-width:430px)',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(fixes.includes(token),`C14 Portrait-/Overflow-Vertrag fehlt: ${token}`);

assert.ok(app.includes('function ImprintDialog({open,onClose}'),'Das Impressum muss weiterhin als eigener Dialog existieren.');
assert.ok(app.includes('aria-label="Impressum schließen"'),'Das Impressum braucht einen expliziten Schließen-Button.');
assert.ok(dwd.includes('dwd-precip-type-radar__original-viewport'),'Das DWD-Originalbild muss in einem eigenen Scroll-/Zoom-Viewport bleiben; dynamische Zustandsklassen sind zulässig.');

assert.ok(timeline.includes("export type CompositeTimePhase='observation'|'nowcast'|'forecast'"),'Die gemeinsame Kartenzeitachse muss Beobachtung, Nowcast und Forecast unterscheiden.');
assert.ok(timeline.includes('phaseSources?:Partial<Record<CompositeTimePhase,string>>'),'Die Zeitachse muss einen transparenten Quellenwechsel je Phase unterstützen.');
assert.ok(timeline.includes('satellite -> pseudo-satellite'),'Der zukünftige Übergang von Satellitenbeobachtung zu Pseudo-Satellit muss als expliziter Provenienzvertrag dokumentiert sein.');
assert.ok(timeline.includes('does not invent five-minute frames'),'Der Kartenvertrag darf keine künstlichen Zwischenstände erzeugen.');

assert.match(version,/^0\.9\.85\.\d+$/,'C14 muss innerhalb der 0.9.85-Releasefolge bleiben.');
assert.ok(publicChangelog.startsWith(`# MID v${version}`),`Der ausgelieferte Changelog muss mit v${version} beginnen.`);

console.log(`MID-C14: CSS-Reihenfolge, kompakter Smartphone-Kopf, Portrait-Impressum, internes Zoom-Containment und zukünftiger Satellit/Pseudo-Satellit-Quellenwechsel für v${version} geprüft.`);
