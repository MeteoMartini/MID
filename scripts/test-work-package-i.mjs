import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const mods=fs.readFileSync('src/dashboardModules.ts','utf8');
const panel=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const css=fs.readFileSync('src/midC18WorkPackageI.css','utf8');
const checks=[
 ['Mehr ohne Zähler',!app.includes('group.modules.length}</small>')],
 ['14d+ nicht in Mehr-Gruppen',!app.match(/DASHBOARD_NAV_GROUPS[\s\S]{0,900}long-range/)],
 ['Wetterkarten nicht in Mehr-Gruppen',!app.match(/DASHBOARD_NAV_GROUPS[\s\S]{0,900}weather-maps/)],
 ['Karten-Workspace vollständig',app.includes("label:'Karten',icon:<Monitor size={21}/>,candidates:MODERN_MAP_MODULES")],
 ['Settings Darstellung',app.includes("['view','Darstellung'")],
 ['Settings Wetterdarstellung',app.includes("['weather','Wetterdarstellung'")],
 ['Settings Inhalte Navigation',app.includes("['navigation','Inhalte & Navigation'")],
 ['Settings Einheiten Zeit',app.includes("['units','Einheiten & Zeit'")],
 ['Settings Daten Qualität',app.includes("['quality','Daten & Qualität'")],
 ['Keine Ampel-Konfidenzauswahl',!app.includes('<strong>Ampel</strong>')],
 ['Warnungen Kernmodul',mods.includes("CORE_DASHBOARD_MODULES:DashboardModuleId[]=['current','warnings','short-term','forecast','composite']")],
 ['Kernmodule erzwungen',mods.includes('for(const id of CORE_DASHBOARD_MODULES)enabled[id]=true')],
 ['Kernmodule UI geschützt',panel.includes('disabled={core}')],
 ['Ein Scroll-Owner Mehr',css.includes('.dashboard-section-nav-list{flex:1 1 auto;min-height:0;overflow-y:auto')],
 ['Settings Responsive',css.includes('@media (max-width:720px)')]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed)process.exit(1);
console.log(`Arbeitspaket I: ${checks.length}/${checks.length} Verträge erfüllt.`);
