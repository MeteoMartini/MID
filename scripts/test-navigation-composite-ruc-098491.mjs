import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [app,radar,settings,phase,types,core,models,router,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),readFile('src/RadarPanel.tsx','utf8'),readFile('src/compositeSettings.ts','utf8'),readFile('src/RadarModelPrecipTypeOverlay.tsx','utf8'),readFile('src/WeatherMapsData.ts','utf8'),readFile('worker-src/00-core-observations.js','utf8'),readFile('worker-src/20-composite-models.js','utf8'),readFile('worker-src/40-aviation-router.js','utf8'),readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),readFile('MID_BASELINE.json','utf8')
]);
for(const token of ["label:'Komposit'","candidates:['composite']","!['current','short-term','forecast','ensemble','composite'].includes(id)","openSettings('notifications')","openSettings('favorites')","openSettings('system')"])assert.ok(app.includes(token),`Navigation fehlt: ${token}`);
assert.ok(app.includes("{id:'current',label:'Aktuell'"),'Aktuelles Wetter muss direkt als Bottom-Bar-Tab erreichbar sein');
assert.ok(!app.includes('ModernTodayOverview'),'Verworfene Beta-Heute-Übersicht darf nicht zurückkehren');
assert.ok(settings.includes("detail:'Standard'")&&settings.includes("detail:'OSM'"),'Kompakte Basemap-Details fehlen');
assert.ok(!settings.includes('schlüsselfrei'),'Unnötiger sichtbarer Hinweis „schlüsselfrei“ darf nicht in den Komposit-Basemapdetails stehen');
assert.ok(radar.includes('flushCompositeSettings')&&radar.includes('pagehide')&&radar.includes('visibilitychange'),'Kompositzustand muss sofort sowie beim Verlassen zuverlässig gespeichert werden');
assert.ok(!radar.includes('const timer=window.setTimeout(()=>{try{writeCompositeSettings'),'Kompositauswahl darf beim schnellen Verlassen nicht durch einen Debounce verloren gehen');
assert.ok(radar.includes("<Polyline renderer={renderer} positions={item.path as any} interactive={false} pathOptions={{pane:'mid-model-lines'"),'Isohypsen müssen als reale panegebundene Vektorpfade mit demselben Pane-Renderer gerendert werden');
assert.ok(radar.includes("renderer=useMemo(()=>L.svg({pane:'mid-model-lines'"),'Modelllinien müssen einen explizit an mid-model-lines gebundenen SVG-Renderer verwenden');
for(const token of ['rucRain?:number[]','rucSnowfallWaterEquivalent?:number[]','graupelWaterEquivalent?:number[]','phaseSource?:string'])assert.ok(types.includes(token),`RUC-Phasentyp fehlt: ${token}`);
for(const token of ['function dwdRucRapidPhaseTimeIndex','async function dwdRucStaticPhaseGrid','meta?.rapid?.phase15','graupel_water_equivalent'])assert.ok(core.includes(token),`RUC-Phasenadapter fehlt: ${token}`);
assert.ok(models.includes('await dwdRucStaticPhaseGrid(lats,lons,targetMs,env)'),'Radar-Phasenraster muss native RUC-Phase ergänzen');
assert.ok(models.includes("phaseSource:rucPhase?.source"),'RUC-Phasenprovenienz fehlt');
assert.ok(router.includes('precipitationPhaseGridData(lat,lon,target,env)'),'Workerroute muss RUC-Kontext weiterreichen');
for(const token of ['Graupel · ICON-D2-RUC','Mischphase · ICON-D2-RUC','Schnee · ICON-D2-RUC','Regen · ICON-D2-RUC'])assert.ok(phase.includes(token),`RUC-Phasenauswertung fehlt: ${token}`);
assert.ok(contract.includes('Aktuell · Kurzfrist · 7 Tage · 14 Tage · Komposit · Mehr'),'Navigationsvertrag ist nicht aktualisiert');
const parsed=JSON.parse(baseline);assert.ok(parsed.requiredRegressionTests.includes('scripts/test-navigation-composite-ruc-098491.mjs'),'Neue Pflichtregression fehlt');
console.log('MID: Bottom-Bar, Kompositpersistenz, panegebundene Isohypsenpfade und native ICON-D2-RUC-Niederschlagsphase geschützt.');
