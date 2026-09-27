import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');
const [app,mountain,forecast,fluidGrid,styles]=await Promise.all([
 read('src/App.tsx'),
 read('src/mountainSports.ts'),
 read('src/ForecastCockpit.tsx'),
 read('src/midC18FourteenReplitFluidGrid.css'),
 read('src/styles.css'),
]);

assert.match(app,/className="mountain-enrichment-disclosure"/,'additional-data status must be a disclosure');
assert.doesNotMatch(app,/mountain-enrichment-status/,'individual enrichment results must not remain permanently visible');
assert.match(app,/className="mountain-methodology"/,'safety and methodology copy must remain available in a closed disclosure');
assert.match(app,/className="mountain-methodology-list"/,'mountain methodology must be split into short factual points');
assert.match(app,/className="mountain-avalanche-source"/,'the official avalanche source must have a compact source/status block');
assert.match(app,/aktuelle Einstufung direkt bei der Quelle prüfen/,'avalanche status must point to the external authority without inventing a local level');
assert.match(app,/className="mountain-warning-details"/,'long official warning text must be hidden in a disclosure');
assert.match(app,/className="mountain-warning-details automatic"/,'long automatic MID hint text must be separate from its compact metadata');
assert.match(app,/Warnstufe \$\{mountainWarningLevelLabel\(alert\.level\)\}/,'the official warning level must remain visible');
assert.match(app,/mountainWinterKindLabel\(item\.kind\),`Warnstufe \$\{mountainWarningLevelLabel\(item\.level\)\}`/,'automatic hint kind, level, and period must remain in compact metadata');
const winterGuidance=app.slice(app.indexOf('function MountainWinterGuidance'),app.indexOf('function MountainRapidDataNotice'));
assert.doesNotMatch(winterGuidance,/ChatGPT|Agent|Prompt|agent|prompt/,'winter warning copy must not contain agent or prompt metadata');
assert.match(app,/const zones=open\?mountainZoneAssessments\(data,daylight,rapidMinutes15\):\[\]/,'zone assessment work must remain deferred until the panel opens');
assert.match(mountain,/priority:'background'/,'mountain diagnostics must use background request priority');
assert.match(mountain,/void fetchMountainDiagnostics\(points,signal\)/,'diagnostics must not block the core forecast result');
const diagnosticsStart=mountain.indexOf('async function fetchMountainDiagnostics('),diagnosticsEnd=mountain.indexOf('function mergeMountainDiagnostics(',diagnosticsStart),coreRequestStart=mountain.indexOf('const latitudes=points.map(point=>point.latitude).join',diagnosticsEnd),coreRequestEnd=mountain.indexOf('\n',coreRequestStart),diagnosticsRequest=mountain.slice(diagnosticsStart,diagnosticsEnd),coreRequest=mountain.slice(coreRequestStart,coreRequestEnd);
assert.ok(diagnosticsRequest.includes("'cape'")&&diagnosticsRequest.includes("hourly:variables.join(',')"),'CAPE must be fetched with the hourly mountain diagnostics enrichment');
assert.ok(coreRequestStart>=0&&coreRequestEnd>coreRequestStart,'core mountain request must remain separately identifiable');
assert.doesNotMatch(coreRequest,/'cape'/,'CAPE must stay out of the initial core request');
assert.match(mountain,/diagnosticsStatus:'loading'\|'ready'\|'unavailable'/,'diagnostics cache must retain its three-state enrichment status');
assert.match(mountain,/const diagnosticsStatus=entry\.diagnosticsStatus/,'cached diagnostics status must be replayed when the mountain view is reopened');
assert.match(mountain,/target\.diagnosticsStatus='ready'/,'diagnostics status becomes ready only after a successful merge');
assert.match(mountain,/target\.diagnosticsStatus='unavailable'/,'a diagnostics failure must remain unavailable in the cache');
assert.doesNotMatch(mountain,/diagnosticsResolved/,'a resolved boolean must not map failed diagnostics to ready after cache reuse');
assert.match(mountain,/void Promise\.all\(entry\.forecast\.levels\.map\(level=>geoSphereSnowMeasurement/,'station measurements must enrich the core forecast asynchronously');
assert.match(mountain,/void mountainSnowLineEnsemble\(loc,signal\)/,'the snow-line ensemble must enrich the core forecast asynchronously');

assert.match(forecast,/sunshineHours===null\?'–':`\$\{sunshineHours\} h`/,'seven-day sunshine must use a compact whole-hour label with a missing-value dash');
assert.match(forecast,/Number\.isFinite\(day\.uvMax\)\?formatUvi\(day\.uvMax\):'–'/,'seven-day UVI must use the daily maximum and show a dash when missing');
assert.match(forecast,/const bestMatchDay=days\.find\(day=>day\.date===date\)/,'14-day UVI must match the exact calendar date');
assert.match(forecast,/Number\.isFinite\(bestMatchDay\?\.uvMax\)\?formatUvi\(bestMatchDay!\.uvMax\):'–'/,'14-day UVI must use the matched daily maximum or a dash');
assert.match(forecast,/<FourteenDaySunUvi date={item\.date} days={days} sunshineSeconds={item\.bestSunshineDuration}\/>/,'14-day sunshine and UVI must share the existing compact metadata group');
assert.match(fluidGrid,/\.cockpit-fourteen-compact-meta\{[\s\S]*?grid-template-columns/,'14-day metadata must stay in its compact grid');
assert.match(fluidGrid,/\.cockpit-fourteen-sun-uvi\{[\s\S]*?white-space:nowrap/,'sunshine/UVI must remain inline rather than add a card row');
assert.match(fluidGrid,/\.cockpit-fourteen-sun-uvi>b\{font-size:10px!important/,'the actual 14-day sunshine value must be large enough to read on mobile');
assert.match(fluidGrid,/\.cockpit-fourteen-sun-uvi>small\{font-size:9px!important/,'the actual 14-day UVI value must not use legacy microtext sizing');
assert.match(styles,/\.mountain-loading\{[^}]*padding:6px 0/,'the initial mountain loading indicator must be compact');
assert.match(styles,/\.mountain-enrichment-disclosure>summary\{[^}]*min-height:44px/,'the closed enrichment disclosure summary must preserve a 44px touch target');
assert.match(styles,/\.mountain-enrichment-content\{display:grid;gap:5px;padding:6px 8px 2px\}/,'opened enrichment statuses must use a compact grid');
assert.match(styles,/\.mountain-enrichment-content>\.mountain-cache-status\{[^}]*font-size:7px/,'cache details must stay visually secondary and compact');

console.log('Progressive mountain loading, deferred disclosures, and shared 7d/14d sunshine/UVI metadata contracts passed.');