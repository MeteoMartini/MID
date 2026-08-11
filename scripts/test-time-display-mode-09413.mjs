import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [time,app,radar,meteogram,cross,thunder]=await Promise.all([
 readFile(new URL('../src/timeDisplay.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8')
]);
assert.match(time,/localStorage\.getItem\(TIME_DISPLAY_STORAGE_KEY\)==='zulu'\?'zulu':'local'/,'default time mode must be local');
assert.match(time,/mode==='zulu'\?'UTC':localTimeZone\|\|readTimeDisplayLocalZone\(\)/,'Zulu mode must resolve to UTC');
assert.match(app,/strong>Lokalzeit<\/strong><small>Zeitzone des gewählten Ortes · Standard<\/small>/,'local time settings option/default label missing');
assert.match(app,/strong>Z-Zeit<\/strong><small>UTC \/ meteorologische Zulu-Zeit<\/small>/,'Zulu settings option missing');
assert.match(app,/Gilt appweit für Wetter-, Radar-, Warn- und Diagrammzeiten\. Die Ortszeit im Standortkopf bleibt immer lokal\./,'scope explanation missing');
assert.match(app,/Ortszeit <LocalClock timezone=\{w\.timezone\}/,'location header must stay on local time');
assert.match(app,/timezone=\{displayTimezone\}/,'weather modules must receive the selected display timezone');
assert.match(radar,/formatInZone\(.*timezone/,'composite times must use the provided selected timezone');
assert.match(meteogram,/displayTimeZone\(timeZone\)/,'meteogram must use global time basis');
assert.match(cross,/displayTimeLabel\(\)/,'Cross Section time inputs must expose selected time basis');
assert.match(cross,/displayInputFromUtc\(start\)/,'Cross Section UTC backend times must be converted for display');
assert.match(thunder,/context\.timezone/,'thunderstorm detail clocks must use selected time basis');
console.log('ok - app-wide Local/Z time basis with local default and local-only location header exception verified');
