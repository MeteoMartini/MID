import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,astronomy,mountain,radar,composite,worker,sw,push,panel]=await Promise.all([
  read('src/App.tsx'),read('src/astronomy.ts'),read('src/mountainSports.ts'),read('src/RadarPanel.tsx'),read('src/CompositeData.ts'),read('worker/metar-proxy.js'),read('public/service-worker.js'),read('src/pushNotifications.ts'),read('src/PushSettingsPanel.tsx')
]);
const failures=[];
const contract={
  'Sonne/Mond':[app,['label:\'Sonne / Mond\'','astronomySummary(w)']],
  'Astronomieberechnung':[astronomy,['export function astronomySummary','moonIllumination','formatDayLengthChange']],
  'Bergprofil':[mountain,['export async function mountainProfile','OVERPASS_ENDPOINTS','applyMountainProfile','season:\'auto\'','summer','winter']],
  'Bergprofil-UI':[app,['Automatisch bestimmen','Talstation','Mittelstation','Bergstation','Saisonprofil']],
  'Kompositbild':[radar,['Niederschlag · 1 km','Echtzeitblitze','Satellit']],
  'Kompositdaten':[composite,['composite-wms','composite-times']],
  'Komposit-Fallbacks':[radar,['LOCAL_SATELLITE_DAY','localCompositeFallback','lightningDirect?DIRECT_WMS.eumetsat']],
  'WMS-Worker':[worker,['compositeWmsResponse','DWD_RADAR_LAYERS','mtg_fd:li_afa','compositeDiagnostics']],
  'Benachrichtigungs-UI':[app,['Benachrichtigungen','Niederschlagsbeginn','Gewitterzelle nähert sich','tracked-location','TRACKED_PUSH_RULES_KEY']],
  'Push-Client':[push,['push-subscribe','push-unsubscribe','syncPushNotifications']],
  'Push-Panel':[panel,['PushSettingsPanel','Benachrichtigungen aktivieren','Aktueller Standort']],
  'Push-Service-Worker':[sw,["addEventListener('push'","addEventListener('notificationclick'"]],
  'Push-Worker':[worker,['pushConfigured','pushSubscribe','runPushSchedule','async scheduled']]
};
for(const[label,[text,tokens]]of Object.entries(contract))for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`);
if(failures.length){console.error('Essentieller MID-Funktionsvertrag verletzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Essentieller MID-Funktionsvertrag geprüft: Sonne/Mond, Kompositbild, Berg-/Wintersport und Benachrichtigungen bleiben geschützt.');
