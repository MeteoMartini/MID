import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [updater,main,sw,legacySw,app,modern,styles,eventEngine,eventCenter,eventPanel,eventPolicy,weatherFrag,weather,updateContract,eventContract]=await Promise.all([
 'src/v078.ts','src/main.tsx','public/service-worker.js','public/sw.js','src/App.tsx','src/styles-src/30-modern.css','src/styles.css','src/eventWeatherEngine.ts','src/eventCenter.ts','src/EventPlannerPanel.tsx','src/eventRecommendationPolicy.ts','src/weather-src/30-ensemble-climate-hazards.tsfrag','src/weather.ts','MID_UPDATE_STARTUP_RECOVERY_CONTRACT.md','MID_EVENT_RECOMMENDATION_CONTRACT.md'
].map(read));

// Update flow: long-enough install observation, no reload through the old controller,
// but a delayed navigation fallback is allowed after a real controllerchange.
for(const token of ['UPDATE_INSTALL_WAIT_MS=45_000','UPDATE_DISCOVERY_WAIT_MS=7_000','midRegistrationsWithBudget',"registration.addEventListener('updatefound',updateFound)",'scheduleActivationRetry(version)','POST_ACTIVATION_NAVIGATION_MS=3_000','schedulePostActivationNavigation(version)','cancelActivationRetry(version)'])assert.ok(updater.includes(token),`Update-Härtung fehlt: ${token}`);
assert.ok(updater.includes("if(navigator.serviceWorker?.controller){removeUpdateNotice();showUpdateNotice"),'Alter Controller muss einen unkontrollierten Reload verhindern.');
assert.ok(main.includes('waitForStableAppSurface(8000,1600)')&&main.includes("dataset.midCoreDataHealth=coreReady?'ready':'degraded'"),'Release-Health und Datenquellen-Health sind nicht getrennt.');
assert.equal(sw,legacySw,'Die beiden PWA-Service-Worker müssen identisch bleiben.');
assert.ok(sw.includes('cacheAssetsConcurrently(cache,shellAssets,4)'),'App-Shell wird weiterhin sequentiell vorgeladen.');
for(const phrase of ['45 Sekunden','stabile App-Oberfläche','Datenquellen-Gesundheit'])assert.ok(updateContract.includes(phrase),`Updatevertrag fehlt: ${phrase}`);

// Footer source provenance must describe the current multi-source architecture.
for(const token of ['Leitprognose & Kurzfrist:','DWD ICON-D2','ICON-D2-RUC/RUC-EPS','MOSMIX-S/L','ECMWF IFS/AIFS','Ensembles & Unsicherheit:','WeatherNext 2','Tag 15–46 & Saison:','ECMWF EC46','NOAA CFSv2/NMME','DWD GCFS2.2/EPISODES','Warnungen, Radar & Satellit:','EUMETNET OPERA','EUMETSAT MTG-FCI/LI','Klima, Reise & Wasser:','ERA5/ERA5-Land','NOAA OISST','Flugmeteorologie:','AviationWeather Center'])assert.ok(app.includes(token),`Quellenübersicht fehlt/ist veraltet: ${token}`);
assert.ok(app.includes('Nicht jede genannte Quelle wird an jedem Ort oder in jedem Zeithorizont verwendet.'),'Quellenübersicht trennt Katalog und tatsächliche Nutzung nicht.');

// Event PoP: formal ensemble signal first, transparent complete-hour fallback second,
// missing PoP alone must neither raise severity nor create a delta alert.
assert.ok(eventEngine.includes('probabilityCoverageComplete=')&&eventEngine.includes('fallbackProbability=!eventProbability&&probabilityCoverageComplete'),'Vollständigkeitsgeprüfter Stunden-PoP-Fallback fehlt.');
assert.ok(eventEngine.includes("const incomplete=summary.coverageComplete===false,probabilityUnavailable=eventPrecipProbability(summary)==null"),'Fehlende PoP wird noch als allgemeine unvollständige Wetterlage behandelt.');
assert.ok(eventEngine.includes("else if(probabilityUnavailable){tips.push")&&!eventEngine.includes('summary.coverageComplete===false||eventPrecipProbability(summary)==null'),'Fehlende PoP allein darf keine Eventstatus-Verschärfung auslösen.');
assert.ok(eventCenter.includes("probabilitySourcesComparable=Boolean(previous.summary.precipitationProbabilitySource&&previous.summary.precipitationProbabilitySource===next.summary.precipitationProbabilitySource"),'PoP-Änderungsvergleich ist nicht quellenstabil.');
assert.ok(eventCenter.includes('rainDelta=previousProbabilityFinite!=null&&nextProbabilityFinite!=null&&probabilitySourcesComparable?rounded(nextProbabilityFinite-previousProbabilityFinite):null'),'Nicht vergleichbare oder nullable PoP-Werte erzeugen weiterhin Delta-Meldungen.');
assert.ok(eventPolicy.includes("summary.precipitationProbabilitySource==='unavailable'?null"),'Event-Policy behandelt unavailable nicht sauber.');
assert.ok(eventPanel.includes('Stunden-PoP-Mittel'),'Fallback wird in der UI nicht transparent bezeichnet.');
assert.ok(weatherFrag.includes('freshProbability??previous?.precipitationProbability??null')&&weatherFrag.includes('if(previous?.precipitationProbability)return value;'),'Temporär partielle Ensemble-Nachladung verliert einen frischen Event-PoP.');
assert.ok(weather.includes('freshProbability??previous?.precipitationProbability??null'),'Generiertes weather.ts läuft beim Event-PoP vom kanonischen Fragment auseinander.');
for(const phrase of ['vollständiger stündlicher PoP-Abdeckung','fehlende PoP allein darf den Eventstatus','derselben','Cachefensters'])assert.ok(eventContract.includes(phrase),`Event-Vertrag fehlt: ${phrase}`);

// iOS 26/27 phase 1: use glass for floating navigation/control chrome only,
// retain content cards and accessibility fallbacks.
for(const token of ['iOS 26/27 alignment','backdrop-filter:blur(28px) saturate(1.24)','border-radius:24px','prefers-reduced-transparency:reduce','prefers-contrast:more'])assert.ok(modern.includes(token),`iOS-Design-Härtung fehlt: ${token}`);
assert.ok(modern.includes('.navigation-bottom-tabs .dashboard-bottom-tabs button::before{display:none!important}'),'Veralteter aktiver Tab-Indikator bleibt im neuen mobilen Design.');
assert.ok(styles.includes('iOS 26/27 alignment'),'Kanonische iOS-Styles wurden nicht in das generierte Stylesheet übernommen.');

console.log('Updatefluss, Quellenübersicht, Event-PoP-Lückenbehandlung und iOS-26/27-Designphase sind geschützt.');
