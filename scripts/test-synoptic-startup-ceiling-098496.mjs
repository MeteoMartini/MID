import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const radar=read('src/RadarPanel.tsx'),startup=read('src/startupPreload.ts'),app=read('src/App.tsx'),fusion=read('src/forecastFusion.ts'),event=read('src/eventAviation.ts'),short=read('src/ShortTermForecast.tsx'),worker=read('worker-src/20-composite-models.js');

// Synoptik: DWD-WMS bleibt für Isobaren; Isohypsen laufen kontrolliert über geglättete MID-Vektoren/Canvas.
assert.ok(worker.includes("isoheights:{layer:'dwd:Icon_reg025_fd_pl_GH'")&&worker.includes('elevation:500'),'500-hPa-Isohypsen müssen als natives DWD-WMS-Produkt definiert sein.');
assert.ok(radar.includes('modelData.wms.isobars.layer')&&!radar.includes("(['isobars','isoheights'] as const)"),'RadarPanel darf nur Isobaren über DWD-WMS rendern; die stufige native Isohypsendarstellung bleibt aus der sichtbaren Karte entfernt.');
assert.ok(radar.includes('function IsoheightCanvasFallback(')&&radar.includes('function IsoheightLabels(')&&radar.includes('mid-isoheight-canvas-fallback')&&radar.includes("events={['render','resize'] as const}"),'Isohypsen brauchen einen MapLibre-synchronen geglätteten Canvas-Pfad mit gpdm-Labels.');
assert.ok(radar.includes('function RegionalFrontalZones(')&&radar.includes('candidate.score>=68')&&radar.includes('zone.score>=58'),'Fronten dürfen nur aus ausreichend starken geglätteten θe-Frontalzonen mit belastbarer Typisierung dargestellt werden.');

// Startup: gleiche Daten/Algorithmen, nur früher parallel gestartet; Data-Saver/2G bleibt konservativ.
for(const token of ['startupStationEnrichmentForLocation','startupRadarForLocation','constrainedStartupNetwork()','await delay(70)','constrained?650:440'])assert.ok(startup.includes(token),`Startup-Parallelisierung fehlt: ${token}`);
const radarStartupDelay=startup.match(/radarRequest=.*?await delay\(constrained\?(\d+):(\d+)\)/s);assert.ok(radarStartupDelay,'Radar-Startverzögerung muss explizit netzabhängig bleiben.');assert.ok(Number(radarStartupDelay[1])<=210&&Number(radarStartupDelay[2])<=85,`Radar-Preload darf gegenüber dem geschützten Parallelstand nicht später werden: ${radarStartupDelay.slice(1).join('/')}`);
assert.ok(app.includes('preloadedStationEnrichmentPromise')&&app.includes('preloadedRadarPromise'),'App muss vorgezogene Hyperlokal-/Radar-Ergebnisse konsumieren.');
const radarEnrichmentDelay=app.match(/scheduleRadarEnrichment=.*?constrainedNetwork\?(\d+):(\d+)\)\};/s);assert.ok(radarEnrichmentDelay,'Radar-Vollanalyse muss weiterhin netzabhängig gestaffelt sein.');assert.ok(Number(radarEnrichmentDelay[1])<=700&&Number(radarEnrichmentDelay[2])<=240,`Radar-Vollanalyse darf gegenüber dem geschützten Parallelstand nicht später werden: ${radarEnrichmentDelay.slice(1).join('/')}`);
assert.ok(app.includes('constrained?650:140')&&app.includes('constrained?2200:850'),'Forecast-Fusion muss auf normalen Netzen früher geplant werden, ohne den sparsamen Netzpfad zu verschärfen.');
assert.ok(app.includes('let fallbackStarted=false')&&app.includes('runFullStationAnalysis(false)'),'Fehlschlag der Start-Vollanalyse muss sauber in die normale Hyperlokal-Analyse zurückfallen, ohne Loading vorzeitig zu beenden.');

// Ceiling: Beobachtung bleibt vorrangig; RUC wird klar als Modellfallback geführt und auch in Flugwetter genutzt.
assert.ok(fusion.includes("ceilingSourceLabel:Number.isFinite(weather.rucCeilingM)?'DWD ICON-D2-RUC · CEILING'"),'RUC-CEILING muss in den kanonischen Forecast-Hour-Vertrag gelangen.');
assert.ok(app.includes('observedCeilingHft')&&app.includes('ceilingFromModel=!Number.isFinite(observedCeilingHft)'),'Aktuelles Wetter muss beobachtetes Ceiling vor dem Modellwert priorisieren.');
assert.ok(app.includes('Modell-Ceiling ~')&&app.includes("DWD ICON-D2-RUC · CEILING")&&app.includes('cloudVisibleDetail=[cloudCompactDetail,ceilingCompactDetail]')&&app.includes("label:'Bewölkung',value:`${cloudOktasValue}/8`,detail:cloudVisibleDetail"),'Modell-Ceiling muss direkt in der sichtbaren Bewölkungskarte und nicht nur hinter (i) gekennzeichnet sein.');
assert.ok(event.includes("ceilingBasis=rucCeilingsFt.length?rucCeilingsFt:ceilings")&&event.includes("ceilingSource=rucCeilingsFt.length?'DWD ICON-D2-RUC · CEILING'"),'Event-/Flugwetter muss RUC-CEILING vor der Druckniveau-Diagnose verwenden.');
assert.ok(short.includes('stateCeiling=finite(quarter?.ceiling)??base.ceiling')&&short.includes('modelCeilingHft=Number.isFinite(Number(stateCeiling))')&&short.includes('ceilingHft:resolvedCeilingHft'),'Kurzfristiger Niederschlagsabgleich muss natives 15-min-Ceiling nutzen können und sonst auf das kanonische Modell-Ceiling zurückfallen.');

console.log('Synoptik-Isobaren/WMS, geglättete Isohypsen/Fronten, beschleunigte Hyperlokal-/Radar-Pipeline und ICON-D2-RUC-Ceiling-Vertrag geprüft.');
