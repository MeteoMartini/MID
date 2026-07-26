import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,astronomy,mountain,radar,composite,worker,sw,push,pushPanel,ensemblePanel,modelChanges,analytics,runner,coverage]=await Promise.all([
  read('src/App.tsx'),read('src/astronomy.ts'),read('src/mountainSports.ts'),read('src/RadarPanel.tsx'),read('src/CompositeData.ts'),read('worker/metar-proxy.js'),read('public/service-worker.js'),read('src/pushNotifications.ts'),read('src/PushSettingsPanel.tsx'),read('src/EnsemblePanel.tsx'),read('src/modelRunChanges.ts'),read('src/webAnalytics.ts'),read('scripts/run-regressions.mjs'),read('scripts/test-feature-change-coverage.mjs')
]);
const failures=[];
const contract={
  'Luftdrucktendenz':[app,['function pressureTendency','hPa / 3 h','stark fallend','stark steigend']],
  'Web Analytics':[analytics,['VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN','static.cloudflareinsights.com/beacon.min.js','mid:web-analytics-status']],
  'Änderungsabdeckung':[coverage,['funktionale Quellcodeänderungen','changedTests.length','meaningfulDiff']],
  'Automatischer Funktionsschutz':[runner,["/^test-.*\\.mjs$/i",'spawnSync(process.execPath','Alle ${tests.length} automatisch erkannten MID-Regressionstests bestanden.']],
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
  'Push-Panel':[pushPanel,['PushSettingsPanel','Benachrichtigungen aktivieren','Aktueller Standort']],
  'Push-Service-Worker':[sw,["addEventListener('push'","addEventListener('notificationclick'"]],
  'Push-Worker':[worker,['pushConfigured','pushSubscribe','runPushSchedule','async scheduled']],
  'Ensemble-Erklärungen':[ensemblePanel,['function EnsembleExplanation()','14-Tage-Ensemble verstehen','P10–P90','Prognosekonsistenz','Temperaturtrend und Prognoseunsicherheit erklären','Niederschlagsdiagramm erklären','createPortal(<div ref={layer}']],
  'Ensemble-Modellstände':[ensemblePanel,['ⓘ Modellstände','ensemble-help-toolbar','model-run-popover ensemble-portal-popover','Initialisierung {formatModelRunTime','verfügbar seit {formatAvailabilityTime']],
  'Modelllauf-Änderungsradar':[app,['MODEL_CHANGE_SETTINGS_KEY','Änderungsradar im 14-Tage-Ensemble anzeigen','Bei materieller Änderung benachrichtigen','forecastMaterialChange:true']],
  'Modelllauf-Vergleich':[modelChanges,['buildModelChangeSnapshot','compareModelChangeSnapshots','updateModelChangeRadar','precipitation-onset']],
  'Modelllauf-Push':[worker,['pushForecastState','pushForecastChangeEvents','favorite.rules.forecastMaterialChange','mid-model-change-']],
  'Aktuelles Tagesintervall':[app,['hero-day-range','<small>Tmin</small>','<small>Tmax</small>']]
};
for(const[label,[text,tokens]]of Object.entries(contract))for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`);
if(failures.length){console.error('Essentieller MID-Funktionsvertrag verletzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Essentieller MID-Funktionsvertrag geprüft: Luftdrucktendenz, Ensemble-Erklärungen/Modellstände/Änderungsradar, Sonne/Mond, Kompositbild, Berg-/Wintersport und Benachrichtigungen bleiben geschützt.');
