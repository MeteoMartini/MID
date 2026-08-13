import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,eventPanel,fusion,astronomy,quality,weather,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/astronomy.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/sourceQuality.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// I. Events und reguläre Ortsvorhersage müssen dieselbe abschließende MID-Fusionsstufe verwenden.
assert.match(fusion,/export function finalizeForecastHours\(/,'Gemeinsame MID-Prognose-Endstufe fehlt.');
for(const token of ['applyOperationalNowcastHours','applyConvectiveNowcastHours','reconcileCurrentTemperatureObservation','reconcileForecastHoursWithDays'])assert.match(fusion,new RegExp(token),`Gemeinsame Endstufe enthält ${token} nicht.`);
assert.match(app,/finalizeForecastHours\(twinHours,baseDisplayDays/,'Reguläre Ortsvorhersage nutzt die gemeinsame Endstufe nicht.');
assert.match(app,/canonicalHours=\{displayHours\}/,'Eventplaner erhält nicht die bereits finalisierte aktive Ortsvorhersage.');
assert.match(eventPanel,/sameForecastLocation\(location,initialLocation\)&&canonicalHours\.length>0/,'Eventplaner erkennt identische aktive Orte nicht.');
assert.match(eventPanel,/canonical\?canonicalHours:applyForecastFusionHours/,'Identische Eventorte verwenden nicht exakt die reguläre Ortsvorhersage.');
assert.match(eventPanel,/finalizeForecastHours\(finalHours,fusedDays/,'Abweichende Eventorte verwenden die gemeinsame MID-Endstufe nicht.');
assert.match(eventPanel,/station\(location\.latitude,location\.longitude/,'Eventorte nutzen für kurzfristige Anker keine Stationsanalyse.');
assert.match(eventPanel,/150\*60000/,'Stationsaktualität im Eventplaner weicht vom regulären 150-Minuten-Vertrag ab.');
assert.match(eventPanel,/Aktive Ortsvorhersage · identische MID-Endstufe/,'Transparenz über identische Event-/Ortsprognose fehlt.');

// II. Sonne/Mond/Finsternisse müssen aus einer einheitlichen Ephemeridenbasis stammen.
for(const token of ['SearchRiseSet','SearchAltitude','SearchHourAngle','MoonPhase','Illumination','SearchMoonPhase','Equator','Horizon'])assert.match(astronomy,new RegExp(`\\b${token}\\b`),`Astronomie Engine: ${token} fehlt.`);
assert.match(astronomy,/sunrise:riseSetWithin\(Body\.Sun/,'Sonnenauf-/untergang wird nicht über Astronomy Engine bestimmt.');
assert.match(astronomy,/moonrise=riseSetWithin\(Body\.Moon/,'Mondauf-/untergang wird nicht über Astronomy Engine bestimmt.');
assert.match(astronomy,/SearchAltitude\(body,observer,direction,start,limitDays,altitude\)/,'Dämmerungsgrenzen verwenden nicht die präzise Altitudensuche.');
assert.match(astronomy,/Illumination\(Body\.Moon,at\)/,'Mondbeleuchtung stammt nicht aus Astronomy Engine.');
assert.match(astronomy,/SearchMoonPhase\(targetLongitude,at,40\)/,'Nächste Mondphase wird nicht ephemeridenbasiert gesucht.');
assert.doesNotMatch(astronomy,/function\s+solarMeanAnomaly|function\s+moonCoords|10\*60\*1000/,'Veraltete Näherungs-/10-Minuten-Astronomielogik ist noch aktiv.');
assert.match(astronomy,/localDayWindow\(/,'Astronomische Tagesgrenzen berücksichtigen die Standort-Zeitzone nicht.');

// III. Straßenwetter darf nicht die allgemeine hyperlokale Luftanalyse dominieren;
// echte nahe Stationen erhalten unabhängig vom Netz einen sanften Lokalitätsvorteil.
assert.match(quality,/road&&\(field==='temperature'\|\|field==='humidity'\|\|field==='dewPoint'\)\)return\{quality:\.42,distanceScaleKm:7,ageScaleMinutes:35/,'GMA-Luftwerte werden für allgemeines Wetter noch zu stark gewichtet.');
assert.match(quality,/road&&field==='pressure'\)return\{quality:\.28,distanceScaleKm:5/,'GMA-Luftdruck ist nicht ausreichend spezialisiert.');
assert.match(weather,/localityScale=field==='pressure'\?42/,'Hyperlokaler Lokalitätsfaktor fehlt.');
assert.match(weather,/locality=\.55\+\.65\*Math\.exp/,'Nahe geeignete Stationen erhalten keinen sanften Lokalitätsbonus.');
assert.match(weather,/policy\.quality\*trust\*site\*locality/,'Lokalitätsfaktor fließt nicht in die Stationsanalyse ein.');

const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);
assert.equal(packageJson.version,baselineJson.releaseVersion,'package.json und Baseline müssen versionsgleich sein.');
assert.match(packageJson.version,/^0\.9\.48\./,'Diese Regression schützt die v0.9.48.x-Konsistenzlinie.');

console.log(`MID v${packageJson.version}: Event-/Ortsprognose, Astronomy-Engine-Ephemeriden und hyperlokale Stationsgewichtung konsistent geprüft.`);
