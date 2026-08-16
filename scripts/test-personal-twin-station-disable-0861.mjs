import {readFile} from 'node:fs/promises';
const [panel,engine,stationSettings,stationClient]=await Promise.all([
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8')
]);
const failures=[],need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(panel,'{settings.personalRecommendations&&<section className="weather-twin-personal">','Persönlicher Entscheidungszwilling wird bei deaktivierter Einstellung nicht vollständig ausgeblendet.');
need(panel,"outdoor:'Outdoor'",'Aktivitätsbezeichnung „Outdoor“ fehlt im Panel.');
need(engine,"outdoor:'Outdoor'",'Aktivitätsbezeichnung „Outdoor“ fehlt in der Empfehlungsausgabe.');
if(panel.includes('Draußenaktivität')||engine.includes('Draußenaktivität'))failures.push('Alte Bezeichnung „Draußenaktivität“ ist noch vorhanden.');
need(engine,'export const PRIVATE_SENSOR_INTEGRATION_ENABLED=true;','Private Sensorübernahme ist im Lernkern nicht reaktiviert.');
need(stationClient,'export const CONNECTED_STATION_INTEGRATION_ENABLED=true;','Vernetzte Stationsübernahme ist nicht reaktiviert.');
need(stationClient,'fetchConnectedStation','Aktiver Stationsabruf fehlt.');
need(stationSettings,'Mit Netatmo verbinden','Netatmo-Verbindung fehlt in den Einstellungen.');
if(failures.length){console.error('Persönlicher Zwilling/Stationssperre fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Persönlicher Entscheidungszwilling, Outdoor-Wording und bewusst reaktivierte Stationsanbindung sind geprüft.');
