import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [pkgRaw,app,conditions,weather,climate,forecast,pictogram,intervals,fusion,shortTerm,eventEngine,routeWeather,waterWeather,periodVisual,eventInterval]=await Promise.all([
 readFile(new URL('package.json',root),'utf8'),
 readAppFeatureSources(),
 readFile(new URL('src/currentConditions.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/ClimatePanel.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/WeatherPictogram.tsx',root),'utf8'),
 readFile(new URL('src/precipitationIntervals.ts',root),'utf8'),
 readFile(new URL('src/forecastFusion.ts',root),'utf8'),
 readFile(new URL('src/ShortTermForecast.tsx',root),'utf8'),
 readFile(new URL('src/eventWeatherEngine.ts',root),'utf8'),
 readFile(new URL('src/routeWeather.ts',root),'utf8'),
 readFile(new URL('src/WaterSportsPanel.tsx',root),'utf8'),
 readFile(new URL('src/periodWeatherVisual.ts',root),'utf8'),
 readFile(new URL('src/eventIntervalSemantics.ts',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw);

const versionParts=String(pkg.version).split('.').map(value=>Number.parseInt(value,10));
assert.ok(versionParts.length>=4&&versionParts.every(Number.isFinite)&&(versionParts[0]>0||versionParts[1]>9||versionParts[1]===9&&(versionParts[2]>85||versionParts[2]===85&&versionParts[3]>=109)),'Bewölkungs-/UVI-Konsistenz gilt ab MID v0.9.85.109.');

assert.match(conditions,/value<=3\?'Leicht bewölkt':value<=6\?'Wolkig':value===7\?'Stark bewölkt':'Bedeckt'/,'Aktueller Himmelszustand folgt nicht den DWD-Oktas 1–3/4–6/7/8.');
assert.match(conditions,/code=value===0\?0:value<=3\?1:value<=6\?2:3/,'Aktuelles Trockenwetter-Piktogramm folgt nicht derselben Oktas-Klassifikation.');
assert.match(app,/else if\(reconciledCurrentPrecip\.type==='none'&&Number\.isFinite\(currentSkyCloud\)\)\{const fallbackSky=skyConditionFromOktas\(cloudOktasValue\);currentWeatherCode=fallbackSky\.code;currentWeatherLabel=fallbackSky\.label\}/,'Best-Match-Trockenwetter wird nicht mit der sichtbaren Bewölkung abgeglichen.');
assert.match(app,/cloudCompactDetail=skyConditionFromOktas\(cloudOktasValue\)\.label\.toLocaleLowerCase/,'Bewölkungskarte und Hauptzustand verwenden nicht dieselbe kanonische Klasse.');

assert.match(weather,/octas===0\?'Wolkenlos':octas<=3\?'Leicht bewölkt':octas<=6\?'Wolkig':octas===7\?'Stark bewölkt':'Bedeckt'/,'Direkte Oktas-Texte entsprechen nicht der DWD-Systematik.');
assert.match(climate,/Wolkenlos · 0\/8/);
assert.match(climate,/Leicht bewölkt · 1–3\/8/);
assert.match(climate,/Wolkig · 4–6\/8/);
assert.match(climate,/Stark bewölkt · 7\/8/);
assert.match(climate,/Bedeckt · 8\/8/);

assert.match(pictogram,/if\(oktas<=3\)return'mostly-clear';[\s\S]*if\(oktas<=6\)return'partly-cloudy';[\s\S]*return'cloudy';/,'Piktogramm-Gruppierung trennt 4–6/8 nicht von 7–8/8.');
assert.match(pictogram,/oktas===0\?'wolkenlos':oktas<=3\?'leicht bewölkt':oktas<=6\?'wolkig':oktas===7\?'stark bewölkt':'bedeckt'/,'Piktogramm-Zugänglichkeitsbeschreibung folgt nicht der DWD-Oktas-Semantik.');
assert.match(intervals,/if\(cloud<6\.25\)return 0;[\s\S]*if\(cloud<43\.75\)return 1;[\s\S]*if\(cloud<81\.25\)return 2;[\s\S]*return 3;/,'Niederschlagsintervall-Fallback verwendet noch alte Bewölkungsgrenzen.');
assert.match(fusion,/if\(cover>=81\.25\)return 3;if\(cover>=43\.75\)return 2;if\(cover>=6\.25\)return 1;return 0/,'Hyperlokaler Forecast-Fusion-Fallback verwendet noch alte Bewölkungsgrenzen.');
assert.equal((fusion.match(/if\(cloud<6\.25\)return 0;if\(cloud<43\.75\)return 1;if\(cloud<81\.25\)return 2;return 3;/g)||[]).length,2,'Stündlicher und 15-minütiger Forecast-Fusion-Fallback müssen dieselben Oktas-Grenzen verwenden.');
assert.match(fusion,/if\(!Number\.isFinite\(meanCloud\)\)return 3;if\(meanCloud<6\.25\)return 0;if\(meanCloud<43\.75\)return 1;if\(meanCloud<81\.25\)return 2;return 3/,'Tagescode-Fallback verwendet noch alte Bewölkungsgrenzen.');
assert.match(shortTerm,/weatherLabel:parts\.type==='none'\?\(Number\.isFinite\(cloud\)\?cloudOktasLabel\(cloud\):label\(parts\.displayCode\)\)/,'Kurzfrist zeigt trockene Wettercodes weiterhin ohne kanonische Bewölkungsbezeichnung.');
assert.match(app,/mountainHourlyDryWeatherCode[\s\S]*cloud<6\.25[\s\S]*cloud<43\.75[\s\S]*cloud<81\.25/,'Bergwetter-Dry-Code verwendet noch alte Bewölkungsgrenzen.');
assert.match(app,/weather\.type==='none'\?skyConditionFromOktas\(cloudOktas\(mountainForecastHourlyValue\(level,'cloud_cover',row\.index\)\)\)\.label/,'Bergwetter-Trockenlabel wird nicht direkt aus dem kanonischen Bedeckungsgrad gebildet.');
assert.match(app,/parts\.weather\.type==='none'\?skyConditionFromOktas\(cloudOktas\(mountainForecastHourlyValue\(level,'cloud_cover',parts\.row\.index\)\)\)\.label/,'Bergwetter-3h-Perioden verwenden noch generische Wettercode-Texte.');
assert.match(eventEngine,/cloudOktasLabel\(Number\(representative\.point\.cloud\)\)/,'Event-Zusammenfassung verwendet bei trockenem Wetter nicht die kanonische Bewölkungsbezeichnung.');
assert.match(eventEngine,/cloudOktasLabel\(Number\(hour\.cloud\)\)/,'Event-Zeitlinie verwendet bei trockenem Wetter nicht die kanonische Bewölkungsbezeichnung.');
assert.match(routeWeather,/cloudOktasLabel\(Number\(hour\.cloud\)\)/,'Routenwetter verwendet bei trockenem Wetter nicht die kanonische Bewölkungsbezeichnung.');
assert.match(waterWeather,/weatherLabel:part\.type==='none'&&Number\.isFinite\(cloud\)\?cloudOktasLabel\(cloud\)/,'Wasserwetter verwendet bei trockenem Wetter nicht die kanonische Bewölkungsbezeichnung.');
assert.match(periodVisual,/if\(Number\(cloud\)<6\.25\)return 0;[\s\S]*if\(Number\(cloud\)<43\.75\)return 1;[\s\S]*if\(Number\(cloud\)<81\.25\)return 2;/,'Periodenpiktogramme verwenden noch alte Bewölkungsgrenzen.');
assert.match(periodVisual,/drySky&&Number\.isFinite\(cloud\)\?cloudOktasLabel\(Number\(cloud\)\)/,'Periodenpiktogramme verwenden noch generische Wettercode-Titel.');
assert.match(eventInterval,/if\(cloud!==null\)\{if\(cloud<6\.25\)return 0;if\(cloud<43\.75\)return 1;if\(cloud<81\.25\)return 2;return 3\}/,'Event-Intervallcode verwendet noch alte Bewölkungsgrenzen.');

assert.ok(forecast.includes('<small>UVI {uvi}</small>'),'14-Tage-Vorhersage verwendet nicht UVI.');
assert.ok(!forecast.includes('<small>UV {uvi}</small>'),'14-Tage-Vorhersage enthält weiterhin das alte Kurzlabel UV.');
for(const stale of [
 '/>UV {eventCenterMetricNumber(summary.uvMax)}</span>',
 ' · UV {Number.isFinite(dailyUvMax)?formatUvi(dailyUvMax)'
])assert.ok(!app.includes(stale),'Sichtbares altes UV-Kurzlabel verblieben: '+stale);
assert.ok(app.includes('/>UVI {eventCenterMetricNumber(summary.uvMax)}</span>'),'Eventdarstellung verwendet nicht UVI.');
assert.ok(app.includes(' · UVI {Number.isFinite(dailyUvMax)?formatUvi(dailyUvMax)'),'Bergwetter verwendet nicht UVI.');

console.log(`MID v${pkg.version}: DWD-konforme Oktas-Semantik und sichtbare UVI-Kurzlabels bleiben seit v0.9.85.109 app-weit konsistent.`);
