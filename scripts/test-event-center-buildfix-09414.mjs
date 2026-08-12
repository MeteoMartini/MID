import fs from 'node:fs';
const planner=fs.readFileSync('src/EventPlannerPanel.tsx','utf8');
const travel=fs.readFileSync('src/TravelPlannerPanel.tsx','utf8');
const center=fs.readFileSync('src/eventCenter.ts','utf8');
const app=fs.readFileSync('src/App.tsx','utf8');
const failures=[];
if(/\bAlertTriangle\b/.test(planner.split('\n').slice(0,6).join('\n')))failures.push('EventPlannerPanel importiert weiterhin ungenutztes AlertTriangle.');
if(/\bprecipitations\s*=/.test(planner))failures.push('EventPlannerPanel deklariert weiterhin die ungenutzte precipitations-Variable.');
if(/import\s+EventPlannerPanel\s+from\s+['"]\.\/EventPlannerPanel['"]/.test(travel)||/<EventPlannerPanel\b/.test(travel))failures.push('EventPlannerPanel ist weiterhin versteckt in den Reiseplaner eingebettet.');
if(/\.primaryModel\b/.test(center))failures.push('eventCenter greift weiterhin auf das nicht vorhandene BestMatchModelInfo.primaryModel zu.');
if(!/modelInfo\?\.runs\?\.\[0\]\?\.label/.test(center))failures.push('Event-Center verwendet den realen BestMatchModelInfo.runs-Vertrag nicht für den Lauf-Headline.');
if(!/navigateToDashboardSection\('event-planner'\);if\(recordId\)window\.setTimeout/.test(app))failures.push('Startseiten-Event öffnet das eigenständige Wetterplaner-Modul nicht vor dem Detail-Event.');
if(failures.length){console.error('Event-Center-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Event-Center-Buildfix geprüft: TS6133/TS2304/TS2339-Ursachen entfernt und Startseiten-Deep-Link abgesichert.');
