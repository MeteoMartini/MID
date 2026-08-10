import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.match(app,/rawForecastAmount=timelineSegments\.filter\(segment=>!segment\.nearby&&segment\.end>now\)\.reduce/,'der Rohfallback der +2-h-Niederschlagssumme muss nur direkte Standortsegmente verwenden');
assert.match(app,/forecastAmount=Number\.isFinite\(Number\(radar\.ensemble\?\.totalMedian\)\)\?Number\(radar\.ensemble!\.totalMedian\):Number\.isFinite\(Number\(radar\.forecastAmount120\)\)\?Number\(radar\.forecastAmount120\):rawForecastAmount/,'die sichtbare +2-h-Summe muss Ensemble-Median und RS-kalibrierte Menge vor der Rohsumme priorisieren');
assert.doesNotMatch(app,/forecastAmount=displaySegments\.filter\(segment=>segment\.end>now&&!segment\.nearby\)\.reduce/,'die alte Summenlogik ohne kalibrierte Mengenbasis ist noch aktiv');
assert.match(app,/Heute und morgen \$\{description\}|Heute \$\{description\}/,'die 7-Tage-Kurzinterpretation muss am ersten Tag natürlich mit Heute formulieren können');
console.log('Radar-Nowcast-Summe und Trend-Wortlaut geprüft.');
