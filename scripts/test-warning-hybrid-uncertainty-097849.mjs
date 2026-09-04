import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const weatherSource = fs.readFileSync(new URL('../src/weather.ts', import.meta.url), 'utf8');

const checks = [
  ['MID-Hinweissektion rendert weiterhin MID · PROGNOSEHINWEIS', appSource.includes("MID · PROGNOSEHINWEIS")],
  ['amtliche DWD-Warnungen behalten die Autoritätskennzeichnung', appSource.includes("DWD · AMTLICH")],
  ['Winduntertitel können direkte kn/kt-Angaben aus dem DWD-Text auswerten', appSource.includes("(?:kn|kt|knoten)")],
  ['MID-Hinweise verwenden probabilistische Validitätsfenster', weatherSource.includes('function hazardProbabilisticWindow(')],
  ['MID-Hinweise kennzeichnen den Wertebereich als Wahrscheinlichkeitsbereich', weatherSource.includes("precisionLabel='Wahrscheinlichkeitsbereich'")],
  ['Prompt-/Hilfstext-Artefakte im Hybridwarnbereich sind entfernt', !appSource.includes('Automatisch aus der kanonischen MID-Ortsprognose abgeleitet.') && !appSource.includes('vorgetäuschte Punktgenauigkeit')],
  ['Windhinweise erlauben probabilistisch höhere Spitzen als die Punktvorhersage', weatherSource.includes('Konvektive Verstärkungen können einzelne Spitzen darüber auslösen.')],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  for (const [label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}
for (const [label] of checks) console.log(`PASS: ${label}`);
