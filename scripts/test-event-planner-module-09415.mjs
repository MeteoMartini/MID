import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const modules=fs.readFileSync('src/dashboardModules.ts','utf8');
const travel=fs.readFileSync('src/TravelPlannerPanel.tsx','utf8');
const settings=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const failures=[];
for(const token of ["|'event-planner'","{id:'event-planner',label:'Eventplaner'","{id:'travel-planner',label:'Reiseplaner'"])if(!modules.includes(token))failures.push(`Dashboard-Modulkatalog fehlt: ${token}`);
for(const token of ["const LazyEventPlanner=lazy(()=>import('./EventPlannerPanel'))","case'event-planner':return <CollapsibleModule","id=\"event-planner\" title=\"Eventplaner\"","label:'Planer',modules:['event-planner','travel-planner']"])if(!app.includes(token))failures.push(`Navigation/Rendering fehlt: ${token}`);
if(/EventPlannerPanel/.test(travel))failures.push('Wetterplaner ist weiterhin im Reiseplaner verschachtelt.');
if(!settings.includes('DASHBOARD_MODULE_DEFINITIONS'))failures.push('Dashboard-Einstellungen nutzen den zentralen Modulkatalog nicht.');
if(!app.includes("onOpenEventPlanner={recordId=>{navigateToDashboardSection('event-planner')"))failures.push('Topbar-Event-Center verlinkt nicht auf den eigenständigen Eventplaner.');
if(failures.length){console.error('Wetterplaner-Modulintegration fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Planer-Integration geprüft: Eventplaner und Reiseplaner liegen gemeinsam unter Planer und bleiben separat schaltbar.');
