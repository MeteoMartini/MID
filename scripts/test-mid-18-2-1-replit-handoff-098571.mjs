import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,app,cockpit,css,radar,synoptic]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18ReplitHandoffPolish.css',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/synoptic.ts',import.meta.url),'utf8')
]);

assert(main.includes("import './midC18ReplitHandoffPolish.css';"),'Replit-Handoff-CSS fehlt im Einstieg');
assert(main.indexOf("midC18ReplitHandoffPolish.css")>main.indexOf("midC18EnsembleSynopticPolish.css"),'Handoff-CSS muss nach den älteren Redesign-Layern geladen werden');
assert(css.includes('text-overflow:clip!important')&&css.includes('white-space:normal!important')&&css.includes('overflow-wrap:anywhere!important'),'Ortsname darf nicht mehr ellipsiert werden');
assert(app.includes("detail:{horizon,resetScroll:true}"),'Bottom-Bar/Forecast-Sprung muss einen expliziten Scroll-Reset anfordern');
assert(cockpit.includes('resetScroll?:boolean')&&cockpit.includes('delete horizonScrollRef.current[horizon]')&&cockpit.includes("node.scrollTo({top:0,left:0,behavior:'auto'})"),'Forecast-Cockpit muss gespeicherten Scrollstand bei expliziter Navigation zurücksetzen');
assert(css.includes('.modern-map-focus-shell .composite-card.composite-focus-mode')&&css.includes('.modern-map-focus-shell .composite-timeline-card'),'Kartenarbeitsraum muss kompakt nachpoliert sein');
assert(radar.includes('loadSynopticAnalysisPoint'),'Produktive Synoptik-Anbindung darf durch Replit-Handoff nicht ersetzt werden');
assert(synoptic.includes('SynopticOfficialAnalysis')&&synoptic.includes('loadSynopticAnalysisPoint'),'Amtliche DWD-/MID-Synoptik muss erhalten bleiben');

console.log('MID v0.9.85.71 Replit-Handoff-Vertrag erfüllt.');
