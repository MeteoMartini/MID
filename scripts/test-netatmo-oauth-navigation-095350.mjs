import {readFile} from 'node:fs/promises';
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const station=await readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8');
const settings=await readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8');
function need(source,needle,message){if(!source.includes(needle))throw new Error(message)}
need(worker,"authorize.searchParams.set('response_type','code')",'Netatmo OAuth-Start setzt response_type=code nicht.');
need(worker,"authorize.searchParams.set('scope','read_station')",'Netatmo OAuth-Start fordert read_station nicht an.');
need(worker,"authorize.searchParams.set('redirect_uri',netatmoRedirectUri(request))",'Netatmo OAuth-Redirect URI fehlt.');
need(worker,"mode==='netatmo-auth-redirect'",'Direkter browserfester OAuth-Redirect-Endpunkt fehlt.');
need(station,"url.searchParams.set('mode','netatmo-auth-redirect')",'MID navigiert nicht über den direkten Worker-OAuth-Redirect.');
need(station,'location.assign(netatmoConnectionRedirectUrl(config,redirectUri))','MID startet die Netatmo-Navigation nicht im aktuellen Tab.');
need(worker,"target.searchParams.set('mid_station_detail'",'OAuth-Fehlerdetails werden beim Rücksprung nicht transportiert.');
need(settings,"mid_station_detail",'OAuth-Fehlerdetails werden in den Einstellungen nicht ausgewertet.');
need(settings,"void refresh(config,true)",'OAuth-Fehlermeldung kann nach Rückkehr von Status-Refresh überschrieben werden.');
need(app,"url.searchParams.has('mid_station')",'OAuth-Rückkehr wird auf App-Ebene nicht erkannt.');
need(app,"setSettingsSection('twin');setSettingsOpen(true)",'OAuth-Rückkehr öffnet den Wetterzwilling/Stationsbereich nicht.');
console.log('Netatmo OAuth-Direktnavigation, Fehlerdiagnose und Rückkehr in die Einstellungen geprüft.');
