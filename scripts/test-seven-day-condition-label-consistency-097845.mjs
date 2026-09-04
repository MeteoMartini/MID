import {readFileSync} from 'node:fs';
const appSource=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const cockpitSource=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const failures=[];
if(!appSource.includes('compactConditionLabel=sevenDayCompactConditionLabel(d,daylightHoursForDate.length?daylightHoursForDate:allDayHoursForDate)'))failures.push('7-Tage-Kacheln berechnen noch kein kompaktes Kurzlabel.');
if(!appSource.includes('<ForecastConditionPills label={compactConditionLabel}/>'))failures.push('7-Tage-Kacheln verwenden die kompakte Kurzform nicht sichtbar.');
if(appSource.includes('<ForecastConditionPills label={character.label} secondary={character.secondary}/>'))failures.push('7-Tage-Kacheln zeigen weiterhin Primär-/Sekundärtexte statt kompakter Einzeilenform.');
if(!/function sevenDayCompactConditionLabel\(day:Day,hours:Hour\[\]\):string/.test(appSource))failures.push('Hilfsfunktion für kompakte 7-Tage-Kurzlabels fehlt.');
if(!cockpitSource.includes('</i>{regimeText}</span>'))failures.push('Forecast-Cockpit zeigt auf den 7-Tage-Kacheln nicht die kompakte Regime-Kurzform.');
if(cockpitSource.includes('</i>{conditionText}</span>'))failures.push('Forecast-Cockpit zeigt weiterhin die lange Wettercharakter-Beschriftung in den 7-Tage-Kacheln.');
if(failures.length){
 console.error('test-seven-day-condition-label-consistency-097845 failed');
 for(const failure of failures)console.error(` - ${failure}`);
 process.exit(1);
}
console.log('test-seven-day-condition-label-consistency-097845 passed');
