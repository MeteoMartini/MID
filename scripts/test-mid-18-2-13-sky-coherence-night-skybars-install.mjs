import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [app,pwa,cockpit,astronomy,presentWeatherSource,dayTimelineSource]=await Promise.all([
  read('src/App.tsx'),
  read('src/PwaInstallButton.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/astronomy.ts'),
  read('src/observationPresentWeather.ts'),
  read('src/daySkybarTimeline.ts')
]);

function loadTsModule(source,filename){
  const output=ts.transpileModule(source,{
    fileName:filename,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}
  }).outputText;
  const module={exports:{}};
  vm.runInNewContext(output,{module,exports:module.exports},{filename});
  return module.exports;
}

// A: Der automatische Install-Hinweis darf Karten/Komposit nicht überlagern.
assert.ok(pwa.includes('suppressTransientHint=false'),'PWA-Button braucht einen nicht-persistenten Unterdrückungsvertrag.');
assert.ok(pwa.includes('!suppressTransientHint&&<aside className="pwa-install-hint"'),'Nur der transiente Install-Hinweis muss unterdrückbar sein.');
assert.ok(app.includes('suppressPwaInstallHint={MODERN_MAP_MODULES.includes(activeNavSection as DashboardModuleId)}'),'Kartenmodule müssen den transienten Install-Hinweis über den Appzustand unterdrücken.');
assert.ok(app.includes('<PwaInstallButton suppressTransientHint={suppressPwaInstallHint}/>'),'Der manuelle App-Button bleibt bestehen und erhält nur den Hinweis-Unterdrückungsstatus.');

// B: Numerische SYNOP-ww-Werte bleiben vollständig in ihrer eigenen Codetabelle.
const presentWeather=loadTsModule(presentWeatherSource,'observationPresentWeather.ts');
for(const value of ['0','3','61','95','99']){
  const parsed=presentWeather.parseObservedPresentWeather(value,false);
  assert.equal(parsed.numericSynopWw,Number(value),`SYNOP ww=${value} muss als numerischer SYNOP-Code erkannt werden.`);
  assert.equal(parsed.textualPhenomenon,undefined,`SYNOP ww=${value} darf kein METAR/SYNOP-Textphänomen und kein Forecast-Code werden.`);
}
assert.deepEqual(
  JSON.parse(JSON.stringify(presentWeather.parseObservedPresentWeather('RA',false))),
  {raw:'RA',textualPhenomenon:'RA'},
  'Textuelle Beobachtungsphänomene müssen als solche erhalten bleiben.'
);
assert.equal(presentWeather.parseObservedPresentWeather('3',true).numericSynopWw,undefined,'Ein bereits erkannter Sichtweitenreport darf nicht zusätzlich als SYNOP-ww weitergereicht werden.');
assert.ok(app.includes("parseObservedPresentWeather(currentObservedRaw,Boolean(currentVisibilityReport))"),'Aktuelles Wetter muss den getrennten Stations-Present-Weather-Parser verwenden.');
assert.ok(!app.includes('currentObservedWeatherCode='),'Numerische Stationsmeldungen dürfen keinen direkten Forecast-weather_code-Pfad mehr besitzen.');
assert.ok(!app.includes('label(currentObservedWeatherCode)'),'Stations-ww darf niemals über die Forecast-label()-Codetabelle beschriftet werden.');
assert.ok(app.includes("currentCloudObserved=fieldFresh('cloudCover')&&Number.isFinite(st?.cloudCover)"),'Aktuelle beobachtete Gesamtbewölkung braucht einen eigenen Freshness-Entscheid.');
assert.ok(app.includes('currentSkyCloud=currentCloudObserved?cloud:Number(c.cloud_cover)'),'Text und Piktogramm müssen dieselbe Gesamtbewölkungsquelle verwenden.');
assert.ok(app.includes('currentSkyLowCloud=currentCloudObserved?undefined:Number(c.cloud_cover_low)'),'Bei beobachteter Gesamtbewölkung dürfen modellierte Low-Cloud-Schichten das Hauptpiktogramm nicht verfälschen.');
assert.ok(app.includes('cloud={currentSkyCloud} lowCloud={currentSkyLowCloud} midCloud={currentSkyMidCloud} highCloud={currentSkyHighCloud}'),'Das Hauptpiktogramm muss den kanonischen aktuellen Sky-Visual-Vertrag verwenden.');
assert.ok(app.includes('cloudObservationTrace')&&app.includes('Alter ${cloudAgeMinutes} min · aktuell verwendet'),'Die verwendete Bewölkungsquelle muss mit Zeit/Alter nachvollziehbar sein.');
assert.ok(app.includes('Modellfallback'),'Ohne aktuelle Beobachtung muss der Modellfallback transparent ausgewiesen werden.');

// C: Nachtstunden gehören hinter alle zeitlich aufgelösten Tages-Skybars und müssen DST-sicher sein.
assert.ok(astronomy.includes('export function solarTimelineWindow'),'Zentrale astronomische Nachtgeometrie fehlt.');
assert.ok(cockpit.includes('function cockpitDaySkybarNightBands'),'Wiederverwendbarer Tages-Skybar-Nachtvertrag fehlt.');
assert.ok(cockpit.includes('daySkybarTimelinePositions(dayHours,left,right,width)'),'Tages-Skybar muss die reale Zeitachsen-Geometrie verwenden.');
assert.ok(!cockpit.includes('daySkyBarSource.slice(0,24)'),'7-Tage-Skybars dürfen 25-Stunden-Tage nicht auf 24 Stunden beschneiden.');
assert.ok(!cockpit.includes("filter(hour=>hour.time.startsWith(item.date)).slice(0,24)"),'14-Tage-Skybars dürfen 25-Stunden-Tage nicht auf 24 Stunden beschneiden.');
assert.ok(cockpit.includes('solarTimelineWindow(start,end,{latitude:location.latitude,longitude:location.longitude,elevation:location.elevation,timezone}'),'Tages-Skybar muss die zentrale Solar-Geometrie und den Standort verwenden.');
assert.ok(cockpit.includes('<CockpitSkybarNightBandsSvg bands={daySkyBarNightBands} height={16}/>'),'7-Tage-Skybar muss den Nachtlayer rendern.');
assert.ok(cockpit.includes('<CockpitSkybarNightBandsSvg bands={daySkyBarNightBands} height={14}/>'),'14-Tage-Skybar muss den Nachtlayer rendern.');
assert.ok(cockpit.includes("skybarDisplayMode==='squares'?<SkyBarHourCellsSvg"),'Band/Squares müssen dieselbe Nachtgeometrie teilen.');

const timeline=loadTsModule(dayTimelineSource,'daySkybarTimeline.ts');
const springStart=Date.parse('2026-03-29T00:00:00+01:00');
const autumnStart=Date.parse('2026-10-25T00:00:00+02:00');
const springSamples=Array.from({length:23},(_,index)=>({epoch:springStart+index*3600000}));
const autumnSamples=Array.from({length:25},(_,index)=>({epoch:autumnStart+index*3600000}));
const springPositions=timeline.daySkybarTimelinePositions(springSamples);
const autumnPositions=timeline.daySkybarTimelinePositions(autumnSamples);
assert.equal(springPositions.length,23,'Frühjahrs-DST-Tag muss alle 23 realen Stunden behalten.');
assert.equal(autumnPositions.length,25,'Herbst-DST-Tag muss alle 25 realen Stunden behalten.');
assert.ok(springPositions.every((value,index)=>index===0||value>springPositions[index-1]),'23-Stunden-Zeitachse muss streng monoton bleiben.');
assert.ok(autumnPositions.every((value,index)=>index===0||value>autumnPositions[index-1]),'25-Stunden-Zeitachse muss die wiederholte lokale Stunde als getrenntes Intervall erhalten.');
assert.equal(new Set(autumnPositions.map(value=>value.toFixed(6))).size,25,'25-Stunden-Tag darf keine zwei Stunden auf dieselbe Position kollabieren.');

assert.equal((cockpit.match(/data-mid-skybar="day-card"/g)||[]).length,1,'7d day-card Skybar-Vertrag darf nicht dupliziert werden.');
assert.equal((cockpit.match(/data-mid-skybar="fourteen-row"/g)||[]).length,1,'14d Skybar-Vertrag darf nicht dupliziert werden.');

console.log('MID 18.2.13: PWA-Map-Fokus, SYNOP-Codegrenze, Sky-Kohärenz und DST-sichere Nacht-Skybars geschützt.');
