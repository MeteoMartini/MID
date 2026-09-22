import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const mods=fs.readFileSync('src/dashboardModules.ts','utf8');
const panel=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const css=fs.readFileSync('src/midC18WorkPackageI.css','utf8');
const groupsStart=app.indexOf('const DASHBOARD_NAV_GROUPS:DashboardNavGroup[]=');
const groupsEnd=groupsStart>=0?app.indexOf('];',groupsStart):-1;
const groupBlock=groupsStart>=0&&groupsEnd>groupsStart?app.slice(groupsStart,groupsEnd+2):'';
const checks=[
 ['Mehr-Gruppen gefunden',Boolean(groupBlock)],
 ['Mehr ohne Zähler',!app.includes('<small>{group.modules.length}</small>')],
 ['14d+ nicht in Mehr-Gruppen',!groupBlock.includes('long-range')&&!groupBlock.includes('ensemble')],
 ['Wetterkarten nicht in Mehr-Gruppen',!groupBlock.includes('weather-maps')&&!groupBlock.includes('composite')],
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
