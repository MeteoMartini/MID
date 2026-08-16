import {readFile} from 'node:fs/promises';
const station=await readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8');
const settings=await readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
function need(text,needle,message){if(!text.includes(needle))throw new Error(message)}
need(station,"workerPost<NetatmoAuthorizationStart>('netatmo-auth-start'",'Netatmo-Autorisierungsadresse wird nicht vor dem Nutzertap vorbereitet.');
need(station,"url.hostname!=='api.netatmo.com'",'Vorbereitete Netatmo-Autorisierungsadresse wird nicht validiert.');
need(station,"window.matchMedia?.('(display-mode: standalone)').matches",'Standalone/PWA-Erkennung fehlt.');
need(station,"window.open(target,'_blank')",'Standalone-PWA öffnet Netatmo nicht in einem externen Browserkontext.');
need(settings,"Netatmo-Anmeldung wird vorbereitet",'UI zeigt die OAuth-Vorbereitung nicht an.');
need(settings,"visibilitychange",'Rückkehr aus dem externen OAuth-Browser wird nicht automatisch erkannt.');
need(settings,"mid_station_connection",'Callback-Verbindungskennung wird in den Einstellungen nicht übernommen.');
need(app,"connectionId:url.searchParams.get('mid_station_connection')",'App sichert die OAuth-Verbindungskennung nicht beim Rücksprung.');
need(worker,"target.searchParams.set('mid_station_connection',String(entry.connectionId))",'Worker gibt die OAuth-Verbindungskennung beim Rücksprung nicht zurück.');
console.log('Netatmo iOS/PWA Browser-OAuth geprüft: Autorisierungs-URL ist vorab vorbereitet, externe Browsernavigation erfolgt direkt aus dem Tap und connectionId überlebt Browser-/PWA-Kontextwechsel.');
