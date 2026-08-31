import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const app=fs.readFileSync(new URL('src/App.tsx',root),'utf8');

assert.ok(app.includes('[ensembleRefreshRevision,setEnsembleRefreshRevision]=useState(0)'), 'Ensemble-Refreshgeneration fehlt.');
assert.ok(app.includes('setW(fw);markForegroundNetworkReady();setEnsembleRefreshRevision(value=>value+1)'), 'Ein erfolgreicher Dashboard-Reload stößt den Ensemble-Reload nicht erneut an.');
assert.ok(app.includes("if(!hadWeather){setEns([]);setEnsembleScenarios([]);setModels([]);setEnsembleRuns([])}setEnsError('');setEnsLoading(false)"), 'Same-location-Reload darf den letzten erfolgreichen Ensemble-Stand nicht sofort leeren.');
assert.ok(app.includes("if(!(ensembleRequested||weatherTwinSettings.enabled)||!loc||!w){abortRequest('ensemble');return}"), 'Ensemble-Abruf muss an einen verfügbaren Kernforecast gekoppelt sein.');
assert.ok(app.includes('w?.timezone,ensembleRefreshRevision]);'), 'Ensemble-Effect reagiert nicht auf die neue Refreshgeneration.');
assert.ok(!app.match(/\.catch\(reason=>\{if\(!isAbort\(reason,ensembleController\.signal\).*setEns\(\[\]\)/s), 'Transienter Ensemble-Fehler darf vorhandene Ensemble-Tage nicht löschen.');
assert.ok(app.includes('window.setTimeout(()=>setEnsembleRefreshRevision(value=>value+1),45_000)'), 'Automatischer sichtbarer Online-Retry nach transientem Ensemble-Fehler fehlt.');
assert.ok(app.includes("Letzter erfolgreicher Stand bleibt sichtbar, sofern vorhanden."), 'Fallback-Vertrag für letzten erfolgreichen Ensemble-Stand fehlt.');

console.log('Ensemble-Resume-Hotfix: same-location reload preserves data, re-triggers loading and retries transient failures without app restart.');
