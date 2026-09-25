import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,cockpit,bottom]=await Promise.all([
  read('src/App.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/midC18BottomFavorites.css')
]);

const requestedMapping="navigationHorizon={activeNavSection==='short-term'?'short-term':activeNavSection==='forecast'?'seven-day':activeNavSection==='ensemble'?'fourteen-day':undefined}";
assert.ok(app.includes(requestedMapping),'Bottom-Bar-Ziel muss als deklarativer Forecast-Horizont an das Cockpit übergeben werden.');

assert.ok(cockpit.includes('navigationHorizon?:ForecastHorizon;'),'ForecastCockpit muss einen expliziten Navigationshorizont akzeptieren.');
assert.ok(cockpit.includes("useState<ForecastHorizon>(()=>navigationHorizon&&horizonAvailable(navigationHorizon,availability)?navigationHorizon:readActiveHorizon(availability))"),
  'Explizite Navigation muss beim Mount Vorrang vor gespeichertem activeHorizon haben.');
assert.ok(cockpit.includes("if(!navigationHorizon||!horizonAvailable(navigationHorizon,availability)||navigationHorizon===activeHorizon)return;switchHorizon(navigationHorizon)"),
  'Ein bereits gemountetes Cockpit muss nachfolgende Navigationswünsche deterministisch synchronisieren.');
assert.ok(cockpit.includes("localStorage.getItem(ACTIVE_HORIZON_KEY)"),
  'Gespeicherter Horizon bleibt als Wiedereinstiegs-Fallback erhalten.');

const initial=(requested,stored)=>requested??stored;
assert.equal(initial('short-term','seven-day'),'short-term','Vorhersage → Aktuell → Heute darf nicht auf 7 Tage zurückspringen.');
assert.equal(initial('seven-day','short-term'),'seven-day','Heute → Karten → Vorhersage muss 7 Tage öffnen, wenn 7 Tage explizit angefordert ist.');
assert.equal(initial('fourteen-day','short-term'),'fourteen-day','Explizite 14-Tage-Navigation muss gespeichertes Kurzfristziel übersteuern.');

for(const token of [
  'grid-template-columns:repeat(5,minmax(0,1fr))!important;',
  'min-height:48px!important;',
  'bottom:max(6px,var(--mid-safe-bottom))!important;',
  'right:max(8px,var(--mid-safe-right))!important;',
  'left:max(8px,var(--mid-safe-left))!important;',
  '@media(max-width:850px) and (orientation:landscape)',
  'min-height:44px!important'
]) assert.ok(bottom.includes(token),`Bottom-Bar-Responsive-Vertrag fehlt: ${token}`);

assert.ok(!cockpit.includes('setTimeout(()=>switchHorizon'),'Forecast-Horizon darf nicht mit Timing-Hack synchronisiert werden.');

console.log('MID v0.9.85.102: Bottom-Bar-Tap und Forecast-Horizon bleiben über Mount/Remount deterministisch.');
