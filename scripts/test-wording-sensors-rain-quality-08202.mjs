import {readFile} from 'node:fs/promises';
const [ensemble,panel,engine,settings]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(ensemble,"scenario.modelLabels.length===1?'Modellfamilie':'Modellfamilien'",'Singular/Plural der Modellfamilien im Szenariocluster ist nicht korrigiert.');
need(ensemble,"models.length===1?'Modellfamilie':'Modellfamilien'",'Singular/Plural der aktiven Modellfamilien ist nicht korrigiert.');
if(ensemble.includes('1 Modellfamilien'))failures.push('Falsches Wording „1 Modellfamilien“ ist noch vorhanden.');
need(engine,'export const PRIVATE_SENSOR_INTEGRATION_ENABLED=false;','Private Sensorintegration ist nicht technisch deaktiviert.');
need(engine,'if(!PRIVATE_SENSOR_INTEGRATION_ENABLED||','Manuelle private Sensordaten können trotz Deaktivierung noch gespeichert werden.');
need(engine,'if(!PRIVATE_SENSOR_INTEGRATION_ENABLED)return false;','Automatischer Sensorabruf ist nicht deaktiviert.');
if(panel.includes('Eigene Sensoren')||panel.includes('weather-twin-sensors')||panel.includes('fetchPrivateSensorObservation'))failures.push('Eigene Sensoren sind noch in der Oberfläche oder im Panel-Lauf aktiv.');
if(settings.includes('Standortprofil, Sensoren und Aktivitätsprofile'))failures.push('Systemeinstellungen verweisen noch auf die deaktivierte Sensoroberfläche.');
need(panel,'Güte der Regenwahrscheinlichkeit','Historische Wahrscheinlichkeitsgüte ist nicht eindeutig benannt.');
need(panel,'Brier-Score','Brier-Score-Erklärung in der KPI fehlt.');
need(panel,'es ist nicht die aktuelle Regenwahrscheinlichkeit','Abgrenzung zur aktuellen Regenwahrscheinlichkeit fehlt.');
if(failures.length){console.error('Wording-/Sensor-/Regenwahrscheinlichkeitsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Modellfamilien-Wording, deaktivierte eigene Sensoren und eindeutige Güte der Regenwahrscheinlichkeit sind geprüft.');
