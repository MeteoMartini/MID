import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/App.tsx');
const data=read('src/extremeWeatherOutlook.ts');
const router=read('worker-src/40-aviation-router.js');
const worker=read('worker/metar-proxy.js');

assert.ok(!app.includes('MID-Prognosehinweise: bis 7 Tage bei verfügbaren Daten.'),'Der redundante Warnhorizont-Absatz darf auf der Warnungsseite nicht zurückkehren.');
assert.ok(router.includes("u.searchParams.get('range')==='extended'"),'Der Extremwetter-Router muss den bereits geparsten URL-Parameter u verwenden.');
assert.ok(!router.includes("url.searchParams.get('range')==='extended'"),'Ein nicht definierter url-Bezeichner darf den Extremwetter-Ausblick nicht mehr brechen.');
assert.ok(worker.includes("u.searchParams.get('range')==='extended'"),'Das produktive Worker-Aggregat muss den korrigierten Bereichsrouter enthalten.');
assert.ok(data.includes("throw new Error('Der regionale MID-Datendienst für den Extremwetter-Ausblick ist derzeit nicht erreichbar. Bitte erneut laden.')"),'Erweiterter Extremwetter-Ausblick braucht eine nutzergeeignete Fehlermeldung.');
const extendedLoader=data.slice(data.indexOf('export async function loadExtendedExtremeWeatherOutlook'));
assert.ok(!extendedLoader.includes("throw new Error(worker.error)"),'Der erweiterte Ausblick darf rohe Worker-Fehler nicht direkt an die UI weiterreichen.');
console.log('MID v0.9.85.153: Warnungsseite bereinigt, Extremwetter-Range-Router und nutzergeeigneter Fehlerzustand geschützt.');
