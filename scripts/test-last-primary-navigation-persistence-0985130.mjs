import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,portable,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/portableUserData.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),self='scripts/test-last-primary-navigation-persistence-0985130.mjs';
assert.equal(pkg.version,'0.9.85.130');
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(app.includes("const LAST_DASHBOARD_SECTION_KEY='mid:last-dashboard-section:v1'"),'Exakter letzter Dashboard-Bereich muss weiter gespeichert werden.');
assert.ok(app.includes("const LAST_PRIMARY_NAVIGATION_KEY='mid:last-primary-navigation:v1'"),'Primäre Bottom-Bar-Auswahl braucht einen eigenen gerätelokalen Fallback.');
for(const token of [
 "if(id==='current'||id==='warnings'||id==='extreme-outlook'||id==='ventilation')return'current'",
 "if(id==='short-term')return'today'",
 "if(id==='forecast'||id==='ensemble'||id==='long-range')return'forecast'",
 "if(id==='composite'||id==='weather-maps')return'composite'",
 "return value==='today'?'short-term':value==='forecast'?'forecast':value==='composite'?'composite':'current'"
])assert.ok(app.includes(token),'Primäre Navigationszuordnung fehlt: '+token);
assert.ok(app.includes("useState<DashboardModuleId|'place'|''>(()=>readLastDashboardSection())"),'App muss den letzten Bereich bereits beim ersten Rendern wiederherstellen.');
assert.ok(app.includes("lastDashboardSectionRef=useRef<DashboardModuleId|'place'|''>(activeNavSection)"),'Aktive Navigation braucht einen Lifecycle-Ref.');
assert.ok(app.includes("useLayoutEffect(()=>{lastDashboardSectionRef.current=activeNavSection},[activeNavSection])"),'Lifecycle-Ref muss mit der sichtbaren Auswahl synchron bleiben.');
assert.ok(app.includes("window.addEventListener('pagehide',flushNavigation)")&&app.includes("document.visibilityState==='hidden'"),'Die zuletzt sichtbare Auswahl muss vor Suspend/Schließen erneut persistiert werden.');
assert.ok(portable.includes("'mid:last-primary-navigation:v1'"),'Primäre Navigation muss gerätelokal bleiben und darf nicht auf andere Geräte synchronisiert werden.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),self+' fehlt in '+key);
console.log('MID v0.9.85.130: letzter Hauptbereich bleibt über Reload, PWA-Neustart und Suspend gerätelokal erhalten.');
