import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const weather=readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
assert.match(weather,/function scenarioConcreteTimingLabel\(/,'konkrete zeitliche Szenariobeschreibung fehlt');
assert.match(weather,/Niederschlagsschwerpunkt am \$\{scenarioWeekday\(peak\.date\)\} statt am \$\{scenarioWeekday\(referencePeak\.date\)\}/,'Niederschlagsschwerpunkt wird nicht konkret benannt');
assert.match(weather,/mehr':'weniger'\} Niederschlag am \$\{scenarioWeekday\(rain\.point\.date\)\}/,'konkrete tägliche Niederschlagsabweichung fehlt');
assert.doesNotMatch(weather,/abweichende zeitliche Verteilung/,'unklare alte Szenariobezeichnung ist noch enthalten');
console.log('Szenariocluster geprüft: zeitliche Abweichungen werden konkret nach Wetterparameter und Wochentag benannt.');
