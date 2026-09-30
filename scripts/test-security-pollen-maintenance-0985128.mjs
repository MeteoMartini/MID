import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,pollen,pollenCss,visual,lockRaw,canonicalWorkflow,activeWorkflow,policy,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PollenForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midPollen.css',import.meta.url),'utf8'),
 readFile(new URL('./test-mountain-visual-acceptance-18213.mjs',import.meta.url),'utf8'),
 readFile(new URL('../package-lock.json',import.meta.url),'utf8'),
 readFile(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),
 readFile(new URL('../.github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),
 readFile(new URL('../MID_DEPENDENCY_UPGRADE_POLICY.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

assert.ok(app.includes('settings-health-weather')&&app.includes('<span>Gesundheitswetter</span>'),'Pollen muss als eigene Gesundheitswetter-Sektion unter Inhalte & Navigation erscheinen.');
assert.ok(app.includes('pollenDisplaySettings.showPollenForecast'),'Der bestehende optionale Pollen-Schalter muss erhalten bleiben.');
assert.ok(pollen.includes('rankedTodayEntries')&&pollen.includes('.sort((a,b)=>b.level-a.level'),'Aktive Pollen müssen in der kompakten Ansicht nach vorhandener Belastungsstufe priorisiert werden.');
assert.ok(pollen.includes('pollen-clear-summary')&&pollen.includes('keine Belastung'),'Der belastungsfreie Zustand braucht eine ruhige, textlich eindeutige Zusammenfassung.');
for(const token of ['aria-expanded={expanded}','aria-controls={detailId}','Pollenflug-Vorhersage für heute, morgen und übermorgen',"Quelle: {data.provider||'DWD'}"])assert.ok(pollen.includes(token),'Pollen-Disclosure/Quelle fehlt: '+token);
assert.ok(pollenCss.includes('.pollen-disclosure')&&pollenCss.includes('min-height: 44px'),'Pollen-Disclosure muss ein belastbares Touchziel besitzen.');
for(const level of ['keine','schwach','mäßig','stark'])assert.ok(pollen.includes(level),'DWD-Belastungsbegriff fehlt: '+level);

assert.ok(!app.includes('return`Eintrittswahrscheinlichkeit ${text}`'),'Externe Warnwahrscheinlichkeit darf nicht ungeprüft ausgegeben werden.');
assert.ok(app.includes("'unlikely':'unwahrscheinlich'")&&app.includes("'very likely':'sehr wahrscheinlich'"),'Qualitative Warnwahrscheinlichkeiten müssen allowlist-basiert normalisiert werden.');
assert.ok(visual.includes('Runtime.callFunctionOn')&&visual.includes('reserveLoopbackPort'),'Browsertest muss strukturierte CDP-Argumente und einen lokal reservierten Port verwenden.');
assert.ok(!visual.includes('DevToolsActivePort'),'Dateidaten dürfen nicht mehr die Chromium-Netzwerkadresse steuern.');
assert.ok(!visual.includes('document.querySelector(${JSON.stringify(selector)})'),'Selektoren dürfen nicht in Seitencode interpoliert werden.');

const lock=JSON.parse(lockRaw),brace=lock.packages?.['node_modules/brace-expansion'];
assert.equal(brace?.version,'5.0.12');
assert.match(brace?.resolved||'',/brace-expansion-5\.0\.12\.tgz$/);
const actionPin='actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1';
assert.ok(canonicalWorkflow.includes(actionPin),'Kanonischer RUC-Workflow muss download-artifact v8.0.1 SHA-gepinnt verwenden.');
assert.equal(activeWorkflow,canonicalWorkflow,'Aktiver und kanonischer RUC-Workflow müssen identisch bleiben.');
assert.ok(policy.includes('Wartungsreview 30.09.2026 · v0.9.85.128'));
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,'0.9.85.128');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
console.log('MID v0.9.85.128: Screenshot-/Security-Nachgang und Gesundheitswetter geschützt.');
