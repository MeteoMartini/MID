import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const radar=read('src/RadarPanel.tsx'),startup=read('src/startupPreload.ts'),app=read('src/App.tsx'),fusion=read('src/forecastFusion.ts'),event=read('src/eventAviation.ts'),short=read('src/ShortTermForecast.tsx'),worker=read('worker-src/20-composite-models.js');

// Synoptik: DWD-WMS wie bei den Isobaren, plus MapLibre-unabhängiger Canvas-Fallback.
assert.ok(worker.includes("isoheights:{layer:'dwd:Icon_reg025_fd_pl_GH'")&&worker.includes('elevation:500'),'500-hPa-Isohypsen müssen als natives DWD-WMS-Produkt definiert sein.');
assert.ok(radar.includes("(['isobars','isoheights'] as const)")&&radar.includes('elevation:product.elevation'),'RadarPanel muss Isohypsen-WMS mit dem Druckniveau 500 hPa tatsächlich abrufen.');
assert.ok(radar.includes('function IsoheightCanvasFallback(')&&radar.includes('mid-isoheight-canvas-fallback')&&radar.includes("events={['render','resize'] as const}"),'Isohypsen brauchen bei WMS-Ausfall einen MapLibre-synchronen Canvas-Fallback.');
assert.ok(radar.includes('function SynopticFrontCanvasFallback(')&&radar.includes('mid-front-canvas-fallback'),'Fronten/Frontalzonen müssen unabhängig vom Legacy-Polyline-Pfad auf Canvas sichtbar sein.');

// Startup: gleiche Daten/Algorithmen, nur früher parallel gestartet; Data-Saver/2G bleibt konservativ.
for(const token of ['startupStationEnrichmentForLocation','startupRadarForLocation','constrainedStartupNetwork()','constrained?210:85','await delay(70)','constrained?650:440'])assert.ok(startup.includes(token),`Startup-Parallelisierung fehlt: ${token}`);
assert.ok(app.includes('preloadedStationEnrichmentPromise')&&app.includes('preloadedRadarPromise'),'App muss vorgezogene Hyperlokal-/Radar-Ergebnisse konsumieren.');
assert.ok(app.includes('constrainedNetwork?700:240'),'Vollständiger Radar-/Niederschlagsabgleich muss auf normalen Netzen früher starten, Data-Saver aber schonen.');
assert.ok(app.includes('constrained?650:140')&&app.includes('constrained?2200:850'),'Forecast-Fusion muss auf normalen Netzen früher geplant werden, ohne den sparsamen Netzpfad zu verschärfen.');
assert.ok(app.includes('let fallbackStarted=false')&&app.includes('runFullStationAnalysis(false)'),'Fehlschlag der Start-Vollanalyse muss sauber in die normale Hyperlokal-Analyse zurückfallen, ohne Loading vorzeitig zu beenden.');

// Ceiling: Beobachtung bleibt vorrangig; RUC wird klar als Modellfallback geführt und auch in Flugwetter genutzt.
assert.ok(fusion.includes("ceilingSourceLabel:Number.isFinite(weather.rucCeilingM)?'DWD ICON-D2-RUC · CEILING'"),'RUC-CEILING muss in den kanonischen Forecast-Hour-Vertrag gelangen.');
assert.ok(app.includes('observedCeilingHft')&&app.includes('ceilingFromModel=!Number.isFinite(observedCeilingHft)'),'Aktuelles Wetter muss beobachtetes Ceiling vor dem Modellwert priorisieren.');
assert.ok(app.includes('Modell-Ceiling ~')&&app.includes("DWD ICON-D2-RUC · CEILING"),'Modell-Ceiling muss in der aktuellen Wetterdarstellung eindeutig gekennzeichnet sein.');
assert.ok(event.includes("ceilingBasis=rucCeilingsFt.length?rucCeilingsFt:ceilings")&&event.includes("ceilingSource=rucCeilingsFt.length?'DWD ICON-D2-RUC · CEILING'"),'Event-/Flugwetter muss RUC-CEILING vor der Druckniveau-Diagnose verwenden.');
assert.ok(short.includes('modelCeilingHft=Number.isFinite(Number(base.ceiling))')&&short.includes('ceilingHft:resolvedCeilingHft'),'Kurzfristiger Niederschlagsabgleich muss das kanonische Modell-Ceiling als Plausibilitätsinformation nutzen können.');

console.log('Synoptik-WMS/Canvas, beschleunigte Hyperlokal-/Radar-Pipeline und ICON-D2-RUC-Ceiling-Vertrag geprüft.');
