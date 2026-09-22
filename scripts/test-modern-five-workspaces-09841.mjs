import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8'),css=fs.readFileSync('src/styles-src/30-modern.css','utf8');
const checks=[
 ['five primary labels', ['Aktuell','Heute','Vorhersage','Karten','Mehr'].every(value=>app.includes(value))],
 ['warning status is direct and keeps Aktuell as primary context', app.includes("{id:'current',label:'Aktuell',icon:<Sun size={21}/>,candidates:['current','warnings','extreme-outlook','ventilation']}")&&app.includes('place-warning-status')],
 ['restorable section contract', app.includes("RESTORABLE_DASHBOARD_SECTIONS:DashboardModuleId[]=['current','warnings','extreme-outlook','ventilation'")],
 ['progressive expert navigation', app.includes('modernMoreGroups')&&app.includes("variant==='drawer'")],
 ['modern module focus rendering', app.includes("if(navigationMode==='bottom-tabs')")&&app.includes('if(!visible)return null;')],
 ['mandatory modern navigation mode', app.includes("const navigationMode:NavigationMode='bottom-tabs'")&&!app.includes("type DesignMode='classic'|'mid-next'")&&!app.includes('Bottom-Leiste · Beta')],
 ['observer cannot overwrite modern focus', app.includes("if(navigationMode==='bottom-tabs'||!w||typeof IntersectionObserver==='undefined')return;")],
 ['floating mobile bar', css.includes('.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs')&&css.includes('position:fixed!important')],
 ['landscape mobile support', css.includes('@media(max-width:850px) and (orientation:landscape)')],
 ['grouped map focus directly reachable', app.includes("const MODERN_MAP_MODULES:DashboardModuleId[]=['composite','weather-maps']")&&app.includes('candidates:MODERN_MAP_MODULES')&&app.includes('className="modern-map-focus-shell"')],
 ['planner workspace', css.includes('.navigation-bottom-tabs .modern-planner-hub{display:grid')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error(`Modern navigation contract failed (${failed.length}/${checks.length})`);for(const[name]of failed)console.error(`- ${name}`);process.exit(1)}
console.log(`Modern I.1-I.5 navigation contract passed (${checks.length} checks)`);
