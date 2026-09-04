import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const app=fs.readFileSync(new URL('src/App.tsx',root),'utf8');

assert.ok(app.includes('[ensembleRefreshRevision,setEnsembleRefreshRevision]=useState(0)'), 'Ensemble-Refreshgeneration fehlt.');
assert.ok(app.includes('setW(fw);markForegroundNetworkReady();setEnsembleRefreshRevision(value=>value+1)'), 'Ein erfolgreicher Dashboard-Reload stößt den Ensemble-Reload nicht erneut an.');
assert.ok(/if\(!hadWeather\)\{[^}]*setEns\(\[\]\);[^}]*setEnsembleScenarios\(\[\]\);[^}]*setModels\(\[\]\);[^}]*setEnsembleRuns\(\[\]\);[^}]*\}setEnsError\(''\);setEnsLoading\(false\)/s.test(app), 'Same-location-Reload darf den letzten erfolgreichen Ensemble-Stand nicht sofort leeren.');
assert.ok(app.includes("if(!(ensembleRequested||weatherTwinSettings.enabled)||!loc||!w){abortRequest('ensemble');return}"), 'Ensemble-Abruf muss an einen verfügbaren Kernforecast gekoppelt sein.');
assert.ok(app.includes('w?.timezone,ensembleRefreshRevision]);'), 'Ensemble-Effect reagiert nicht auf die neue Refreshgeneration.');
assert.ok(!app.match(/\.catch\(reason=>\{if\(!isAbort\(reason,ensembleController\.signal\).*setEns\(\[\]\)/s), 'Transienter Ensemble-Fehler darf vorhandene Ensemble-Tage nicht löschen.');
assert.ok(app.includes("retryPending=true;if(retryTimer)return;retryTimer=window.setTimeout(()=>{retryTimer=0;requestRetry()},delayMs)"), 'Zeitgesteuerter Ensemble-Retry nach transientem Fehler fehlt.');
assert.ok(app.includes("document.addEventListener('visibilitychange',resumeRetry);window.addEventListener('online',resumeRetry)"), 'Ensemble-Retry muss beim Sichtbarwerden und bei Netzrückkehr sofort fortgesetzt werden.');
assert.ok(app.includes("document.removeEventListener('visibilitychange',resumeRetry);window.removeEventListener('online',resumeRetry)"), 'Ensemble-Retry-Listener werden beim Effect-Cleanup nicht entfernt.');
assert.ok(app.includes("Letzter erfolgreicher Stand bleibt sichtbar, sofern vorhanden."), 'Fallback-Vertrag für letzten erfolgreichen Ensemble-Stand fehlt.');

console.log('Ensemble-Resume-Hotfix: same-location reload preserves data, re-triggers loading and retries transient failures without app restart.');
