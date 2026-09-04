import {readFile} from 'node:fs/promises';
const [worker,settings,app,navigation]=await Promise.all([readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),readFile(new URL('../src/externalNavigation.ts',import.meta.url),'utf8')]);
const failures=[],need=(src,token,msg)=>{if(!src.includes(token))failures.push(msg)};
need(worker,'function netatmoCallbackPage','Sichtbare Netatmo-Callbackseite fehlt.');
need(worker,'expirationTtl:1800','OAuth-Ergebnis wird nicht zeitlich begrenzt serverseitig gespeichert.');
need(worker,'oauthResult','Stationsstatus liefert letztes OAuth-Ergebnis nicht aus.');
need(worker,"title:'Netatmo wurde mit MID verbunden'",'Erfolgsseite bestätigt die Verbindung nicht.');
need(settings,'oauthFresh','Stationsbereich blendet veraltete OAuth-Ergebnisse nicht aus.');
need(settings,"oauth.stage==='token'",'Tokenfehler werden nach Browser-Rückkehr nicht konkret erklärt.');
need(app,'captureMidExternalOAuthReturn','App übergibt den Callback nicht an den Plattformadapter.');
need(navigation,'takePendingMidNetatmoOAuthCallback','Flüchtige Callback-Übergabe fehlt.');
if(navigation.includes('sessionStorage.setItem')||navigation.includes('localStorage.setItem'))failures.push('Callback-Daten werden weiterhin im Browser-Speicher abgelegt.');
if(failures.length){console.error('Netatmo Callback-Handoff fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Netatmo Callback-Handoff geprüft: sichtbare Browser-Rücksprungseite, serverseitiges OAuth-Ergebnis und flüchtiger App-Handoff sind vorhanden.');
