import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,changes,worker,styles]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','modelRunChanges.ts'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
for(const token of ["MODEL_CHANGE_SETTINGS_KEY='mid:modelChangeSettings'",'Modelllauf-Änderungsradar','Änderungsradar im 14-Tage-Ensemble anzeigen','Bei materieller Änderung benachrichtigen','forecastMaterialChange:true','changeRadarEnabled={modelChangeSettings.enabled}'])if(!app.includes(token))failures.push(`App-Einbindung fehlt: ${token}`);
for(const token of ['function ModelRunChangeRadar','advancedMode&&changeRadarEnabled&&<ModelRunChangeRadar','Materiell ab etwa ±2,5 K','updateModelChangeRadar(locationKey,snapshot)'])if(!panel.includes(token))failures.push(`Ensemble-Änderungsradar fehlt: ${token}`);
for(const token of ['export function buildModelChangeSnapshot','export function compareModelChangeSnapshots',"metric:'onset'",'export function updateModelChangeRadar'])if(!changes.includes(token))failures.push(`Vergleichslogik fehlt: ${token}`);
for(const token of ['pushForecastState','pushForecastChangeEvents','forecastMaterialChange','mid-model-change-','model-run-change-alerts'])if(!worker.includes(token))failures.push(`Worker-Unterstützung fehlt: ${token}`);
for(const token of ['.advanced-feature-settings{','.model-change-radar{','.model-change-list{'])if(!styles.includes(token))failures.push(`Darstellung fehlt: ${token}`);
if(failures.length){console.error('Prüfung des Modelllauf-Änderungsradars fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Modelllauf-Änderungsradar geprüft: Einstellungen, Vergleich, Ensemble-Darstellung und Worker-Push bleiben vollständig verdrahtet.');
