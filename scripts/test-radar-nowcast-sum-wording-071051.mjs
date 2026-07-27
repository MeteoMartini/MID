import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.match(app,/forecastAmount=timelineSegments\.filter\(segment=>segment\.rate>0&&segment\.end>now\)\.reduce/,'die +2-h-Niederschlagssumme muss aus allen zukünftigen Diagrammsegmenten gebildet werden');
assert.doesNotMatch(app,/forecastAmount=displaySegments\.filter\(segment=>segment\.end>now&&!segment\.nearby\)\.reduce/,'die alte Summenlogik ohne Umgebungssignal ist noch aktiv');
assert.match(app,/Heute und morgen \$\{description\}|Heute \$\{description\}/,'die 7-Tage-Kurzinterpretation muss am ersten Tag natürlich mit Heute formulieren können');
console.log('Radar-Nowcast-Summe und Trend-Wortlaut geprüft.');
