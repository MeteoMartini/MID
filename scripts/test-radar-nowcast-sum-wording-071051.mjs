import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const sevenDay=readFileSync(new URL('../src/SevenDayForecastSummary.tsx',import.meta.url),'utf8');
assert.match(app,/amountCoverage=radarForecastCoverage\(radar\),forecastAmount=amountCoverage\.partialAmountMm/,'Die sichtbare Summe muss exakt die verfügbaren zentralen 5-Minuten-Mengen des bezeichneten Fensters verwenden.');
assert.ok(app.includes("amountCoverage.complete?'2-h-Summe':'Teilsumme'")&&app.includes('keine vollständige 2-h-Summe'),'Unvollständige Reihen dürfen keine 2-h-Summe vorspiegeln.');
assert.doesNotMatch(app,/forecastAmount=displaySegments\.filter\(segment=>segment\.end>now&&!segment\.nearby\)\.reduce/,'die alte Summenlogik ohne kalibrierte Mengenbasis ist noch aktiv');
assert.match(sevenDay,/Heute und morgen \$\{description\}|Heute \$\{description\}/,'die 7-Tage-Kurzinterpretation muss am ersten Tag natürlich mit Heute formulieren können');
console.log('Radar-Nowcast-Summe und Trend-Wortlaut geprüft.');
