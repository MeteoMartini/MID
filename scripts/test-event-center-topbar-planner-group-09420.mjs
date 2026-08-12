import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const center=fs.readFileSync('src/eventCenter.ts','utf8');
const modules=fs.readFileSync('src/dashboardModules.ts','utf8');
const settings=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const styles=fs.readFileSync('src/styles.css','utf8');
const failures=[];
const need=(source,label,token)=>{if(!source.includes(token))failures.push(`${label} fehlt: ${token}`)};
for(const token of [
 'function EventCenterHeaderButton(',
 'className={`event-center-header-button${hasUpdate?',
 "label:'Planer',modules:['event-planner','travel-planner']",
 "label:'Profile',modules:['mountain','water']",
 '<EventCenterHeaderButton onOpenPlanner={onOpenEventPlanner} unit={unit}/>',
 "navigateToDashboardSection('event-planner')"
])need(app,'App',token);
if(app.includes('DashboardEventCenterTeaser'))failures.push('Großer Dashboard-Event-Center-Teaser ist noch aktiv.');
for(const token of [
 "{id:'event-planner',label:'Eventplaner'",
 "{id:'travel-planner',label:'Reiseplaner'"
])need(modules,'Dashboardmodule',token);
need(settings,'Einstellungen','checked={settings.enabled[id]}');
for(const token of [
 'function statusChangeSummary(previous:EventStatus,next:EventStatus)',
 'Bewertung ${direction}: jetzt „${statusLabel(next)}“ (zuvor „${statusLabel(previous)}“).',
 'function normalizeLegacyChangeSummary(summary:string)',
 'const normalizedSummary=rawChange?normalizeLegacyChangeSummary'
])need(center,'Event-Center-Text',token);
for(const token of [
 '.event-center-header-button.has-update{',
 '.event-center-header-popover{',
 '.event-center-header-button>i{'
])need(styles,'Styles',token);
if(failures.length){console.error('MID v0.9.42.0 Event-Center-/Planer-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.42.0: Event-Center ist kompakt in der Top-Leiste, Änderungstexte sind natürlich und Event-/Reiseplaner gemeinsam unter Planer separat schaltbar.');
