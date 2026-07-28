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
need(engine,'export const PRIVATE_SENSOR_INTEGRATION_ENABLED=false;','Private Sensorübernahme ist im Lernkern nicht deaktiviert.');
need(stationClient,'export const CONNECTED_STATION_INTEGRATION_ENABLED=false;','Vernetzte Stationsübernahme ist nicht hart deaktiviert.');
need(stationClient,'if(!CONNECTED_STATION_INTEGRATION_ENABLED)return null;','Stationsabruf ist trotz Sperre noch möglich.');
need(stationClient,'enabled:false,connectionId:','Alte aktivierte Stationskonfiguration wird nicht sicher deaktiviert eingelesen.');
need(stationSettings,'Datenübernahme vorübergehend deaktiviert','Deaktivierter Zustand fehlt in den Einstellungen.');
need(stationSettings,'MID fragt keine privaten Stationswerte ab','Hinweis zur unterbundenen Nutzung fehlt.');
if(failures.length){console.error('Persönlicher Zwilling/Stationssperre fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Persönlicher Entscheidungszwilling wird nur bei Aktivierung angezeigt; Outdoor-Wording und vollständige Stationssperre sind geprüft.');
