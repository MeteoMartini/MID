import {readFile} from 'node:fs/promises';
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const station=await readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8');
function need(source,needle,message){if(!source.includes(needle))throw new Error(message)}
need(worker,"authorize.searchParams.set('response_type','code')",'Netatmo OAuth-Start setzt response_type=code nicht.');
need(worker,"authorize.searchParams.set('scope','read_station')",'Netatmo OAuth-Start fordert read_station nicht an.');
need(worker,"authorize.searchParams.set('redirect_uri',netatmoRedirectUri(request))",'Netatmo OAuth-Redirect URI fehlt.');
need(station,'location.assign(reply.authorizeUrl)','MID navigiert nicht zur Netatmo-Autorisierungsadresse.');
need(app,"url.searchParams.has('mid_station')",'OAuth-Rückkehr wird auf App-Ebene nicht erkannt.');
need(app,"setSettingsSection('twin');setSettingsOpen(true)",'OAuth-Rückkehr öffnet den Wetterzwilling/Stationsbereich nicht.');
console.log('Netatmo OAuth-Navigation und Rückkehr in die Einstellungen geprüft.');
