import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,changes,push,pushPanel,worker,styles]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','modelRunChanges.ts'),'utf8'),
 readFile(path.join(root,'src','pushNotifications.ts'),'utf8'),
 readFile(path.join(root,'src','PushSettingsPanel.tsx'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
for(const token of [
 "const MODEL_CHANGE_SETTINGS_KEY='mid:modelChangeSettings'",
 'type ModelChangeSettings={enabled:boolean;notifyMaterial:boolean}',
 'Modelllauf-Änderungsradar',
 'Änderungsradar im 14-Tage-Ensemble anzeigen',
 'Bei materieller Änderung benachrichtigen',
 "layoutMode==='advanced'&&modelChangeSettings.enabled&&modelChangeSettings.notifyMaterial",
 'forecastMaterialChange:true',
 'changeRadarEnabled={modelChangeSettings.enabled}'
]) if(!app.includes(token))failures.push(`App-Einbindung fehlt: ${token}`);
for(const token of [
 "import {buildModelChangeSnapshot,updateModelChangeRadar,type ModelChangeReport} from './modelRunChanges';",
 'function ModelRunChangeRadar',
 'advancedMode&&changeRadarEnabled&&<ModelRunChangeRadar',
 'Materiell ab etwa ±2,5 K',
 'setChangeReport(updateModelChangeRadar(locationKey,snapshot))'
]) if(!panel.includes(token))failures.push(`Ensemble-Änderungsradar fehlt: ${token}`);
for(const token of [
 'export function buildModelChangeSnapshot',
 'export function compareModelChangeSnapshots',
 "compareMetric(items,row.date,'tmax'",
 "compareMetric(items,row.date,'probability'",
 "metric:'onset'",
 'export function updateModelChangeRadar'
]) if(!changes.includes(token))failures.push(`Vergleichslogik fehlt: ${token}`);
for(const token of ['forecastMaterialChange:boolean','item.rules.forecastMaterialChange'])if(!push.includes(token))failures.push(`Push-Client fehlt: ${token}`);
if(!pushPanel.includes('forecastMaterialChange:false'))failures.push('Bestehende Push-Regeln setzen forecastMaterialChange nicht explizit auf false.');
for(const token of [
 'forecastMaterialChange:Boolean(item?.rules?.forecastMaterialChange)',
 'async function pushForecastState',
 'function pushForecastChangeEvents',
 'favorite.rules.forecastMaterialChange',
 'mid-model-change-',
 'model-run-change-alerts'
]) if(!worker.includes(token))failures.push(`Worker-Unterstützung fehlt: ${token}`);
for(const token of ['.advanced-feature-settings{','.model-change-radar{','.model-change-list{'])if(!styles.includes(token))failures.push(`Darstellung fehlt: ${token}`);
if(failures.length){console.error('Prüfung des Modelllauf-Änderungsradars fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Modelllauf-Änderungsradar geprüft: nur im Erweiterten Modus, lokaler Laufvergleich, materielle Schwellen und optionale Cloudflare-Push-Regel sind vorhanden.');
