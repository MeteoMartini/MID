import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,ensemble,styles,v078,worker,serviceWorker,astronomy,mountain,push,pushPanel,modelChanges,analytics,routePanel]=await Promise.all([
 read('src/App.tsx'),read('src/EnsemblePanel.tsx'),read('src/styles.css'),read('src/v078.css'),read('worker/metar-proxy.js'),read('public/service-worker.js'),read('src/astronomy.ts'),read('src/mountainSports.ts'),read('src/pushNotifications.ts'),read('src/PushSettingsPanel.tsx'),read('src/modelRunChanges.ts'),read('src/webAnalytics.ts'),read('src/RouteWeatherPanel.tsx')
]);
const failures=[];
const requireTokens=(name,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${name}: ${token}`)};
requireTokens('Info-Portale',app,["function PortalPopover","document.addEventListener('pointerdown',dismiss,true)","document.addEventListener('keydown',escape)","createPortal(<span ref={layerRef}","className=\"model-run-button\"","ⓘ Modellstände"]);
requireTokens('Ensemble-Portale',ensemble,["function useEnsemblePortal(open:boolean","createPortal(<div ref={layer}","ensemble-help-toolbar","className=\"model-run-popover ensemble-portal-popover\"","Initialisierung {formatModelRunTime","verfügbar seit {formatAvailabilityTime"]);
requireTokens('Konsistenz-Tooltips',ensemble,["buttonRef.current?.contains(target)||tooltipRef.current?.contains(target)","document.addEventListener('pointerdown',dismiss,true)","if(event.key==='Escape')onClose()","event.preventDefault();event.stopPropagation();onToggle()"]);
requireTokens('Portal-CSS',styles+v078,['.ensemble-portal-popover{','.consistency-popover-portal{','.app-portal-popover{','position:fixed']);
requireTokens('Luftdruck/Astronomie',app,['function pressureTendency','hPa / 3 h','astronomySummary(w)','Sonne / Mond','hero-day-range']);
requireTokens('Astronomiekern',astronomy,['export function astronomySummary','moonIllumination','formatDayLengthChange']);
requireTokens('Bergprofil',mountain,['export async function mountainProfile','OVERPASS_ENDPOINTS','applyMountainProfile',"season:'auto'",'summer','winter']);
requireTokens('Bergprofil-UI',app,['Automatisch bestimmen','Talstation','Mittelstation','Bergstation','Saisonprofil','mountainSportsForecast']);
requireTokens('Push-UI',app,['Benachrichtigungen','Niederschlagsbeginn','Gewitterzelle nähert sich','tracked-location','TRACKED_PUSH_RULES_KEY']);
requireTokens('Push-Client',push,['push-subscribe','push-unsubscribe','syncPushNotifications','forecastMaterialChange:boolean']);
requireTokens('Push-Panel',pushPanel,['PushSettingsPanel','Benachrichtigungen aktivieren','Aktueller Standort']);
requireTokens('Push-Service-Worker',serviceWorker,["addEventListener('push'","addEventListener('notificationclick'",'showNotification']);
requireTokens('Push-Worker',worker,['pushConfigured','pushSubscribe','runPushSchedule','async scheduled','pushForecastState','pushForecastChangeEvents','mid-model-change-']);
requireTokens('Modelllauf-Änderungsradar',app,['MODEL_CHANGE_SETTINGS_KEY','Änderungsradar im 14-Tage-Ensemble anzeigen','Bei materieller Änderung benachrichtigen','forecastMaterialChange:true']);
requireTokens('Modelllauf-Vergleich',modelChanges,['buildModelChangeSnapshot','compareModelChangeSnapshots','updateModelChangeRadar',"metric:'onset'"]);
requireTokens('Web Analytics',analytics,['VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN','static.cloudflareinsights.com/beacon.min.js','mid:web-analytics-status']);
requireTokens('Routenwetter',app,['ROUTE_WEATHER_SETTINGS_KEY','Erweiterte Funktionen','Routenwetter im Dashboard anzeigen',"layoutMode==='advanced'&&routeWeatherSettings.enabled"]);
requireTokens('Routenwetter-UI',routePanel,['RouteWeatherPanel','Route analysieren']);
requireTokens('Worker-Livequellen',worker,['compositeDiagnostics','DWD_RADAR_WMS_BASES','dwdLayerForEndpoint',"cache:'no-store'"]);
if(failures.length){console.error('v0.7.95.26-Funktionsvertrag verletzt:\n- '+failures.join('\n- '));process.exit(1)}

const module=await import('../worker/metar-proxy.js?baseline-contract='+Date.now());
const health=await module.default.fetch(new Request('https://mid.test/?mode=health'),{}),healthData=await health.json();
if(!health.ok||!healthData.services?.includes('web-push-rules')||!healthData.services?.includes('model-run-change-alerts')||!healthData.services?.includes('composite-diagnostics'))failures.push('Worker-Health meldet die wiederhergestellten Dienste nicht.');
const config=await module.default.fetch(new Request('https://mid.test/?mode=push-config'),{}),configData=await config.json();
if(!config.ok||configData.enabled!==false||!Array.isArray(configData.requires))failures.push('Push-Konfigurationsdiagnose ist nicht fehlertolerant.');
if(failures.length){console.error('v0.7.95.26-Funktionsvertrag verletzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('v0.7.95.26-Funktionsvertrag geprüft: Popover, Modellstände, Konsistenzpunkte, Luftdruck/Astronomie, Bergprofil, Modelländerungen, Push, Analytics, Routenwetter und Worker-Livequellen bleiben geschützt.');
