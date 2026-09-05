import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const failures=[];
const exact="formatDate(first.date,{weekday:'short',day:'2-digit',month:'2-digit'})";
if(!source.includes(exact))failures.push('Die zunehmende Unsicherheit nennt Wochentag und Datum nicht gemeinsam.');
if(source.includes("return date?`Ab ${formatDate(date,{weekday:'long'})}"))failures.push('Die alte nur aus dem Wochentag bestehende Unsicherheitsangabe ist noch aktiv.');
if(!source.includes("formatDate(item.date,{weekday:'short',day:'2-digit',month:'2-digit'})"))failures.push('Das 14-Tage-Mini-Ribbon verwendet kein eindeutiges Datum im Tooltip.');
if(!source.includes("const series=ensembleSeries(ensemble,days,climate);return uncertaintySummary(series,scenarios)"))failures.push('Die 14-Tage-Registerzusammenfassung verwendet die Unsicherheitsangabe nicht.');
if(failures.length){console.error('Cockpit-14-Tage-Datumsregression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cockpit-Register zeigt zunehmende Unsicherheit mit Wochentag und Datum.');
