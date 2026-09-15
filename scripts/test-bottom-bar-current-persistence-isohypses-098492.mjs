import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,radar,modern,styles,models,contract,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/RadarPanel.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('worker-src/20-composite-models.js','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
for(const token of [
 "{id:'current',label:'Aktuell'",
 "!['current','warnings','short-term','forecast','ensemble','composite'].includes(id)",
 "const BOTTOM_BAR_BEHAVIOR_KEY='mid:bottom-bar-behavior:v1'",
 "type BottomBarBehavior='auto'|'fixed'",
 "bottomBarBehavior==='fixed'",
 "setBottomBarBehavior('fixed')",
 'data-fixed={bottomBarBehavior===\'fixed\'?\'true\':\'false\'}'
])assert.ok(app.includes(token),`Bottom-Bar-Vertrag fehlt: ${token}`);
for(const token of [
 'grid-template-columns:repeat(6,minmax(0,1fr))!important',
 'bottom:max(14px,calc(var(--mid-safe-bottom) + 2px))!important',
 '[data-fixed="true"]',
 'white-space:nowrap!important'
])assert.ok(modern.includes(token),`Bottom-Bar-CSS fehlt: ${token}`);
assert.ok(styles.endsWith(modern),'styles.css muss das vollständige Modern-Modul enthalten');
for(const token of [
 'const compositeSettingsRef=useRef<CompositeSettings>(initial)',
 'flushCompositeSettings',
 "window.addEventListener('pagehide',flush)",
 "document.addEventListener('visibilitychange',onVisibility)",
 'persistCompositePatch({viewMode:next',
 'vectorIsoheightFrame=',
 'function IsoheightLabels(',
 '<IsoheightCanvasFallback levels={vectorIsoheightFrame.isoheights}'
])assert.ok(radar.includes(token),`Komposit-/Isohypsen-Vertrag fehlt: ${token}`);
for(const token of [
 'const rowsPerRequest=4',
 'fetchRows=async(start,count)',
 'const batches=await Promise.all(chunks.map',
 "geopotential_height_500hPa"
])assert.ok(models.includes(token),`Beschleunigter Isohypsen-Gridpfad fehlt: ${token}`);
assert.ok(contract.includes('Aktuell · Warnungen · Kurzfrist · 7 Tage · Karten · Mehr'),'Navigationsvertrag ist nicht auf die direkte Warnlage aktualisiert');
assert.ok(contract.includes('**Fixiert**'),'Fixierter Bottom-Bar-Modus fehlt im Vertrag');
const baseline=JSON.parse(baselineRaw);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-bottom-bar-current-persistence-isohypses-098492.mjs'),'Pflichtregression fehlt in MID_BASELINE');
console.log('MID 0.9.84.92: Aktuell direkt, fixierbare/korrekt platzierte Bottom-Bar, robuste Kompositpersistenz und beschleunigte sichtbare Isohypsen geschützt.');
