import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,styles,v078,weather]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'src','v078.css'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8')
]);
const failures=[];
for(const token of [
 'function pressureTendency(hours:Hour[])',
 'const mappedHours=mapHours(w),mappedDays=mapDays(w),todayDate=localDateInZone(w.timezone),currentDay=mappedDays.find(day=>day.date===todayDate)??mappedDays[0],pressureChange=pressureTendency(mappedHours),astronomy=astronomySummary(w);',
 'advancedMode&&pressureChange&&<span className="pressure-tendency">',
 'hPa / 3 h',
 "delta<=-3?'stark fallend'",
 "delta<3?'steigend':'stark steigend'"
])if(!app.includes(token))failures.push(`Luftdrucktendenz fehlt: ${token}`);
for(const token of ['.pressure-tendency{','.pressure-tendency>b{'])if(!styles.includes(token))failures.push(`Luftdrucktendenz-CSS fehlt: ${token}`);
for(const token of [
 'export type Hour={time:string;epoch:number;timezone:string;temperature:number;apparent:number;humidity:number;dewPoint:number;pressure:number;',
 "'dew_point_2m','apparent_temperature','pressure_msl','precipitation_probability'",
 'pressure:n(w.hourly.pressure_msl?.[i],NaN)'
])if(!weather.includes(token))failures.push(`Luftdruck-Zeitreihe fehlt: ${token}`);
for(const token of [
 'function EnsembleExplanation()',
 'label="14-Tage-Ensemble erklären"',
 '14-Tage-Ensemble verstehen',
 '<b>P10–P90</b>',
 '<b>Prognosekonsistenz</b>',
 '<b>Modellstände</b>',
 'function EnsembleHelpToolbar({runs}',
 '<EnsembleHelpToolbar runs={runs}/>',
 'createPortal(<div ref={layer} id={id} className="mode-info-popover ensemble-info-popover ensemble-portal-popover"',
 'ⓘ Modellstände',
 'Initialisierung {formatModelRunTime(row.initialisationTime)} · verfügbar seit {formatAvailabilityTime(row.availabilityTime)}',
 'label="14-Tage-Ensemble-Übersicht erklären"',
 'label="Temperaturtrend und Prognoseunsicherheit erklären"',
 'label="Niederschlagsdiagramm erklären"'
])if(!panel.includes(token))failures.push(`Ensemble-Erklärung/Modellstände fehlt: ${token}`);
for(const token of [
 '.ensemble-help-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:7px',
 '.ensemble-portal-popover{position:fixed!important;right:auto!important;bottom:auto!important;z-index:6200!important',
 '.ensemble-explanation{display:grid;gap:6px}',
 '@media(max-width:620px){'
])if(!v078.includes(token))failures.push(`Ensemble-Steuerungs-CSS fehlt: ${token}`);
if(failures.length){console.error('Wiederherstellungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Luftdrucktendenz sowie Ensemble-Erklärungen und Modellstände geprüft und geschützt.');
