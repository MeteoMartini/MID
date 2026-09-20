import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const app=await read('src/App.tsx');
const features=await read('src/styles-src/10-features.css');
const ensemble=await read('src/styles-src/20-ensemble-composite.css');
const modern=await read('src/styles-src/30-modern.css');
const legacy=await read('src/v078.css');
const styles=await read('src/styles.css');
const nowcastSkybar=await read('src/midC18NowcastSkybarPolish.css');
const main=await read('src/main.tsx');
const pkg=JSON.parse(await read('package.json'));
const baseline=JSON.parse(await read('MID_BASELINE.json'));

assert.match(features,/MID v0\.9\.84\.73 · Detail-\/Popover-Audit/,'v0.9.84.73 Detail-/Popover-Audit fehlt');
assert.match(modern,/MID v0\.9\.84\.73 · Sekundäransichten/,'v0.9.84.73 Sekundäransichten-Audit fehlt');
assert.match(legacy,/MID v0\.9\.84\.73 · spätes Legacy-CSS/,'v0.9.84.73 Legacy-Nachsteuerung fehlt');

assert.match(features,/\.metric-source-info>div>small\{font-size:var\(--mid-text-micro\);line-height:1\.45\}/,'Quelleninformationen verwenden nicht die semantische Mindesttypografie');
assert.match(features,/\.uvi-band-list small\{font-size:var\(--mid-text-micro\);line-height:1\.2\}/,'UV-Gefahrenstufen bleiben zu klein');
assert.match(features,/\.advanced-feature-group>summary small,[\s\S]*\.advanced-feature-note\{font-size:var\(--mid-text-micro\);line-height:1\.45\}/,'Erweiterte Detailtexte sind nicht vereinheitlicht');
assert.match(features,/@media\(any-pointer:coarse\)\{[\s\S]*\.advanced-feature-group>summary,[\s\S]*min-height:44px/,'Disclosure-/Select-Bedienung erreicht auf Touch keine 44 px');

assert.match(legacy,/\.model-run-details>button\{min-height:36px;[\s\S]*font-size:var\(--mid-text-xs\)/,'Modellstand-Trigger ist nicht lesbar/touchfreundlich normalisiert');
assert.match(legacy,/\.model-run-row>small,[\s\S]*font-size:var\(--mid-text-micro\)/,'Modelllauf-Metadaten sind nicht auf semantische Mikrotypografie angehoben');
assert.match(legacy,/\.module-inline-segmented button\{min-height:36px;[\s\S]*font-size:var\(--mid-text-xs\)/,'Inline-Segmentsteuerung bleibt historisch zu klein');
assert.match(legacy,/\.module-inline-options select\{height:36px;min-height:36px;[\s\S]*font-size:var\(--mid-text-xs\)/,'Inline-Selects bleiben historisch zu klein');
assert.match(legacy,/@media\(max-width:520px\)\{[\s\S]*\.hero>\.hero-day-range small\{font-size:10px!important;[\s\S]*\.hero>\.hero-day-range b\{font-size:12px!important;/,'Mobile Tmin/Tmax-Pille bleibt unterhalb der Lesbarkeitsschwelle');
assert.match(legacy,/@media\(any-pointer:coarse\)\{[\s\S]*\.model-run-details>button,[\s\S]*min-height:44px/,'Legacy-Detailsteuerungen erreichen auf Touch keine 44 px');

assert.match(modern,/\.compact-trend-tooltip\{[\s\S]*width:min\(340px,calc\(100vw - 16px\)\);[\s\S]*font-size:var\(--mid-text-micro\)/,'Ensemble-Tooltip wurde nicht lesbar neu skaliert');
assert.match(modern,/@media\(max-width:360px\)\{[\s\S]*\.compact-trend-tooltip\{width:calc\(100vw - 10px\);[\s\S]*font-size:10px/,'Sehr schmale Ensemble-Tooltips besitzen keinen kollisionsarmen Fallback');
assert.match(modern,/\.long-range-dwd-periods article>header strong\{font-size:var\(--mid-text-xs\)\}/,'Langfrist-DWD-Karten besitzen weiterhin zu kleine Überschriften');
assert.match(modern,/\.long-range-model-title>b\{font-size:var\(--mid-text-micro\);line-height:1\.15\}/,'Langfrist-Modellstatus bleibt historisch zu klein');
assert.match(modern,/@media\(any-pointer:coarse\)\{[\s\S]*\.hour-chart-tooltip>header button,[\s\S]*min-width:44px;min-height:44px/,'Tooltip-Schließen erreicht auf Touch keine 44 px');

assert.match(app,/className="model-run-popover"/,'Modellstand-Popover fehlt in der Anwendung');
assert.match(app,/className="uvi-popover-content"/,'UV-Popover fehlt in der Anwendung');
assert.match(app,/className="hour-chart-tooltip persistent"/,'Stündliches Detail-Tooltip fehlt in der Anwendung');
assert.ok(app.includes('className="radar-nowcast-popover" width={420}'),'Radar-Nowcast-Popover muss auf Smartphones die verfügbare Breite nutzen.');
for(const token of [
 ".radar-nowcast-popover.app-portal-popover",
 "grid-template-columns:minmax(0,1fr) minmax(132px,44%)",
 "overflow-wrap:normal!important",
 ".radar-nowcast-strip.compact .radar-nowcast-track",
 "height:96px!important",
 ".current-precip-panel>span",
 "-webkit-line-clamp:unset!important"
]) assert.ok(nowcastSkybar.includes(token),`Nowcast-Lesbarkeitsregel fehlt: ${token}`);
assert.ok(main.includes("import './midC18NowcastSkybarPolish.css';"),'Später Nowcast-/Skybar-Polish muss im Produktionsentry geladen werden.');

assert.match(app,/module-inline-segmented mountain-season-control/,'Berg-Segmentsteuerung fehlt in der Anwendung');
const astronomyImport=app.match(/import\s*\{([^}]*)\}\s*from '\.\/astronomy';/)?.[1]??'';
assert.doesNotMatch(astronomyImport,/\b(?:formatDayLengthChange|formatDuration)\b/,'Nach der v0.9.84.72-Verdichtung verbleiben ungenutzte Astronomie-Imports und brechen TypeScript noUnusedLocals');

const versionParts=pkg.version.split('.').map(Number);
const minimumVersion=[0,9,84,73];
assert.ok(versionParts.length===4&&versionParts.every(Number.isFinite)&&versionParts.reduce((comparison,part,index)=>comparison!==0?comparison:part-minimumVersion[index],0)>=0,'package.json ist älter als v0.9.84.73');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes('scripts/test-secondary-detail-popover-readability-098473.mjs'),`${key} enthält den neuen Pflichtvertrag nicht`);
const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(styles,modules.join(''),'styles.css ist nicht mit den kanonischen Modulen synchron');
console.log('OK secondary detail/popover readability 098473 · Radar-Nowcast mobil ohne Mikroschrift, Clipping oder Wortzerstückelung');
