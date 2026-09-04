import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const weather = fs.readFileSync(new URL('../src/weather.ts', import.meta.url), 'utf8');
const fragment = fs.readFileSync(new URL('../src/weather-src/30-ensemble-climate-hazards.tsfrag', import.meta.url), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(weather.includes('export async function warningEnsembleNeighborhood('), 'Kurzfristwarnungen benötigen eine echte Ensemble-Umfeldanalyse.');
assert(weather.includes('const radiusKm=12'), 'Die Ensemble-Umfeldanalyse muss einen expliziten räumlichen Radius verwenden.');
assert(weather.includes("timezone:'GMT'"), 'Mehrpunkt-Warn-EPS muss alle Umfeldpunkte auf derselben GMT-Zeitachse auswerten.');
assert(weather.includes("signal.kind==='wind'?4"), 'EPS-gestützte Windfenster müssen bis zu vier Stunden vor dem deterministischen Kernsignal prüfen können.');
assert(weather.includes('pointCount:5'), 'Standort plus vier Umfeldpunkte müssen gemeinsam ausgewertet werden.');
assert(weather.includes('Math.max(...gustValues)'), 'Böen müssen je Ensemblemitglied zuerst als Umfeldmaximum bestimmt werden.');
assert(weather.includes('Math.min(...tempValues)'), 'Frost muss je Ensemblemitglied zuerst als Umfeldminimum bestimmt werden.');
assert(weather.includes("groups.has(model.independenceGroup)"), 'Korrelierte Modellvarianten dürfen in der Warnunterstützung nicht doppelt gezählt werden.');
assert(weather.includes('gustNeighborhoodP90'), 'Die Warnlogik muss räumliche EPS-Böenquantile verwenden.');
assert(weather.includes('precipitationNeighborhoodP90'), 'Die Warnlogik muss räumliche EPS-Niederschlagsquantile verwenden.');
assert(weather.includes('temperatureNeighborhoodLowP10'), 'Die Warnlogik muss räumliche EPS-Temperaturuntergrenzen verwenden.');
assert(weather.includes("return`bis zu ${rounded(kmh/1.852,5,Number.isFinite(maximumExclusiveKmh)?maximumExclusiveKmh/1.852:Number.NaN)} kt`"), 'MID-Windhinweise müssen als bis-zu-Angabe statt als Bereich formuliert werden und dürfen bei niedrigeren Stufen unter der nächsthöheren Schwelle gedeckelt werden.');
assert(!fragment.includes('function hazardWindBand('), 'Der alte Wind-von-bis-Formatter darf nicht mehr aktiv sein.');
assert(app.includes('warningEnsembleNeighborhood(loc.latitude,loc.longitude,controller.signal)'), 'Die App muss die Ensemble-Umfeldanalyse für den gewählten Ort laden.');
assert(app.includes('unit,warningEnsemble)'), 'Die Warnberechnung muss die Ensemble-Umfeldanalyse erhalten.');
assert(app.includes('setWarningEnsemble(null)'), 'Die Umfeldanalyse muss bei Ortswechsel sauber zurückgesetzt werden.');

console.log('MID v0.9.78.53: EPS- und Umfeldunterstützung für Warnungen geprüft.');
