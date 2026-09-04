import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [workerSrc,analysisCache,apiContracts,ventilation,coreFallback,netatmo,storm,navigation,stationSettings,workerPrepare,...urlContractTests]=await Promise.all([
  read('worker-src/20-composite-models.js'),
  read('src/analysisCache.ts'),
  read('scripts/check-api-contracts.mjs'),
  read('scripts/test-ventilation-assistant-095345.mjs'),
  read('scripts/test-core-forecast-independent-fallback-095316.mjs'),
  read('scripts/test-connected-stations-netatmo-0830.mjs'),
  read('scripts/test-storm-place-resilience-radar-performance-09154.mjs'),
  read('src/externalNavigation.ts'),
  read('src/ConnectedStationSettings.tsx'),
  read('tools/cloudflare/prepare_worker_deploy.mjs'),
  ...['scripts/test-widgetkit-xcode-structure-09710.mjs','scripts/test-keyless-basemap-contract-09743.mjs','scripts/test-extreme-outlook-mitteleuropa-recovery-096697.mjs','scripts/test-extreme-outlook-labels-layout-persistence-09668.mjs','scripts/test-extreme-outlook-dwd-scale-dashboard-persistence-09669.mjs','scripts/test-extreme-outlook-compact-legend-096610.mjs'].map(read)
]);
const decode=workerSrc.match(/function decodeXmlText\(value\)\{[^\n]+\}/)?.[0]||'';
assert.ok(decode.includes("replace(/&amp;/g,'&')"),'XML-Ampersand-Decodierung fehlt.');
assert.ok(decode.lastIndexOf("replace(/&amp;/g,'&')")>decode.indexOf("replace(/&quot;/g"),'XML-Ampersand muss zuletzt dekodiert werden.');
assert.ok(!workerSrc.includes('error.errors.map(item=>item instanceof Error?item.message'),'WMS darf interne AggregateError-Texte nicht an Clients spiegeln.');
assert.ok(workerSrc.includes("return new Response('Wetterkarte derzeit nicht verfügbar.'"),'Generischer Wetterkartenfehler fehlt.');
assert.ok(workerSrc.includes("return new Response('WMS-Karte derzeit nicht verfügbar.'"),'Generischer WMS-Fehler fehlt.');
assert.ok(analysisCache.includes('const ANALYSIS_CACHE_MEMORY=new Map<string,string>()'),'Flüchtiger Analysecache fehlt.');
assert.ok(!analysisCache.includes('localStorage'),'Kurzlebige Standort-/Analysedaten dürfen nicht persistent in localStorage geschrieben werden.');
assert.ok(!/\bwriteFile\b|\bmkdir\b/.test(apiContracts),'Live-API-Vertragstest darf Netzwerkergebnisse nicht in Dateien schreiben.');
for(const [name,source] of [['Lüftung',ventilation],['Forecast-Core',coreFallback],['Netatmo',netatmo],['Storm-Place',storm]]){
  assert.ok(!source.includes('url.includes('),`${name}: URL-Substring-Prüfung ist noch aktiv.`);
}
assert.ok(ventilation.includes("url.hostname==='api.open-meteo.com'"),'Lüftungstest prüft Open-Meteo-Host nicht exakt.');
assert.ok(coreFallback.includes("url.hostname==='api.open-meteo.com'"),'Forecast-Core-Test prüft Open-Meteo-Host nicht exakt.');
assert.ok(!navigation.includes('sessionStorage.setItem')&&!navigation.includes('localStorage.setItem'),'OAuth-Callbackdaten dürfen nicht im Browser-Speicher persistiert werden.');
assert.ok(navigation.includes('pendingNetatmoCallback=callback')&&stationSettings.includes('takePendingMidNetatmoOAuthCallback()'),'Flüchtiger OAuth-Callback-Handoff fehlt.');
assert.ok(workerPrepare.includes("mkdtemp(path.join(os.tmpdir(),'mid-worker-deploy-'))")&&workerPrepare.includes("mode:0o600,flag:'wx'"),'Worker-Deploydateien werden nicht sicher und exklusiv temporär erzeugt.');
assert.ok(!workerPrepare.includes("process.argv[2]||'/tmp/")&&!workerPrepare.includes("process.argv[3]||'/tmp/"),'Vorhersagbare Worker-Deploy-Tempdateien sind noch aktiv.');
for(const source of urlContractTests)assert.ok(!/\.includes\(['"](?:https?:\/\/|[A-Za-z0-9.-]+\.(?:com|dev|org))/.test(source),'URL-Vertrag darf Host/URL nicht per Substring prüfen.');
console.log('CodeQL-Sicherheitshärtung geprüft: XML-Unescaping, WMS-Fehler, Analysecache, exakte URL-Prüfung, flüchtiger OAuth-Handoff, sichere Tempdateien und API-Vertragsausgabe.');
