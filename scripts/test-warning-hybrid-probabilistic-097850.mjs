import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const weather = fs.readFileSync(new URL('../src/weather.ts', import.meta.url), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(app.includes("${alert.instruction??''}"), 'officialAlertMetric must inspect instruction text for official unit values.');
assert(app.includes("(?:kn|kt|knoten)"), 'officialAlertMetric must parse direct official knot values.');
assert(!app.includes('Automatisch aus der kanonischen MID-Ortsprognose abgeleitet.'), 'Prompt artefact helper text must be removed from MID warning cards.');
assert(!app.includes('Prognosehinweis, keine amtliche Warnung.'), 'Prompt artefact warning disclaimer must be removed from MID warning cards.');
assert(!app.includes('Bereiche und Begriffe wie „örtlich“ vermeiden trügerische Punktgenauigkeit.'), 'Prompt artefact footer text must be removed from the hybrid warning section.');
assert(weather.includes("precisionLabel='Wahrscheinlichkeitsbereich'"), 'Hazard presentation must label MID warnings as a probability range.');
assert(weather.includes('function hazardProbabilisticWindow('), 'Hazard presentation must derive probabilistic validity windows.');
assert(weather.includes('Konvektive Verstärkungen können einzelne Spitzen darüber auslösen.'), 'Wind hint wording must explain probabilistic higher-end gust peaks.');
assert(weather.includes('validFrom:presentation.validFrom??signal.validFrom'), 'MID warnings must use probabilistically widened validity ranges.');

console.log('test-warning-hybrid-probabilistic-097850: OK');
