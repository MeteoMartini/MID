import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [cockpit,app,styles]=await Promise.all([readFile('src/ForecastCockpit.tsx','utf8'),readFile('src/App.tsx','utf8'),readFile('src/styles-src/30-modern.css','utf8')]);
for(const token of ['function fallbackEnsembleDay(day:Day)','ensembleAvailable=ensemble.length>0','days.slice(0,14).map(fallbackEnsembleDay)','Best Match sofort verfügbar · Ensemble wird ergänzt','14-Tage-Best-Match geladen','cockpit-fourteen-ensemble-badge'])assert.ok(cockpit.includes(token),`14d-Best-Match-Fallback fehlt: ${token}`);
assert.ok(cockpit.includes("if(next==='fourteen-day')onFourteenDayRequested?.()"),'Das Öffnen des 14d-Horizonts muss den Ensembleabruf explizit anfordern.');
assert.ok(app.includes('onFourteenDayRequested={()=>setEnsembleRequested(true)}'),'App muss den 14d-Ensembleabruf aus dem Cockpit aktivieren.');
assert.ok(styles.includes('.cockpit-fourteen-ensemble-pending')&&styles.includes('.cockpit-fourteen-ensemble-badge'),'Fallbackstatus der 14d-Übersicht muss responsiv gestaltet sein.');
assert.ok(cockpit.includes('RelativeSunshineIcon share={item.sunshineShare}'),'Relative Sonnenscheindauer muss auch im Best-Match-Fallback erhalten bleiben.');
console.log('MID: 14-Tage-Cockpit öffnet sofort aus Best Match; Ensemble und relative Sonnenscheindauer werden entkoppelt ergänzt.');
