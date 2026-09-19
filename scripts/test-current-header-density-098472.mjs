import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const app=await read('src/App.tsx');
const modern=await read('src/styles-src/30-modern.css');
const midNext=await read('src/midNext.css');
const styles=await read('src/styles.css');
const pkg=JSON.parse(await read('package.json'));
const baseline=JSON.parse(await read('MID_BASELINE.json'));

assert.match(modern,/MID v0\.9\.84\.72 · Header-\/Istwetter-Audit/,'v0.9.84.72 Header-/Istwetter-Audit fehlt');
assert.match(modern,/\.navigation-bottom-tabs \.settings-header \.brand-version\{[\s\S]*white-space:nowrap!important;[\s\S]*overflow:visible!important/,'Versionsanzeige ist nicht gegen Abschneiden geschützt');
assert.match(modern,/@media\(max-width:430px\)\{[\s\S]*grid-template-columns:max-content max-content!important;[\s\S]*justify-content:space-between!important/,'Schmaler iPhone-Header reserviert Version und Aktionen nicht getrennt');
assert.match(modern,/@media\(max-width:360px\)\{[\s\S]*grid-template-areas:'brand brand' 'actions actions' 'search search'!important/,'Sehr schmale Geräte besitzen keinen dreizeiligen Header-Fallback');
assert.match(modern,/\.current-weather-facts>\.humidity small\{[\s\S]*white-space:normal!important;[\s\S]*text-wrap:balance/,'Feuchte-/Taupunkt-Beschriftung darf mobil nicht umbrechen');
assert.match(app,/className="humidity"><small>Taupunkt \/ Feuchte<\/small>/,'Feuchte-/Taupunkt-Feld fehlt');

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

assert.match(midNext,/MID v0\.9\.85\.8 · iPhone-Istwetter/,'v0.9.85.8 iPhone-Istwetter-Reparatur fehlt');
assert.match(midNext,/\.hero\.current-compact \.current-weather-overview\{[\s\S]*display:grid!important;[\s\S]*grid-template-columns:minmax\(104px,\.7fr\) minmax\(180px,1\.2fr\) minmax\(340px,1\.6fr\)!important/,'MID Next löst den Istwetter-Overview weiterhin in das äußere Grid auf');
assert.match(midNext,/@media\(max-width:620px\)\{[\s\S]*\.current-weather-facts\{[\s\S]*grid-column:1\/-1!important;[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/,'iPhone-Istwetterwerte belegen nicht die volle Breite als 2-Spalten-Raster');
assert.match(midNext,/\.current-weather-facts>span:nth-child\(5\)\{[\s\S]*grid-column:span 2!important/,'Fünfter Istwetterwert spannt auf dem iPhone nicht über beide Spalten');
assert.match(midNext,/\.current-weather-overview>\.hero-day-range\{[\s\S]*position:static!important;[\s\S]*transform:none!important/,'Tmin/Tmax liegt weiterhin absolut über dem mobilen Istwetterinhalt');

assert.match(midNext,/MID-C3 · Tabletvertrag/,'MID-C3 Tabletvertrag fehlt');
assert.match(midNext,/@media \(min-width:851px\) and \(max-width:1399px\)\{[\s\S]*padding-left:100px!important/,'Tabletmodus reserviert keinen sicheren linken Inhaltsabstand');
assert.match(midNext,/\.navigation-bottom-tabs \.dashboard-section-quick\.dashboard-bottom-tabs\{[\s\S]*width:72px!important;[\s\S]*height:max-content!important;[\s\S]*align-content:start!important/,'Tablet-Navigation ist nicht als kompakte, oben gebündelte 72-px-Leiste ausgeführt');
assert.match(midNext,/button span\{[\s\S]*display:none!important/,'Tablet-Navigation blendet die breiten Textlabels nicht aus');
assert.match(midNext,/\.dashboard-section-rail\{[\s\S]*display:none!important/,'Zusätzliche Tablet-Rail würde den Inhalt weiter überdecken');
assert.match(midNext,/@media \(min-width:1400px\)\{[\s\S]*padding-left:196px!important/,'Breiter Desktop besitzt keinen getrennten Navigationsvertrag');

const versionParts=String(pkg.version).split('.').map(Number);
const minimumVersion=[0,9,84,72];
const isAtLeastMinimum=versionParts.length===4&&versionParts.every(Number.isFinite)&&versionParts.reduce((comparison,part,index)=>comparison!==0?comparison:part-minimumVersion[index],0)>=0;
assert.ok(isAtLeastMinimum,`package.json liegt vor dem v0.9.84.72-Vertrag: ${pkg.version}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes('scripts/test-current-header-density-098472.mjs'),`${key} enthält den neuen Pflichtvertrag nicht`);
const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(styles,modules.join(''),'styles.css ist nicht mit den kanonischen Modulen synchron');
console.log('OK current header density 098472');
