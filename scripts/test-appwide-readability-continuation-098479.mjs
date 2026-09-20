import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const modern=readFileSync('src/styles-src/30-modern.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const app=readFileSync('src/App.tsx','utf8');
const sourceDiagnostics=readFileSync('src/ForecastSourceDiagnostics.tsx','utf8');
const verification=readFileSync('src/ForecastVerificationPanel.tsx','utf8');
const route=readFileSync('src/RouteWeatherPanel.tsx','utf8');
const modulesSource=readFileSync('src/dashboardModules.ts','utf8');
const auditMatrix=readFileSync('MID_APP_VIEW_AUDIT_0.9.84.79.md','utf8');
const typography=readFileSync('src/midC18TypographyReadability.css','utf8');
const secondary=readFileSync('src/midC18SecondarySurfaceRefinement.css','utf8');
const shellFinish=readFileSync('src/midC18ShellMobileFinish.css','utf8');
const controlGrammar=readFileSync('src/midC181ControlGrammar.css','utf8');
const main=readFileSync('src/main.tsx','utf8');

const marker='MID v0.9.84.79 · appweiter Rest-Audit nach dem 17.7.23-Vertrag.';
assert.ok(modern.includes(marker),'Appweiter Rest-Auditmarker fehlt.');

for(const token of [
 '.local-now-disclosure>summary small',
 '.local-now-disclosure-body>ul',
 '.warnings-responsive-shell .hazards-responsive-head>div>span',
 '.forecast-source-weight-list article b',
 '.forecast-verification>header span',
 '.route-weather-card :is(.route-weather-controls label>span',
 '.ensemble-scenarios article>header strong',
 '.dashboard-section-nav-list.drawer.progressive>details>summary'
]) assert.ok(modern.includes(token),`Rest-Auditregel fehlt: ${token}`);

assert.match(modern,/\.forecast-source-weight-list article b\{[\s\S]*?white-space:normal!important;[\s\S]*?text-overflow:clip!important;/,'Quellennamen müssen vollständig umbrechen können.');
assert.match(modern,/\.local-now-disclosure>summary em\{white-space:normal!important;/,'Lokaler Hinweisstatus muss umbrechen können.');
assert.match(modern,/\.settings-dialog small,[\s\S]*?font-size:var\(--mid-text-micro\)!important;/,'Einstellungen müssen die gemeinsame Mikrotext-Lesbarkeit verwenden.');
assert.match(modern,/@media\(hover:none\),\(pointer:coarse\),\(any-pointer:coarse\)\{[\s\S]*?min-height:44px;/,'Neue Sekundärbereiche brauchen auf Touch 44-px-Ziele.');

for(const token of [
 "--mid18-text-label",
 "--mid18-text-meta",
 "--mid18-text-body",
 "--mid18-text-control",
 ".mid-data-status b",
 ".warning-event-main strong",
 ".water-source",
 "@media(max-width:620px)",
 "@media(max-width:850px) and (pointer:coarse)"
]) assert.ok(typography.includes(token),`MID-18-Typografie-Regel fehlt: ${token}`);
assert.ok(main.includes("import './midC18TypographyReadability.css';"),'MID-18-Typografie-Layer fehlt im Produktionsentry.');
assert.ok(main.includes("import './midC18SecondarySurfaceRefinement.css';"),'MID-18-Sekundärflächen-Refinement fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midC18SecondarySurfaceRefinement.css';")>main.indexOf("import './midC18TypographyReadability.css';"),'Sekundärflächen-Refinement muss nach dem Typografie-Layer laden.');
assert.ok(main.includes("import './midC18ShellMobileFinish.css';"),'MID-18-Shell-/Mobile-Finish fehlt im Produktionsentry.');
assert.ok(main.includes("import './midC181ControlGrammar.css';"),'MID-18.1-Control-Grammar fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midC181ControlGrammar.css';")>main.indexOf("import './midC18ShellMobileFinish.css';"),'Control-Grammar muss nach dem Shell-/Mobile-Finish laden.');
assert.ok(main.indexOf("import './midC18ShellMobileFinish.css';")>main.indexOf("import './midC18SecondarySurfaceRefinement.css';"),'Shell-/Mobile-Finish muss nach dem Sekundärflächen-Refinement laden.');
for(const token of [
 "--mid181-control-height:36px",
 ".mid-timeline",
 ".mid-layer-chips",
 ".composite-presets",
 ".modern-forecast-horizons",
 ".module-inline-segmented",
 ".mid-data-status:not(.limited):not(.pending)",
 "@media(max-width:850px)"
]) assert.ok(controlGrammar.includes(token),`MID-18.1-Control-Grammar-Regel fehlt: ${token}`);
for(const token of [
 "--mid18-mobile-nav-reserve:132px",
 ".dashboard-section-quick.dashboard-bottom-tabs::before",
 ".header-favorites .favorite-bubbles",
 ".water-tides>div",
 "scroll-snap-type:x mandatory",
 "@media(max-width:430px)",
 "@media(max-width:390px)"
]) assert.ok(shellFinish.includes(token),`MID-18-Shell-/Mobile-Regel fehlt: ${token}`);
for(const token of [
 ".hero.current-compact+.metrics",
 "[data-mid-view='forecast'] .forecast-inline-detail",
 ".forecast-source-diagnostics",
 ".water-metric-group",
 ".water-tides",
 "@media(max-width:390px)"
]) assert.ok(secondary.includes(token),`MID-18-Sekundärflächen-Regel fehlt: ${token}`);
assert.ok(main.indexOf("import './midC18TypographyReadability.css';")>main.indexOf("import './midC18HierarchyPolish.css';"),'Typografie-Layer muss nach dem Hierarchie-Polish laden.');
assert.ok(!app.includes('modern-today-overview'),'Verworfene Beta-Heute-Übersicht darf nicht wiederkehren.');
for(const token of ['local-now-disclosure','warnings-responsive-shell',"case'current':return <MemoCurrent"]) assert.ok(app.includes(token),`App-Nutzung fehlt: ${token}`);
assert.ok(sourceDiagnostics.includes('forecast-source-weight-list'),'Quellendiagnostik-Komponente fehlt.');
assert.ok(verification.includes('forecast-verification'),'Verifikationskomponente fehlt.');
assert.ok(route.includes('route-weather-card'),'Routenwetter-Komponente fehlt.');

const moduleIds=[...modulesSource.matchAll(/\{id:'([^']+)'/g)].map(match=>match[1]);
assert.equal(moduleIds.length,18,'Dashboard-Modulkatalog muss 18 aktivierbare Hauptmodule enthalten.');
for(const id of moduleIds){
 const labelMatch=new RegExp(`\\{id:'${id}',label:'([^']+)'`).exec(modulesSource);
 const label=labelMatch?.[1];
 assert.ok(label&&auditMatrix.includes(`| ${label} |`),`Audit-Matrix deckt Dashboard-Modul ${id} / ${label??'?'} nicht ab.`);
}

const modules=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,modules,'src/styles.css muss exakt aus den fünf kanonischen Styles-Modulen erzeugt sein.');

console.log('MID 18.1: Appweite Lesbarkeit, Sekundärflächen, Shell-/Mobile-Finish und einheitliche Bediengrammatik geprüft.');
