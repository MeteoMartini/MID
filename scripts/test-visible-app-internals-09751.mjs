import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const files=[
 'src/App.tsx','src/PushSettingsPanel.tsx','src/AppleWidgetSettings.tsx','src/StartupGuard.tsx','src/main.tsx',
 'src/TravelPlannerPanel.tsx','src/LongRangePanel.tsx','src/WeatherMapsPanel.tsx','src/DwdPrecipitationTypeRadar.tsx',
 'src/DwdRsSource.ts','src/eventAviation.ts','src/pushNotifications.ts','src/ventilationAssistant.ts','src/seasonalForecast.ts',
 'src/weather.ts','src/Px250Source.ts','src/travelPlanner.ts','src/SynopticPanel.tsx','index.html'
];
const sources=new Map(await Promise.all(files.map(async file=>[file,await readFile(new URL(`../${file}`,import.meta.url),'utf8')])));
const combined=[...sources.values()].join('\n');
const forbidden=[
 'kostenfreie GitHub-Pages','kostenlosen GitHub-Pages','GitHub-Pages-/Worker-Pfad','Cloudflare Worker',
 'Worker nicht konfiguriert','im MID-Worker nicht registriert','im Worker registriert','über den Worker',
 'Worker-Endpunkt','Service Worker zurückgesetzt','Service-Worker-Antwort','Cloudflare-Cron','Worker-Lauf:',
 'WidgetKit','Xcode-App','App Group','CORS-sicheren','<summary>Technische Information</summary>',
 'DWD→Pages→Worker','wird vom Worker ermittelt','kostenloses, responsives Wetterdashboard','Kostenloses responsives Wetterdashboard'
];
for(const token of forbidden)assert.ok(!combined.includes(token),`Entwicklungsinternum ist noch als sichtbarer App-Text vorhanden: ${token}`);

for(const [file,token] of [
 ['src/App.tsx','DWD ICON-D2-RUC/RUC-EPS aus DWD Open Data für die kanonische Kurzfristfusion'],
 ['src/PushSettingsPanel.tsx','für Benachrichtigungen aktiv'],
 ['src/AppleWidgetSettings.tsx','Datenfeed oder Standort noch nicht verfügbar.'],
 ['src/WeatherMapsPanel.tsx','Kartenquelle nicht verfügbar'],
 ['src/LongRangePanel.tsx','echte numerische Saisonwerte'],
 ['src/StartupGuard.tsx','App-Cache zurückgesetzt. MID wird neu geladen …']
])assert.ok(sources.get(file)?.includes(token),`Nutzerorientierter Ersatztext fehlt in ${file}: ${token}`);

const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')),test='scripts/test-visible-app-internals-09751.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
console.log('Sichtbare App-Texte sind von Kosten-, Hosting-, Worker-, Xcode- und vergleichbaren Entwicklungsinterna getrennt.');
