import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const app=await read('src/App.tsx');
const modern=await read('src/styles-src/30-modern.css');
const styles=await read('src/styles.css');
const pkg=JSON.parse(await read('package.json'));
const baseline=JSON.parse(await read('MID_BASELINE.json'));

assert.match(modern,/MID v0\.9\.84\.72 · Header-\/Istwetter-Audit/,'v0.9.84.72 Header-/Istwetter-Audit fehlt');
assert.match(modern,/\.navigation-bottom-tabs \.settings-header \.brand-version\{[\s\S]*white-space:nowrap!important;[\s\S]*overflow:visible!important/,'Versionsanzeige ist nicht gegen Abschneiden geschützt');
assert.match(modern,/@media\(max-width:430px\)\{[\s\S]*grid-template-columns:max-content max-content!important;[\s\S]*justify-content:space-between!important/,'Schmaler iPhone-Header reserviert Version und Aktionen nicht getrennt');
assert.match(modern,/@media\(max-width:360px\)\{[\s\S]*grid-template-areas:'brand brand' 'actions actions' 'search search'!important/,'Sehr schmale Geräte besitzen keinen dreizeiligen Header-Fallback');
assert.match(modern,/\.current-weather-facts>\.humidity small\{[\s\S]*white-space:normal!important;[\s\S]*text-wrap:balance/,'Feuchte-/Taupunkt-Beschriftung darf mobil nicht umbrechen');
assert.match(app,/className="humidity"><small>Feuchte \/ Taupunkt<\/small>/,'Feuchte-/Taupunkt-Feld fehlt');

assert.match(app,/const metricMore=\(detail:ReactNode,sourceInfo\?:ReactNode\)=>/,'Detail-/Info-Helfer für Istwetter-Karten fehlt');
assert.match(app,/label:'Taupunkt',[\s\S]*?detail:`Feuchte \$\{Math\.round\(hum\)\} %`[\s\S]*?info:metricMore/,'Taupunkt-Karte ist nicht auf eine kurze sichtbare Zusammenfassung reduziert');
assert.match(app,/label:'Wind \/ Böen',[\s\S]*?detail:`\$\{Math\.round\(windDirection\)\}° · \$\{cardinalDirection\(windDirection\)\}`[\s\S]*?info:metricMore/,'Windkarte hält Quellen-/Langtext nicht hinter (i)');
assert.match(app,/label:'Niederschlag',[\s\S]*?detail:precipitationCompactDetail\|\|undefined[\s\S]*?info:metricMore\(precipitationDetail/,'Niederschlagskarte ist nicht auf den kompakten Primärtext reduziert');
assert.match(app,/label:'Sichtweite',[\s\S]*?checked:[\s\S]*?info:metricMore\(`Meteorologische Sichtweite/,'Sichtweitenbeschreibung wurde nicht hinter (i) verschoben');
assert.match(app,/label:'UVI',[\s\S]*?detail:Number\.isFinite\(actualCurrentUv\)\?`UVI \$\{formatUvi\(actualCurrentUv\)\}`/,'UVI-Karte zeigt weiterhin unnötig langen Primärtext');
assert.match(app,/label:'Sonnenschein',[\s\S]*?detail:sunshineWindowLabel[\s\S]*?info:metricMore/,'Sonnenscheinkarte trennt Kurztext und Methodik nicht');
assert.match(app,/x\.detail\?<small className="current-metric-summary">\{x\.detail\}<\/small>:null/,'Kartenrendering blendet optionale Kurzbeschreibung nicht korrekt ein');
assert.match(modern,/\.metrics article>\.current-metric-summary\{[\s\S]*-webkit-line-clamp:2/,'Sichtbare Istwetter-Zusammenfassung ist nicht auf zwei Zeilen begrenzt');
assert.match(modern,/#current-weather-metrics \.mode-info>button\{min-width:44px!important;min-height:44px!important\}/,'Infoziele der Istwetter-Karten sind auf Touch nicht 44 px');

const versionParts=String(pkg.version).split('.').map(Number);
assert.ok(versionParts.length===4&&versionParts[0]===0&&versionParts[1]===9&&versionParts[2]===84&&versionParts[3]>=72,`package.json liegt vor dem v0.9.84.72-Vertrag: ${pkg.version}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes('scripts/test-current-header-density-098472.mjs'),`${key} enthält den neuen Pflichtvertrag nicht`);
const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(styles,modules.join(''),'styles.css ist nicht mit den kanonischen Modulen synchron');
console.log('OK current header density 098472');
