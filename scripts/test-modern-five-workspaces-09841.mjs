import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8'),css=fs.readFileSync('src/styles-src/30-modern.css','utf8');
const checks=[
 ['six primary labels', ['Aktuell','Kurzfrist','7 Tage','14 Tage','Komposit','Mehr'].every(value=>app.includes(value))],
 ['current is direct and not duplicated in more', app.includes("!['current','short-term','forecast','ensemble','composite'].includes(id)")&&app.includes("{id:'current',label:'Aktuell'")],
 ['restorable section contract', app.includes("RESTORABLE_DASHBOARD_SECTIONS:DashboardModuleId[]=['current','warnings','extreme-outlook','ventilation'")],
 ['progressive expert navigation', app.includes('modernMoreGroups')&&app.includes("variant==='drawer'")],
 ['modern module focus rendering', app.includes("if(navigationMode==='bottom-tabs')")&&app.includes('if(!visible)return null;')],
 ['single canonical navigation mode', app.includes("type NavigationMode='bottom-tabs'")&&!app.includes('Bottom-Leiste · Beta')],
 ['observer cannot overwrite modern focus', app.includes("if(navigationMode==='bottom-tabs'||!w||typeof IntersectionObserver==='undefined')return;")],
 ['floating mobile bar', css.includes('.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs')&&css.includes('position:fixed!important')],
 ['landscape mobile support', css.includes('@media(max-width:850px) and (orientation:landscape)')],
 ['composite focus directly reachable', app.includes("candidates:['composite']")&&app.includes('className="modern-map-focus-shell"')],
 ['planner workspace', css.includes('.navigation-bottom-tabs .modern-planner-hub{display:grid')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){console.error(`Modern navigation contract failed (${failed.length}/${checks.length})`);for(const[name]of failed)console.error(`- ${name}`);process.exit(1)}
console.log(`Modern navigation contract passed (${checks.length} checks)`);
