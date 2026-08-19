import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [workerSrc,analysisCache,apiContracts,ventilation,coreFallback,netatmo,storm]=await Promise.all([
  read('worker-src/20-composite-models.js'),
  read('src/analysisCache.ts'),
  read('scripts/check-api-contracts.mjs'),
  read('scripts/test-ventilation-assistant-095345.mjs'),
  read('scripts/test-core-forecast-independent-fallback-095316.mjs'),
  read('scripts/test-connected-stations-netatmo-0830.mjs'),
  read('scripts/test-storm-place-resilience-radar-performance-09154.mjs')
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
console.log('CodeQL-Sicherheitshärtung geprüft: XML-Unescaping, WMS-Fehler, Analysecache, URL-Hostprüfung und API-Vertragsausgabe.');
