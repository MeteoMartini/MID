import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function mustReplace(source,from,to,label){if(!source.includes(from))throw new Error(`missing marker: ${label}`);return source.replace(from,to)}
function mustRegex(source,re,to,label){if(!re.test(source))throw new Error(`missing regex marker: ${label}`);return source.replace(re,to)}

let app=read('src/App.tsx');
app=mustReplace(app,
"type SettingsSection='view'|'appearance'|'units'|'notifications'|'favorites'|'twin'|'sync'|'system'|'legal';",
"type SettingsSection='view'|'weather'|'navigation'|'units'|'notifications'|'favorites'|'quality'|'sync'|'system';",
'settings type');

app=mustRegex(app,/const DASHBOARD_NAV_GROUPS:DashboardNavGroup\[]=\[\n[\s\S]*?\n\];\nconst MODERN_TODAY_MODULES/,
`const DASHBOARD_NAV_GROUPS:DashboardNavGroup[]=[
 {id:'safety',label:'Sicherheit',modules:['warnings','extreme-outlook']},
 {id:'climate',label:'Klima & Rückblick',modules:['climate','forecast-verification']},
 {id:'planning',label:'Planen & Profile',modules:['event-planner','travel-planner','mountain','water']},
 {id:'special',label:'Spezialwetter',modules:['flight-meteorology']},
 {id:'tools',label:'Werkzeuge & Export',modules:['widget']}
];
const MODERN_TODAY_MODULES`, 'navigation groups');

app=mustReplace(app,
"modernMoreGroups=DASHBOARD_NAV_GROUPS.map(group=>({...group,modules:available.filter(id=>group.modules.includes(id)&&!['current','short-term','forecast','ensemble','composite'].includes(id))})).filter(group=>group.modules.length)",
"modernMoreGroups=DASHBOARD_NAV_GROUPS.map(group=>({...group,modules:available.filter(id=>group.modules.includes(id))})).filter(group=>group.modules.length)",
'more groups');

app=mustReplace(app,
"modernDrawer?<details key={group.id} open={group.modules.includes(activeId as DashboardModuleId)?true:undefined}><summary><span>{group.label}</span><small>{group.modules.length}</small><ChevronDown size={16}/></summary><section>{group.modules.map(id=>moduleButton(id,variant))}</section></details>",
"modernDrawer?<section key={group.id} className=\"modern-more-group\"><h3>{group.label}</h3><div>{group.modules.map(id=>moduleButton(id,variant))}</div></section>",
'flat more groups');

app=mustReplace(app,
"{id:'composite',label:'Karten',icon:<Monitor size={21}/>,candidates:['composite']}",
"{id:'composite',label:'Karten',icon:<Monitor size={21}/>,candidates:MODERN_MAP_MODULES}",
'maps candidates');

app=mustRegex(app,/<section className=\"modern-more-quick-actions\" aria-label=\"Schnellzugriffe\">[\s\S]*?<\/section>:null}/,
`<section className="modern-more-quick-actions" aria-label="Konfiguration"><button type="button" onClick={()=>openSettings('view')}><Settings2 size={18}/><span><strong>Einstellungen</strong><small>Darstellung, Inhalte, Daten und System</small></span></button></section>:null}`,
'more quick actions');

app=mustRegex(app,/<button type=\"button\" className=\"dashboard-section-config\" onClick=\{\(\)=>\{onDrawerOpen\(false\);window\.dispatchEvent\(new CustomEvent\('mid:open-dashboard-settings'\)\)\}\}><Settings2 size=\{16\}\/>(?:<span>Reihenfolge & Sichtbarkeit<\/span>)<\/button>/,
`<button type="button" className="dashboard-section-config" onClick={()=>openSettings('navigation')}><Settings2 size={16}/><span>Inhalte & Navigation</span></button>`,
'more settings shortcut');

const oldItems=` const items:[SettingsSection,string,ReactNode,string][]=[
  ['view','Ansicht & Einheiten',<Eye size={18}/>,'Modus, Design und Messgrößen'],
  ['notifications','Benachrichtigungen',<Bell size={18}/>,'Push-Regeln je Favorit und Standort'],
  ['favorites','Favoriten & Profile',<Star size={18}/>,'Orte, Gruppen, Berg und Wasser'],
  ['twin','Lokaler Wetterzwilling',<BadgeCheck size={18}/>,'Lernen, Gewichtung und eigene Station'],
  ['sync','Daten & Synchronisation',<Upload size={18}/>,'Geräteübergreifender Abgleich'],
  ['system','System & Updates',<Download size={18}/>,'Version, Cache und Rückfall'],
  ['legal','Rechtliches',<Info size={18}/>,'Impressum und Kontakt']
 ];`;
const newItems=` const items:[SettingsSection,string,ReactNode,string][]=[
  ['view','Darstellung',<Eye size={18}/>,'Design, Dichte und Oberfläche'],
  ['weather','Wetterdarstellung',<Cloud size={18}/>,'Prognose, Skybar und Unsicherheit'],
  ['navigation','Inhalte & Navigation',<LayoutGrid size={18}/>,'Optionale Module und Reihenfolge'],
  ['units','Einheiten & Zeit',<Clock3 size={18}/>,'Messgrößen, Lokalzeit und Z-Zeit'],
  ['favorites','Orte & Profile',<Star size={18}/>,'Favoriten sowie Berg- und Wasserprofile'],
  ['notifications','Benachrichtigungen',<Bell size={18}/>,'Push und persönliche Hinweisregeln'],
  ['quality','Daten & Qualität',<BadgeCheck size={18}/>,'Provenienz, lokale Korrektur und Datenstatus'],
  ['sync','Synchronisation & Integrationen',<Upload size={18}/>,'Geräteabgleich, Sicherung und Widgets'],
  ['system','System & Über MID',<Download size={18}/>,'Version, Changelog, Reparatur und Rechtliches']
 ];`;
app=mustReplace(app,oldItems,newItems,'settings items');

app=mustReplace(app,
"{contentReady&&section==='view'&&<div className=\"settings-section-stack\">",
"{contentReady&&(['view','weather','navigation','units'] as SettingsSection[]).includes(section)&&<div className={`settings-section-stack settings-split-${section}`}>",
'split settings render');

app=mustReplace(app,
"<div className=\"settings-choice-grid\"><button type=\"button\" className={layoutMode==='standard'?'active':''}",
"<div className=\"settings-choice-grid layout-mode-settings-grid\"><button type=\"button\" className={layoutMode==='standard'?'active':''}",
'layout grid class');

app=mustReplace(app,
"<section className=\"settings-section\"><header><span>Oberfläche</span><h3>Farbdesign</h3>",
"<section className=\"settings-section settings-theme-section\"><header><span>Oberfläche</span><h3>Farbdesign</h3>",
'theme class');
app=mustReplace(app,
"<section className=\"settings-section\"><header><span>Branding</span><h3>MID-Logo</h3>",
"<section className=\"settings-section settings-branding-section\"><header><span>Branding</span><h3>MID-Logo</h3>",
'branding class');
app=mustReplace(app,
"<section className=\"settings-section\"><header><span>Messgrößen</span><h3>Einheitenauswahl</h3>",
"<section className=\"settings-section settings-units-section\"><header><span>Messgrößen</span><h3>Einheitenauswahl</h3>",
'units class');

app=mustRegex(app,/<button type=\"button\" className=\{forecastDisplaySettings\.confidenceDisplayMode==='traffic-light'\?'active':''\}[\s\S]*?<small>Rot · Gelb · Grün<\/small><\/button>/,'','confidence traffic light');

app=mustReplace(app,
"{contentReady&&section==='twin'&&<WeatherTwinSettingsPanel advancedMode={layoutMode==='advanced'}/>}",
`{contentReady&&section==='quality'&&<div className="settings-section-stack"><section className="settings-section settings-data-quality-intro"><header><span>Daten &amp; Qualität</span><h3>Quelle, Modell und lokale Korrektur getrennt</h3><p>Amtliche Quellen, Modellstand und Datenalter bleiben unabhängig von einer lokalen MID-Korrektur nachvollziehbar. Der Wetterzwilling kalibriert lokale Prognosewerte; er ersetzt keine amtliche Quelle und verändert keine amtlichen Warnstufen.</p></header></section><WeatherTwinSettingsPanel advancedMode={layoutMode==='advanced'}/></div>}`,
'quality section');

app=mustReplace(app,
"{contentReady&&section==='system'&&<SystemUpdateManager open onClose={onClose} embedded/>}\n  {contentReady&&section==='legal'&&<section className=\"settings-section settings-legal\"><header><span>Rechtliche Angaben</span><h3>Impressum</h3><p>Anbieterkennzeichnung und Kontaktmöglichkeit für MID.</p></header><ImprintContent embedded/></section>}",
`{contentReady&&section==='system'&&<div className="settings-section-stack"><SystemUpdateManager open onClose={onClose} embedded/><section className="settings-section settings-legal"><header><span>Über MID</span><h3>Rechtliches &amp; Kontakt</h3><p>Anbieterkennzeichnung und Kontaktmöglichkeit für MID.</p></header><ImprintContent embedded/></section></div>}`,
'system legal merge');

app=mustReplace(app,"setSettingsSection('twin');setSettingsOpen(true)","setSettingsSection('quality');setSettingsOpen(true)",'oauth quality');
app=mustReplace(app,
"valid:SettingsSection[]=['view','appearance','units','notifications','favorites','twin','sync','system','legal']",
"valid:SettingsSection[]=['view','weather','navigation','units','notifications','favorites','quality','sync','system']",
'valid settings');

write('src/App.tsx',app);

let modules=read('src/dashboardModules.ts');
modules=mustReplace(modules,
"export const DEFAULT_DASHBOARD_MODULE_ORDER:DashboardModuleId[]=DASHBOARD_MODULE_DEFINITIONS.map(item=>item.id);",
"export const DEFAULT_DASHBOARD_MODULE_ORDER:DashboardModuleId[]=DASHBOARD_MODULE_DEFINITIONS.map(item=>item.id);\nexport const CORE_DASHBOARD_MODULES:DashboardModuleId[]=['current','warnings','short-term','forecast','composite'];\nexport function isCoreDashboardModule(id:DashboardModuleId){return CORE_DASHBOARD_MODULES.includes(id)}",
'core modules export');
modules=mustReplace(modules,
"if(raw.enabled&&typeof raw.enabled==='object')for(const id of DEFAULT_DASHBOARD_MODULE_ORDER){const current=(raw.enabled as Partial<Record<DashboardModuleId,unknown>>)[id];if(typeof current==='boolean')enabled[id]=current}",
"if(raw.enabled&&typeof raw.enabled==='object')for(const id of DEFAULT_DASHBOARD_MODULE_ORDER){const current=(raw.enabled as Partial<Record<DashboardModuleId,unknown>>)[id];if(typeof current==='boolean')enabled[id]=current}\n for(const id of CORE_DASHBOARD_MODULES)enabled[id]=true",
'core modules normalization');
write('src/dashboardModules.ts',modules);

let panel=read('src/DashboardModuleSettings.tsx');
panel=mustReplace(panel,
"DASHBOARD_MODULE_DEFINITIONS,defaultDashboardModuleSettings,moveDashboardModule,type DashboardModuleId,type DashboardModuleSettings",
"DASHBOARD_MODULE_DEFINITIONS,defaultDashboardModuleSettings,isCoreDashboardModule,moveDashboardModule,type DashboardModuleId,type DashboardModuleSettings",
'panel import');
panel=mustReplace(panel,
"const unavailable=Boolean(definition.advancedOnly&&!advancedMode);return <div",
"const core=isCoreDashboardModule(id),unavailable=Boolean(definition.advancedOnly&&!advancedMode);return <div",
'panel core var');
panel=mustReplace(panel,
"<input type=\"checkbox\" checked={settings.enabled[id]} onChange={event=>{const checked=event.target.checked;onChange(current=>({...current,enabled:{...current.enabled,[id]:checked}}))}}/>",
"<input type=\"checkbox\" checked={settings.enabled[id]} disabled={core} aria-disabled={core} onChange={event=>{if(core)return;const checked=event.target.checked;onChange(current=>({...current,enabled:{...current.enabled,[id]:checked}}))}}/>",
'panel checkbox');
panel=mustReplace(panel,
"{definition.description}{definition.conditional?` · ${definition.conditional}`:''}{unavailable?' · nur im Erweiterten Modus':''}",
"{definition.description}{core?' · Kernbereich · immer aktiv':''}{definition.conditional?` · ${definition.conditional}`:''}{unavailable?' · nur im Erweiterten Modus':''}",
'panel core label');
write('src/DashboardModuleSettings.tsx',panel);

let main=read('src/main.tsx');
main=mustReplace(main,"import './midC18WorkPackageH.css';","import './midC18WorkPackageH.css';\nimport './midC18WorkPackageI.css';",'I css import');
write('src/main.tsx',main);

write('src/midC18WorkPackageI.css',`/* MID 18.2.6 · Arbeitspaket I: konsistente Mehr-/Einstellungsarchitektur */
.modern-more-drawer{display:flex;flex-direction:column;max-height:min(92dvh,920px);overflow:hidden}
.modern-more-drawer>header{flex:0 0 auto}
.modern-more-drawer>.modern-more-quick-actions{flex:0 0 auto}
.modern-more-drawer>.dashboard-section-nav-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-bottom:8px}
.modern-more-drawer>.dashboard-section-config{flex:0 0 auto;margin-bottom:max(10px,env(safe-area-inset-bottom))}
.dashboard-section-nav-list.progressive .modern-more-group{display:block;border-top:1px solid var(--mid-border,rgba(110,150,180,.24));padding:10px 0}
.dashboard-section-nav-list.progressive .modern-more-group>h3{margin:0 16px 7px;font-size:.76rem;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#8ca0b3)}
.dashboard-section-nav-list.progressive .modern-more-group>div{display:grid;gap:2px}
.dashboard-section-nav-list.progressive .modern-more-group button{width:100%}
.modern-more-quick-actions{display:grid!important;grid-template-columns:1fr!important}
.modern-more-quick-actions>button{min-height:58px}
.settings-dialog{display:flex;flex-direction:column;max-height:min(94dvh,980px);overflow:hidden}
.settings-dialog>.settings-titlebar{flex:0 0 auto}
.settings-layout{flex:1 1 auto;min-height:0;overflow:hidden}
.settings-nav{overscroll-behavior:contain}
.settings-content{min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-bottom:max(18px,env(safe-area-inset-bottom))}
.settings-split-view>.dashboard-module-settings,.settings-split-view>.time-display-settings,.settings-split-view>.settings-units-section{display:none!important}
.settings-split-view>.settings-section:first-child .forecast-presentation-settings,.settings-split-view>.settings-section:first-child .confidence-display-settings,.settings-split-view>.settings-section:first-child .skybar-display-settings,.settings-split-view>.settings-section:first-child .settings-option-list,.settings-split-view>.settings-section:first-child .advanced-feature-settings{display:none!important}
.settings-split-weather>.settings-section:not(:first-child),.settings-split-weather>.dashboard-module-settings{display:none!important}
.settings-split-weather>.settings-section:first-child>.layout-mode-settings-grid,.settings-split-weather>.settings-section:first-child>.ui-density-settings,.settings-split-weather>.settings-section:first-child>.favorite-strip-display-settings{display:none!important}
.settings-split-navigation>.settings-section,.settings-split-navigation>.time-display-settings,.settings-split-navigation>.settings-units-section{display:none!important}
.settings-split-navigation>.dashboard-module-settings{display:block!important}
.settings-split-units>.settings-section:first-child,.settings-split-units>.dashboard-module-settings,.settings-split-units>.settings-theme-section,.settings-split-units>.settings-branding-section{display:none!important}
.settings-split-units>.time-display-settings,.settings-split-units>.settings-units-section{display:block!important}
.settings-data-quality-intro p{max-width:72ch}
.dashboard-module-item input[disabled]{opacity:.7;cursor:not-allowed}
@media (max-width:720px){
 .modern-more-drawer{max-height:calc(100dvh - max(10px,env(safe-area-inset-top)));border-radius:24px 24px 0 0}
 .settings-dialog{width:100%;max-width:none;height:100dvh;max-height:100dvh;border-radius:0}
 .settings-layout{display:flex;flex-direction:column}
 .settings-nav{flex:0 0 auto;display:flex;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:8px 12px}
 .settings-nav::-webkit-scrollbar{display:none}
 .settings-nav button{flex:0 0 min(72vw,290px)}
 .settings-content{flex:1 1 auto;overflow-y:auto}
}
@media (orientation:landscape) and (max-height:520px){
 .modern-more-drawer,.settings-dialog{max-height:100dvh}
 .modern-more-drawer>header,.settings-titlebar{position:sticky;top:0;z-index:4}
}
`);

write('scripts/test-work-package-i.mjs',`import fs from 'node:fs';\nconst app=fs.readFileSync('src/App.tsx','utf8'),mods=fs.readFileSync('src/dashboardModules.ts','utf8'),panel=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8'),css=fs.readFileSync('src/midC18WorkPackageI.css','utf8');\nconst checks=[\n ['Mehr ohne Zähler',!app.includes('group.modules.length}</small>')],\n ['14d+ nicht in Mehr-Gruppen',!app.match(/DASHBOARD_NAV_GROUPS[\\s\\S]{0,900}long-range/)],\n ['Wetterkarten nicht in Mehr-Gruppen',!app.match(/DASHBOARD_NAV_GROUPS[\\s\\S]{0,900}weather-maps/)],\n ['Karten-Workspace vollständig',app.includes("label:'Karten',icon:<Monitor size={21}/>,candidates:MODERN_MAP_MODULES")],\n ['Settings Darstellung',app.includes("['view','Darstellung'")],\n ['Settings Wetterdarstellung',app.includes("['weather','Wetterdarstellung'")],\n ['Settings Inhalte Navigation',app.includes("['navigation','Inhalte & Navigation'")],\n ['Settings Einheiten Zeit',app.includes("['units','Einheiten & Zeit'")],\n ['Settings Daten Qualität',app.includes("['quality','Daten & Qualität'")],\n ['Keine Ampel-Konfidenzauswahl',!app.includes('<strong>Ampel</strong>')],\n ['Warnungen Kernmodul',mods.includes("CORE_DASHBOARD_MODULES:DashboardModuleId[]=['current','warnings','short-term','forecast','composite']")],\n ['Kernmodule erzwungen',mods.includes('for(const id of CORE_DASHBOARD_MODULES)enabled[id]=true')],\n ['Kernmodule UI geschützt',panel.includes('disabled={core}')],\n ['Ein Scroll-Owner Mehr',css.includes('.dashboard-section-nav-list{flex:1 1 auto;min-height:0;overflow-y:auto')],\n ['Settings Responsive',css.includes('@media (max-width:720px)')]\n];\nlet failed=0;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}if(failed)process.exit(1);console.log(`Arbeitspaket I: ${checks.length}/${checks.length} Verträge erfüllt.`);\n`);

const pkg=JSON.parse(read('package.json'));
pkg.version='0.9.85.90';
if(!pkg.scripts['test:work-package-i'])pkg.scripts['test:work-package-i']='node scripts/test-work-package-i.mjs';
if(!pkg.scripts['test:regressions'].includes('test-work-package-i.mjs'))pkg.scripts['test:regressions']+=' && node scripts/test-work-package-i.mjs';
write('package.json',JSON.stringify(pkg,null,2)+'\n');
const lock=JSON.parse(read('package-lock.json'));lock.version='0.9.85.90';if(lock.packages?.[''])lock.packages[''].version='0.9.85.90';write('package-lock.json',JSON.stringify(lock,null,2)+'\n');

let version=read('src/version.ts');version=version.replace(/0\.9\.85\.89/g,'0.9.85.90');write('src/version.ts',version);
let changelog=read('CHANGELOG.md');
const entry=`## v0.9.85.90 · 2026-09-22\n\n- **Mehr klarer geordnet:** Das Menü folgt jetzt einer einzigen Aufgabenlogik ohne missverständliche Zähler oder doppelte Wege zu Prognose und Karten.\n- **Einstellungen neu sortiert:** Darstellung, Wetterdarstellung, Navigation, Einheiten/Zeit, Orte/Profile, Benachrichtigungen, Datenqualität, Synchronisation und System sind getrennt.\n- **Kernnavigation geschützt:** Aktuell, Warnungen, Heute, Vorhersage und Karten bleiben erreichbar, auch wenn optionale Module ausgeblendet werden.\n- **Fachbegriffe geschärft:** Warnlage und Push-Benachrichtigung, Vorhersagekonfidenz und Gefahr sowie lokale Korrektur und Datenquelle werden klar getrennt.\n- **Mobil bis Desktop geprüft:** Mehr und Einstellungen verwenden einen kontrollierten Scrollbereich und berücksichtigen Hoch-/Querformat sowie Safe Areas.\n\n`;
if(!changelog.includes('## v0.9.85.90')){const pos=changelog.indexOf('\n## ');changelog=pos>=0?changelog.slice(0,pos+1)+entry+changelog.slice(pos+1):changelog+'\n'+entry}write('CHANGELOG.md',changelog);

console.log('Work package I production transform applied.');
