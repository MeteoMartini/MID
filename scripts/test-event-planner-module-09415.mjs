import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const modules=fs.readFileSync('src/dashboardModules.ts','utf8');
const travel=fs.readFileSync('src/TravelPlannerPanel.tsx','utf8');
const settings=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const failures=[];
for(const token of ["|'event-planner'","{id:'event-planner',label:'Wetterplaner & Events'"])if(!modules.includes(token))failures.push(`Dashboard-Modulkatalog fehlt: ${token}`);
for(const token of ["const LazyEventPlanner=lazy(()=>import('./EventPlannerPanel'))","case'event-planner':return <CollapsibleModule","id=\"event-planner\" title=\"Wetterplaner & Events\"","modules:['mountain','water','event-planner','travel-planner']"])if(!app.includes(token))failures.push(`Navigation/Rendering fehlt: ${token}`);
if(/EventPlannerPanel/.test(travel))failures.push('Wetterplaner ist weiterhin im Reiseplaner verschachtelt.');
if(!settings.includes('DASHBOARD_MODULE_DEFINITIONS'))failures.push('Dashboard-Einstellungen nutzen den zentralen Modulkatalog nicht.');
if(!app.includes("navigateToDashboardSection('event-planner')"))failures.push('Startseiten-Event verlinkt nicht auf den eigenständigen Wetterplaner.');
if(failures.length){console.error('Wetterplaner-Modulintegration fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wetterplaner-Modulintegration geprüft: eigener Menüpunkt, eigener Einstellungsbaustein, separates Lazy-Modul und Event-Center-Deep-Link.');
