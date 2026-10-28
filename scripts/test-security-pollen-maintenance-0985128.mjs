import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const versionAtLeast=(value,target)=>{const a=String(value).split('.').map(Number),b=String(target).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return(a[i]||0)>(b[i]||0)}return true};

const [app,pollen,pollenCss,visual,lockRaw,canonicalWorkflow,activeWorkflow,workflowSync,policy,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PollenForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midPollen.css',import.meta.url),'utf8'),
 readFile(new URL('./test-mountain-visual-acceptance-18213.mjs',import.meta.url),'utf8'),
 readFile(new URL('../package-lock.json',import.meta.url),'utf8'),
 readFile(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),
 readFile(new URL('../.github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),
 readFile(new URL('./sync-github-workflows.mjs',import.meta.url),'utf8'),
 readFile(new URL('../MID_DEPENDENCY_UPGRADE_POLICY.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

assert.ok(app.includes('settings-health-weather')&&app.includes('<span>Gesundheitswetter</span>'),'Pollen muss als eigene Gesundheitswetter-Sektion unter Inhalte & Navigation erscheinen.');
assert.ok(app.includes('pollenDisplaySettings.showPollenForecast'),'Der bestehende optionale Pollen-Schalter muss erhalten bleiben.');
assert.ok(pollen.includes('rankedTodayEntries')&&pollen.includes('.sort((a,b)=>b.severity-a.severity'),'Aktive Pollen müssen in der kompakten Ansicht nach vorhandener Belastungsstufe priorisiert werden.');
assert.ok(pollen.includes("todayStatus=!todayAvailable?'DWD-Aktualisierung ausstehend':strongestToday?pollenLabel(strongestToday.entry):'keine Belastung'"),'Der belastungsfreie Zustand braucht eine ruhige, textlich eindeutige Zusammenfassung; fehlende heutige DWD-Daten müssen separat kenntlich bleiben.');
for(const token of ['aria-expanded={expanded}','aria-controls={detailId}','Pollenflug-Vorhersage ab heute','DWD · Produktstand'] )assert.ok(pollen.includes(token),'Pollen-Disclosure/Quelle fehlt: '+token);
assert.ok(pollenCss.includes('.pollen-disclosure')&&pollenCss.includes('min-height:44px'),'Pollen-Disclosure muss ein belastbares Touchziel besitzen.');
for(const level of ['keine','schwach','mäßig','stark'])assert.ok(pollen.includes(level),'DWD-Belastungsbegriff fehlt: '+level);

assert.ok(!app.includes('return`Eintrittswahrscheinlichkeit ${text}`'),'Externe Warnwahrscheinlichkeit darf nicht ungeprüft ausgegeben werden.');
assert.ok(app.includes("'unlikely':'unwahrscheinlich'")&&app.includes("'very likely':'sehr wahrscheinlich'"),'Qualitative Warnwahrscheinlichkeiten müssen allowlist-basiert normalisiert werden.');
assert.ok(visual.includes('Runtime.callFunctionOn')&&visual.includes("arguments:args.map(value=>({value}))"),'Browsertest muss dynamische Werte als strukturierte CDP-Argumente übergeben.');
assert.ok(visual.includes("'--remote-debugging-port=0'")&&visual.includes("'--remote-debugging-address=127.0.0.1'")&&visual.includes("path.join(profile,'DevToolsActivePort')")&&visual.includes('localCdpEndpoint(endpoint.info.webSocketDebuggerUrl,endpoint.port)'),'Chromium muss seine eigene Portbindung veröffentlichen; nur der tatsächlich gestartete Loopback-Browser darf Ziel sein.');
assert.ok(visual.includes('browserStartDiagnostics(chrome)')&&visual.includes('startup.assertRunning()')&&!visual.includes('reserveLoopbackPort')&&!visual.includes('createServer'),'Browserstart muss Exit-/Spawn-/Stderr-Diagnosen liefern und die anfällige Port-Vorreservierung vermeiden.');
const {localCdpEndpoint}=await import('./local-cdp-endpoint.mjs');
assert.equal(localCdpEndpoint('ws://127.0.0.1:9234/devtools/browser/abc123',9234),'ws://127.0.0.1:9234/devtools/browser/abc123','Nur gestarteter Loopback-Browser mit passendem Port darf CDP-Verbindung erlauben.');
for(const target of [
 'ws://example.org:9234/devtools/browser/abc123',
 'ws://localhost:9234/devtools/browser/abc123',
 'ws://127.0.0.1.evil.example:9234/devtools/browser/abc123',
 'ws://127.0.0.1:9235/devtools/browser/abc123',
 'ws://name:pass@127.0.0.1:9234/devtools/browser/abc123',
 'ws://127.0.0.1:9234/devtools/page/abc123',
 'ws://127.0.0.1:9234/devtools/browser/abc123?remote=1',
 'wss://127.0.0.1:9234/devtools/browser/abc123'
])assert.throws(()=>localCdpEndpoint(target,9234),/CDP endpoint must be the launched loopback browser/,'Unvertrauenswürdige CDP-Metadaten müssen abgelehnt werden: '+target);
for(const port of [0,-1,65536,9234.5,NaN,Infinity])assert.throws(()=>localCdpEndpoint('ws://127.0.0.1:9234/devtools/browser/abc123',port),/CDP endpoint must be the launched loopback browser/,'Ungültige CDP-Ports dürfen nicht zugelassen werden: '+port);
assert.ok(!visual.includes('document.querySelector(${JSON.stringify(selector)})'),'Selektoren dürfen nicht in Seitencode interpoliert werden.');

const lock=JSON.parse(lockRaw),brace=lock.packages?.['node_modules/brace-expansion'];
assert.equal(brace?.version,'5.0.12');
assert.match(brace?.resolved||'',/brace-expansion-5\.0\.12\.tgz$/);
const actionPin='actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1';
assert.ok(canonicalWorkflow.includes(actionPin),'Kanonischer RUC-Workflow muss download-artifact v8.0.1 SHA-gepinnt verwenden.');
assert.equal(activeWorkflow,canonicalWorkflow,'Aktiver und kanonischer RUC-Workflow müssen identisch bleiben.');
assert.ok(workflowSync.includes("DOWNLOAD_ARTIFACT_V8_SHA='3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c'"),'Expliziter Workflow-Sync muss download-artifact v8 dauerhaft pinnen.');
assert.ok(policy.includes('Wartungsreview 30.09.2026 · v0.9.85.128'));
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.ok(versionAtLeast(pkg.version,'0.9.85.128'),'v0.9.85.128-Sicherheitsvertrag muss vorwärtskompatibel bleiben.');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
console.log(`MID v${pkg.version}: Screenshot-/Security-Nachgang und Gesundheitswetter ab v0.9.85.128 geschützt.`);
