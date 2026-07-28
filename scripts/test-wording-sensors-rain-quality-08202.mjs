import {readFile} from 'node:fs/promises';
const [ensemble,panel,engine,settings,stationSettings,stationClient,worker]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(ensemble,"scenario.modelLabels.length===1?'Modellfamilie':'Modellfamilien'",'Singular/Plural der Modellfamilien im Szenariocluster ist nicht korrigiert.');
need(ensemble,"models.length===1?'Modellfamilie':'Modellfamilien'",'Singular/Plural der aktiven Modellfamilien ist nicht korrigiert.');
if(ensemble.includes('1 Modellfamilien'))failures.push('Falsches Wording „1 Modellfamilien“ ist noch vorhanden.');
need(engine,'export const PRIVATE_SENSOR_INTEGRATION_ENABLED=true;','Automatisierte private Sensorintegration ist nicht aktiviert.');
if(panel.includes('fetchPrivateSensorObservation'))failures.push('Der alte manuelle Sensorabruf ist im Rückblickpanel noch aktiv.');
need(settings,'<ConnectedStationSettings/>','Vernetzte Wetterstationen fehlen in den Wetterzwilling-Einstellungen.');
need(stationSettings,'Netatmo Weather API','Netatmo-Auswahl fehlt.');
need(stationSettings,'Standardisiertes Stations-JSON','Automatisierbarer Standard-JSON-Adapter fehlt.');
need(stationClient,'validateConnectedStation','Plausibilitätsprüfung für verbundene Stationen fehlt.');
need(stationClient,'recordCustomSensorObservation','Plausibilisierte Stationswerte werden nicht an das Lernarchiv übergeben.');
need(worker,"mode==='netatmo-auth-start'",'Netatmo-OAuth-Start im Worker fehlt.');
need(worker,"mode==='netatmo-observation'",'Netatmo-Messwertabruf im Worker fehlt.');
need(panel,'Güte der Regenwahrscheinlichkeit','Historische Wahrscheinlichkeitsgüte ist nicht eindeutig benannt.');
need(panel,'Brier-Score','Brier-Score-Erklärung in der KPI fehlt.');
need(panel,'es ist nicht die aktuelle Regenwahrscheinlichkeit','Abgrenzung zur aktuellen Regenwahrscheinlichkeit fehlt.');
if(failures.length){console.error('Wording-/Sensor-/Regenwahrscheinlichkeitsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Modellfamilien-Wording, automatisierte Netatmo-/JSON-Stationen und eindeutige Güte der Regenwahrscheinlichkeit sind geprüft.');
