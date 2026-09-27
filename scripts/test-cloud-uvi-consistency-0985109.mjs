import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [pkgRaw,app,conditions,weather,climate,forecast]=await Promise.all([
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/currentConditions.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/ClimatePanel.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw);

assert.equal(pkg.version,'0.9.85.109','Bewölkungs-/UVI-Konsistenz gehört zu MID v0.9.85.109.');

assert.match(conditions,/value<=3\?'Leicht bewölkt':value<=6\?'Wolkig':value===7\?'Stark bewölkt':'Bedeckt'/,'Aktueller Himmelszustand folgt nicht den DWD-Oktas 1–3/4–6/7/8.');
assert.match(conditions,/code=value===0\?0:value<=3\?1:value<=6\?2:3/,'Aktuelles Trockenwetter-Piktogramm folgt nicht derselben Oktas-Klassifikation.');
assert.match(app,/else if\(reconciledCurrentPrecip\.type==='none'&&Number\.isFinite\(currentSkyCloud\)\)\{const fallbackSky=skyConditionFromOktas\(cloudOktasValue\);currentWeatherCode=fallbackSky\.code;currentWeatherLabel=fallbackSky\.label\}/,'Best-Match-Trockenwetter wird nicht mit der sichtbaren Bewölkung abgeglichen.');
assert.match(app,/cloudCompactDetail=skyConditionFromOktas\(cloudOktasValue\)\.label\.toLocaleLowerCase/,'Bewölkungskarte und Hauptzustand verwenden nicht dieselbe kanonische Klasse.');

assert.match(weather,/octas<=3\?'leicht bewölkt':octas<=6\?'wolkig':octas===7\?'stark bewölkt':'bedeckt'/,'Direkte Oktas-Texte entsprechen nicht der DWD-Systematik.');
assert.match(climate,/Wolkenlos · 0\/8/);
assert.match(climate,/Leicht bewölkt · 1–3\/8/);
assert.match(climate,/Wolkig · 4–6\/8/);
assert.match(climate,/Stark bewölkt · 7\/8/);
assert.match(climate,/Bedeckt · 8\/8/);

assert.ok(forecast.includes('<small>UVI {uvi}</small>'),'14-Tage-Vorhersage verwendet nicht UVI.');
assert.ok(!forecast.includes('<small>UV {uvi}</small>'),'14-Tage-Vorhersage enthält weiterhin das alte Kurzlabel UV.');
for(const stale of [
 '/>UV {eventCenterMetricNumber(summary.uvMax)}</span>',
 ' · UV {Number.isFinite(dailyUvMax)?formatUvi(dailyUvMax)'
])assert.ok(!app.includes(stale),'Sichtbares altes UV-Kurzlabel verblieben: '+stale);
assert.ok(app.includes('/>UVI {eventCenterMetricNumber(summary.uvMax)}</span>'),'Eventdarstellung verwendet nicht UVI.');
assert.ok(app.includes(' · UVI {Number.isFinite(dailyUvMax)?formatUvi(dailyUvMax)'),'Bergwetter verwendet nicht UVI.');

console.log('MID v0.9.85.109: DWD-konforme Oktas-Semantik und sichtbare UVI-Kurzlabels sind app-weit konsistent.');
